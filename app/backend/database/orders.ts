import "dotenv/config";
import type { Pedido, PedidoComItens, PedidoItem, InsertPedido, InsertPedidoItem, Product } from "./schema";
import { handleDbError } from "./errors";
import { restQuery } from "./rest";
import { checkAndNotifyLowStock } from "../services/stockAlert";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || "";

export async function createOrder(
  pedido: InsertPedido,
  itens: Omit<InsertPedidoItem, "pedido_id">[]
): Promise<PedidoComItens> {
  const { data: order, error: orderError } = await restQuery("pedidos", {
    method: "POST",
    body: pedido,
    single: true,
  });

  if (orderError) {
    handleDbError(orderError as { message: string; code?: string });
  }

  const pedidoId = (order as Pedido).id;

  const itensComPedidoId = itens.map((item) => ({
    ...item,
    pedido_id: pedidoId,
  }));

  const { data: insertedItens, error: itensError } = await restQuery("pedido_itens", {
    method: "POST",
    body: itensComPedidoId,
  });

  if (itensError) {
    handleDbError(itensError as { message: string; code?: string });
  }

  const itensComProduto = await attachProducts(insertedItens as PedidoItem[] || []);

  return {
    ...(order as Pedido),
    itens: itensComProduto,
  };
}

export async function listOrders(token?: string): Promise<PedidoComItens[]> {
  const quarentaDiasAtras = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const { data: orders, error: ordersError } = await restQuery(`pedidos?order=criado_em.desc&criado_em=gte.${quarentaDiasAtras}`, { token });

  if (ordersError) handleDbError(ordersError as { message: string; code?: string });

  const pedidos = orders as Pedido[] || [];
  if (pedidos.length === 0) return [];

  const pedidoIds = pedidos.map((o) => o.id);

  const { data: allItens } = await restQuery(`pedido_itens?pedido_id=in.(${pedidoIds.join(",")})`, { token });

  if (!allItens) return pedidos.map((o) => ({ ...o, itens: [] }));

  const itensList = allItens as PedidoItem[];
  const productIds = [...new Set(itensList.map((i) => i.product_id))];

  const { data: allProducts } = await restQuery(
    productIds.length > 0
      ? `products?select=id,nome,preco,imagem,marca,litros,categoria,quantidade_estoque,numero_produto&id=in.(${productIds.join(",")})`
      : "products?select=id,nome,preco,imagem,marca,litros,categoria,quantidade_estoque,numero_produto&id=is.null",
    { token }
  );

  const productsMap = new Map<number, Product>((allProducts as Product[] || []).map((p) => [p.id, p]));

  const itensPorPedido = new Map<number, PedidoComItens["itens"]>();
  for (const item of itensList) {
    const prev = itensPorPedido.get(item.pedido_id) || [];
    prev.push({ ...item, produto: productsMap.get(item.product_id) || ({} as Product) });
    itensPorPedido.set(item.pedido_id, prev);
  }

  return pedidos.map((order) => ({
    ...order,
    itens: itensPorPedido.get(order.id) || [],
  }));
}

export async function getOrderById(id: number, token?: string): Promise<PedidoComItens | null> {
  const { data: order, error: orderError } = await restQuery(`pedidos?id=eq.${id}`, {
    single: true,
    token,
  });

  if (orderError) return null;

  const { data: itens } = await restQuery(`pedido_itens?pedido_id=eq.${(order as Pedido).id}`, { token });

  const itensComProduto = await attachProducts(itens as PedidoItem[] || []);
  return { ...(order as Pedido), itens: itensComProduto };
}

