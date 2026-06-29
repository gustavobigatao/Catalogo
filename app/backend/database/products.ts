import { getSupabase } from "../config/supabase";
import type { Product, InsertProduct } from "./schema";
import { handleDbError, DatabaseError } from "./errors";
import { restQuery } from "./rest";
import { checkAndNotifyLowStock } from "../services/stockAlert";

export async function findAllProducts(filters?: {
  marca?: string;
  litros?: string;
  categoria?: string;
  search?: string;
  orderBy?: "preco_asc" | "preco_desc" | "nome_asc" | "nome_desc";
  lowStock?: boolean;
}): Promise<Product[]> {
  const supabase = getSupabase();
  let query = supabase.from("products").select("id,numero_produto,nome,marca,litros,categoria,preco,imagem,quantidade_estoque");

  if (filters?.marca) {
    query = query.eq("marca", filters.marca);
  }

  if (filters?.categoria) {
    query = query.eq("categoria", filters.categoria);
  }

  if (filters?.litros) {
    const parts = String(filters.litros).split("-");
    if (parts.length === 2) {
      const min = parseFloat(parts[0]);
      const max = parseFloat(parts[1]);
      query = query.gte("litros", min).lte("litros", max);
    }
  }

  if (filters?.search) {
    const term = `%${filters.search}%`;
    query = query.or(
      `nome.ilike.${term},marca.ilike.${term},numero_produto.ilike.${term}`
    );
  }

  if (filters?.lowStock) {
    query = query.lte("quantidade_estoque", 2);
  }

  const orderMap: Record<string, { column: string; ascending: boolean }> = {
    preco_asc: { column: "preco", ascending: true },
    preco_desc: { column: "preco", ascending: false },
    nome_asc: { column: "nome", ascending: true },
    nome_desc: { column: "nome", ascending: false },
  };

  const order = filters?.orderBy
    ? orderMap[filters.orderBy]
    : { column: "nome", ascending: true };

  query = query.order(order.column, { ascending: order.ascending });

  const { data, error } = await query;

  if (error) handleDbError(error);
  return (data as Product[]) || [];
}

export async function findProductById(id: number): Promise<Product | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return data as Product;
}

export async function createProduct(data: InsertProduct, token?: string): Promise<Product> {
  const { data: product, error } = await restQuery("products", {
    method: "POST",
    body: data,
    single: true,
    token,
  });

  if (error) handleDbError(error as { message: string; code?: string });
  return product as Product;
}

export async function updateProduct(
  id: number,
  data: Partial<InsertProduct>,
  token?: string
): Promise<Product> {
  const { data: product, error } = await restQuery(`products?id=eq.${id}`, {
    method: "PATCH",
    headers: { "Prefer": "return=representation" },
    body: data,
    single: true,
    token,
  });

  if (error) handleDbError(error as { message: string; code?: string });

  checkAndNotifyLowStock().catch(() => {});

  return product as Product;
}

export async function deleteProduct(id: number, token?: string): Promise<{ success: boolean }> {
  // Verifica se há pedidos ativos com este produto
  if (token) {
    const { data: itens } = await restQuery(`pedido_itens?product_id=eq.${id}&select=pedido_id`, { token });

    if (itens && Array.isArray(itens) && itens.length > 0) {
      const pedidoIds = [...new Set((itens as { pedido_id: number }[]).map(i => i.pedido_id))];

      const { data: pedidosAtivos } = await restQuery(
        `pedidos?id=in.(${pedidoIds.join(",")})&status=in.(pendente,pago,confirmado)&select=id,status`,
        { token }
      );

      if (pedidosAtivos && Array.isArray(pedidosAtivos) && pedidosAtivos.length > 0) {
        throw new DatabaseError(
          "Este produto está em pedidos ativos (pendente/pago/confirmado) e não pode ser excluído.",
          "FK_VIOLATION"
        );
      }
    }
  }

  const { error } = await restQuery(`products?id=eq.${id}`, {
    method: "DELETE",
    token,
  });

  if (error) {
    const errMsg = (error as { message?: string })?.message || "";
    if (errMsg.includes("foreign key constraint")) {
      throw new DatabaseError(
        "Este produto está vinculado a pedidos e não pode ser excluído.",
        "FK_VIOLATION"
      );
    }
    handleDbError(error as { message: string; code?: string });
  }
  return { success: true };
}

export async function updateStock(
  id: number,
  quantidade: number,
  token?: string
): Promise<Product> {
  return updateProduct(id, { quantidade_estoque: quantidade }, token);
}

export async function getUniqueFilters(): Promise<{
  marcas: string[];
  litros: number[];
  categorias: string[];
}> {
  const supabase = getSupabase();

  const [marcasResult, litrosResult, categoriasResult] = await Promise.all([
    supabase.from("products").select("marca").order("marca"),
    supabase.from("products").select("litros").order("litros"),
    supabase.from("products").select("categoria").order("categoria"),
  ]);

  if (marcasResult.error) handleDbError(marcasResult.error);
  if (litrosResult.error) handleDbError(litrosResult.error);
  if (categoriasResult.error) handleDbError(categoriasResult.error);

  const marcas = [...new Set<string>((marcasResult.data as { marca: string }[]).map((r) => r.marca))].filter(Boolean);
  const litros = [
    ...new Set<number>((litrosResult.data as { litros: number }[]).map((r) => r.litros)),
  ];
  const categorias = [
    ...new Set<string>((categoriasResult.data as { categoria: string }[]).map((r) => r.categoria)),
  ].filter(Boolean);

  return { marcas, litros, categorias };
}
