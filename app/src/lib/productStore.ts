import type { Product, ProductFormData } from "./types";

const STORAGE_KEY = "catalog_products";
let nextId = 1;

function load(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw) as Product[];
      nextId = Math.max(0, ...data.map((p) => p.id)) + 1;
      return data;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function save(products: Product[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products));
}

function now() {
  return new Date().toISOString();
}

const defaultProducts: Product[] = [
  { id: 1, numero_produto: "001", nome: "Produto Exemplo 1", marca: "Marca A", litros: 1, categoria: "Categoria A", preco: 49.9, imagem: null, quantidade_estoque: 10, criado_em: now(), atualizado_em: now() },
  { id: 2, numero_produto: "002", nome: "Produto Exemplo 2", marca: "Marca B", litros: 5, categoria: "Categoria B", preco: 89.9, imagem: null, quantidade_estoque: 5, criado_em: now(), atualizado_em: now() },
  { id: 3, numero_produto: "003", nome: "Produto Exemplo 3", marca: "Marca A", litros: 0.5, categoria: "Categoria A", preco: 29.9, imagem: null, quantidade_estoque: 20, criado_em: now(), atualizado_em: now() },
  { id: 4, numero_produto: "004", nome: "Produto Exemplo 4", marca: null, litros: null, categoria: "Categoria C", preco: 149.9, imagem: null, quantidade_estoque: 3, criado_em: now(), atualizado_em: now() },
  { id: 5, numero_produto: "005", nome: "Produto Exemplo 5", marca: "Marca C", litros: 2, categoria: "Categoria B", preco: 199.9, imagem: null, quantidade_estoque: 0, criado_em: now(), atualizado_em: now() },
];

function seedIfEmpty() {
  const products = load();
  if (products.length === 0) {
    save(defaultProducts);
    nextId = 6;
  }
}

export function getAllProducts(): Product[] {
  seedIfEmpty();
  return load();
}

export function getProductById(id: number): Product | undefined {
  return getAllProducts().find((p) => p.id === id);
}

export function createProduct(data: ProductFormData): Product {
  const products = getAllProducts();
  const product: Product = {
    id: nextId++,
    numero_produto: data.numero_produto,
    nome: data.nome,
    marca: data.marca ?? null,
    litros: data.litros ?? null,
    categoria: data.categoria,
    preco: data.preco,
    imagem: data.imagem ?? null,
    quantidade_estoque: data.quantidade_estoque,
    criado_em: now(),
    atualizado_em: now(),
  };
  products.push(product);
  save(products);
  return product;
}

export function updateProduct(id: number, data: Partial<ProductFormData>): Product | undefined {
  const products = getAllProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return undefined;
  const existing = products[index];
  products[index] = {
    ...existing,
    ...(data.numero_produto !== undefined ? { numero_produto: data.numero_produto } : {}),
    ...(data.nome !== undefined ? { nome: data.nome } : {}),
    ...(data.marca !== undefined ? { marca: data.marca ?? null } : {}),
    ...(data.litros !== undefined ? { litros: data.litros ?? null } : {}),
    ...(data.categoria !== undefined ? { categoria: data.categoria } : {}),
    ...(data.preco !== undefined ? { preco: data.preco } : {}),
    ...(data.imagem !== undefined ? { imagem: data.imagem ?? null } : {}),
    ...(data.quantidade_estoque !== undefined ? { quantidade_estoque: data.quantidade_estoque } : {}),
    atualizado_em: now(),
  };
  save(products);
  return products[index];
}

export function deleteProduct(id: number): boolean {
  const products = getAllProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) return false;
  products.splice(index, 1);
  save(products);
  return true;
}

export function getFilterOptions() {
  const products = getAllProducts();
  const marcas = [...new Set(products.map((p) => p.marca).filter(Boolean))] as string[];
  const categorias = [...new Set(products.map((p) => p.categoria))];
  return { marcas: marcas.sort(), categorias: categorias.sort() };
}
