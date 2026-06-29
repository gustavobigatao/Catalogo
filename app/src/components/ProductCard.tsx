import { ShoppingCart, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import type { Product } from "@/lib/types";
import { formatCurrency, formatVolume } from "../utils/formatters";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();

  const emEstoque = product.quantidade_estoque > 0;
  const poucoEstoque = product.quantidade_estoque > 0 && product.quantidade_estoque <= 5;

  const handleAddToCart = () => {
    if (!emEstoque) return;
    addItem({
      productId: product.id,
      nome: product.nome,
      marca: product.marca,
      litros: product.litros,
      preco: product.preco,
      imagem: product.imagem,
      estoqueDisponivel: product.quantidade_estoque,
    });
  };

  return (
    <div className="group bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-xl transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative aspect-square bg-white flex items-center justify-center overflow-hidden">
        {product.imagem ? (
          <img
            src={product.imagem}
            alt={product.nome}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <Package className="w-16 h-16 text-blue-200" />
        )}

        <div className="absolute top-2 right-2">
          {!emEstoque ? (
            <span className="px-2 py-1 bg-red-500 text-white text-xs font-semibold rounded-md">
              Esgotado
            </span>
          ) : (
            <span className={`px-2 py-1 text-white text-xs font-semibold rounded-md ${
              poucoEstoque ? "bg-amber-500" : "bg-emerald-500"
            }`}>
              {product.quantidade_estoque} un.
            </span>
          )}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <span className="text-gray-400 text-xs font-medium mb-1">
          #{product.numero_produto}
        </span>
        <h3 className="text-gray-900 font-semibold text-base leading-tight mb-1 line-clamp-2">
          {product.nome}
        </h3>
        <div className="flex items-center gap-2 mb-1">
          <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-xs font-medium rounded">
            {product.categoria}
          </span>
          {product.marca && (
            <span className="text-gray-500 text-sm">{product.marca}</span>
          )}
        </div>
        {product.litros && (
          <p className="text-gray-400 text-xs mb-3">
            {formatVolume(product.litros)}
          </p>
        )}
        {!product.litros && <div className="mb-3" />}

        <div className="mt-auto flex items-center justify-between gap-2">
          <span className="text-blue-700 font-bold text-lg">
            {formatCurrency(product.preco)}
          </span>
          <Button
            onClick={handleAddToCart}
            disabled={!emEstoque}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            <ShoppingCart className="w-4 h-4 mr-1" />
            {emEstoque ? "Adicionar" : "Esgotado"}
          </Button>
        </div>
      </div>
    </div>
  );
}
