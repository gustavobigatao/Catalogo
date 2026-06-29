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

export type ProductFormData = {
  numero_produto: string;
  nome: string;
  marca?: string;
  litros?: number;
  categoria: string;
  preco: number;
  imagem?: string | null;
  quantidade_estoque: number;
};
