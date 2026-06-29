import "dotenv/config";
import { getSupabase } from "../config/supabase";

const sampleProducts = [
  {
    numero_produto: "ZC-001",
    nome: "Shampoo Automotivo Concentrado",
    marca: "3M",
    litros: 5.0,
    preco: 89.9,
    imagem: null,
    quantidade_estoque: 25,
  },
  {
    numero_produto: "ZC-002",
    nome: "Cera Líquida Premium",
    marca: "Mothers",
    litros: 0.473,
    preco: 79.9,
    imagem: null,
    quantidade_estoque: 12,
  },
  {
    numero_produto: "ZC-003",
    nome: "Limpador de Motor a Base de Água",
    marca: "Vonixx",
    litros: 1.0,
    preco: 45.0,
    imagem: null,
    quantidade_estoque: 0,
  },
  {
    numero_produto: "ZC-004",
    nome: "Descontaminante de Pintura",
    marca: "3M",
    litros: 0.5,
    preco: 65.0,
    imagem: null,
    quantidade_estoque: 8,
  },
  {
    numero_produto: "ZC-005",
    nome: "Selante Cerâmico Híbrido",
    marca: "Mothers",
    litros: 0.236,
    preco: 129.9,
    imagem: null,
    quantidade_estoque: 15,
  },
  {
    numero_produto: "ZC-006",
    nome: "APC Multiuso Concentrado",
    marca: "Vonixx",
    litros: 5.0,
    preco: 95.0,
    imagem: null,
    quantidade_estoque: 30,
  },
  {
    numero_produto: "ZC-007",
    nome: "Shampoo Neutro Super Concentrado",
    marca: "Mandala",
    litros: 1.2,
    preco: 39.9,
    imagem: null,
    quantidade_estoque: 3,
  },
  {
    numero_produto: "ZC-008",
    nome: "Limpa Pneus em Gel",
    marca: "3M",
    litros: 0.5,
    preco: 55.0,
    imagem: null,
    quantidade_estoque: 18,
  },
  {
    numero_produto: "ZC-009",
    nome: "Removedor de Chuva Ácida",
    marca: "Vonixx",
    litros: 1.0,
    preco: 42.0,
    imagem: null,
    quantidade_estoque: 6,
  },
  {
    numero_produto: "ZC-010",
    nome: "Cera de Carnaúba Paste Wax",
    marca: "Mothers",
    litros: 0.34,
    preco: 149.9,
    imagem: null,
    quantidade_estoque: 10,
  },
  {
    numero_produto: "ZC-011",
    nome: "Limpador de Couro e Plásticos",
    marca: "Mandala",
    litros: 0.7,
    preco: 35.0,
    imagem: null,
    quantidade_estoque: 22,
  },
  {
    numero_produto: "ZC-012",
    nome: "Quick Detailer Spray",
    marca: "3M",
    litros: 0.5,
    preco: 49.9,
    imagem: null,
    quantidade_estoque: 14,
  },
];

async function seed() {
  console.log("Seeding products...");
  const supabase = getSupabase();

  const { error: deleteError } = await supabase
    .from("products")
    .delete()
    .neq("id", 0);

  if (deleteError) {
    console.error("Error clearing products:", deleteError.message);
    process.exit(1);
  }

  const { error: insertError } = await supabase
    .from("products")
    .insert(sampleProducts);

  if (insertError) {
    console.error("Error seeding products:", insertError.message);
    process.exit(1);
  }

  console.log(`✅ ${sampleProducts.length} products seeded successfully!`);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
