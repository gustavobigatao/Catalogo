export type Product = {
  id: number;
  numero_produto: string;
  nome: string;
  marca: string | null;
  litros: number | null;
  categoria: string;
  preco: number;
  imagem: string | null;
  quantidade_estoque: number;
  criado_em: string;
  atualizado_em: string;
};

export type InsertProduct = Omit<
  Product,
  "id" | "criado_em" | "atualizado_em"
>;

export type User = {
  id: number;
  supabase_uid: string;
  name: string | null;
  email: string | null;
  avatar: string | null;
  role: "user" | "admin";
  criado_em: string;
  atualizado_em: string;
};

export type InsertUser = Omit<
  User,
  "id" | "criado_em" | "atualizado_em"
> & {
  role?: "user" | "admin";
};

export type FormaPagamento = "debito" | "credito" | "pix";

export type Pedido = {
  id: number;
  user_id: number | null;
  cliente_nome: string;
  cliente_telefone: string | null;
  forma_pagamento: FormaPagamento | null;
  status: "pendente" | "confirmado" | "cancelado" | "entregue" | "pago";
  total: number;
  frete: number | null;
  observacao: string | null;
  criado_em: string;
  atualizado_em: string;
};

export type PedidoItem = {
  id: number;
  pedido_id: number;
  product_id: number;
  quantidade: number;
  preco_unitario: number;
  subtotal: number;
  criado_em: string;
};

export type PedidoComItens = Pedido & {
  itens: (PedidoItem & { produto: Product })[];
};

export type InsertPedido = Omit<
  Pedido,
  "id" | "criado_em" | "atualizado_em"
>;

export type InsertPedidoItem = Omit<
  PedidoItem,
  "id" | "criado_em"
>;

export type HistoricoEstoque = {
  id: number;
  product_id: number;
  user_id: number | null;
  tipo: "entrada" | "saida_venda" | "saida_avaria" | "ajuste";
  quantidade_anterior: number;
  quantidade_nova: number;
  diferenca: number;
  observacao: string | null;
  criado_em: string;
};