export async function updateOrderStatus(
  id: number,
  status: Pedido["status"],
  token?: string
): Promise<PedidoComItens> {
  const { data: current } = await restQuery(`pedidos?select=status&id=eq.${id}`, {
    single: true,
    token,
  });

  const statusAnterior = (current as Pedido | null)?.status;

  const { error } = await restQuery(`pedidos?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Prefer": "return=minimal" },
    body: { status },
    token,
  });

  if (error) handleDbError(error as { message: string; code?: string });

  if (status === "pago" && statusAnterior !== "pago") {
    await deductOrderStock(id, token);
  }

  if (statusAnterior === "pago" && status !== "pago") {
    await restoreOrderStock(id, token);
  }

  // compatibilidade com status "confirmado" (pedidos antigos)
  if (status === "confirmado" && statusAnterior !== "confirmado" && statusAnterior !== "pago") {
    await deductOrderStock(id, token);
  }

  if (statusAnterior === "confirmado" && status !== "confirmado" && status !== "pago") {
    await restoreOrderStock(id, token);
  }

  return getOrderById(id, token) as Promise<PedidoComItens>;
}

async function deductOrderStock(pedidoId: number, token?: string) {
  const { data: itens } = await restQuery(`pedido_itens?pedido_id=eq.${pedidoId}`, { token });
  const itemList = itens as PedidoItem[] || [];

  await Promise.all(itemList.map(async (item) => {
    const { data: product } = await restQuery(`products?select=quantidade_estoque&id=eq.${item.product_id}`, {
      single: true,
      token,
    });

    const qtdAnterior = (product as { quantidade_estoque: number })?.quantidade_estoque ?? 0;
    const qtdNova = Math.max(0, qtdAnterior - item.quantidade);

    const [patchResult, _] = await Promise.all([
      restQuery(`products?id=eq.${item.product_id}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: { quantidade_estoque: qtdNova },
        token,
      }),
      restQuery("historico_estoque", {
        method: "POST",
        body: {
          product_id: item.product_id,
          user_id: null,
          tipo: "saida_venda",
          quantidade_anterior: qtdAnterior,
          quantidade_nova: qtdNova,
          diferenca: -item.quantidade,
          observacao: `Venda confirmada - Pedido #${pedidoId}`,
        },
        token,
      }),
    ]);

    if (patchResult.error) handleDbError(patchResult.error as { message: string; code?: string });
  }));

  checkAndNotifyLowStock().catch(() => {});
}

async function restoreOrderStock(pedidoId: number, token?: string) {
  const { data: itens } = await restQuery(`pedido_itens?pedido_id=eq.${pedidoId}`, { token });
  const itemList = itens as PedidoItem[] || [];

  await Promise.all(itemList.map(async (item) => {
    const { data: product } = await restQuery(`products?select=quantidade_estoque&id=eq.${item.product_id}`, {
      single: true,
      token,
    });

    const qtdAnterior = (product as { quantidade_estoque: number })?.quantidade_estoque ?? 0;
    const qtdNova = qtdAnterior + item.quantidade;

    const [patchResult, _] = await Promise.all([
      restQuery(`products?id=eq.${item.product_id}`, {
        method: "PATCH",
        headers: { "Prefer": "return=minimal" },
        body: { quantidade_estoque: qtdNova },
        token,
      }),
      restQuery("historico_estoque", {
        method: "POST",
        body: {
          product_id: item.product_id,
          user_id: null,
          tipo: "entrada",
          quantidade_anterior: qtdAnterior,
          quantidade_nova: qtdNova,
          diferenca: item.quantidade,
          observacao: `Estorno - Pedido #${pedidoId} deixou de ser confirmado`,
        },
        token,
      }),
    ]);

    if (patchResult.error) handleDbError(patchResult.error as { message: string; code?: string });
  }));
}

async function attachProducts(itens: PedidoItem[]): Promise<PedidoComItens["itens"]> {
  if (!itens || itens.length === 0) return [];

  const productIds = [...new Set(itens.map((i) => i.product_id))];
  const { data: allProducts } = await restQuery(
    `products?select=id,nome,preco,imagem,marca,litros,categoria,quantidade_estoque,numero_produto&id=in.(${productIds.join(",")})`
  );
  const productsMap = new Map<number, Product>((allProducts as Product[] || []).map((p) => [p.id, p]));

  return itens.map((item) => ({
    ...item,
    produto: productsMap.get(item.product_id) || ({} as Product),
  }));
}
