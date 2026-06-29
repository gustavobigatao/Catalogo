import { useState } from "react";
import { Minus, Plus, Trash2, ShoppingCart, Package } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { toast } from "sonner";
import { formatCurrency } from "../utils/formatters";

export default function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    removeItem,
    updateQuantity,
    totalItems,
    totalPrice,
  } = useCart();

  const [clienteNome, setClienteNome] = useState("");

  const handleCheckout = () => {
    if (items.length === 0) return;
    if (!clienteNome.trim()) {
      toast.error("Informe seu nome");
      return;
    }

    const itensMsg = items
      .map((item) => `${item.nome} - ${item.quantidade}x ${formatCurrency(item.preco)} = ${formatCurrency(item.preco * item.quantidade)}`)
      .join("\n");

    const mensagem = [
      `*NOVO PEDIDO*`,
      ``,
      `Cliente: ${clienteNome.trim()}`,
      ``,
      `Itens:`,
      itensMsg,
      ``,
      `Total: ${formatCurrency(totalPrice)}`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/5500000000000?text=${encodeURIComponent(mensagem)}`;
    window.open(url, "_blank");

    toast.success("Pedido simulado com sucesso!");
  };

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="w-full sm:max-w-md bg-white border-l border-gray-200 flex flex-col p-0">
        <SheetHeader className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <ShoppingCart className="w-5 h-5 text-blue-600" />
              Seu Carrinho
              {totalItems > 0 && (
                <span className="bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  {totalItems}
                </span>
              )}
            </SheetTitle>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <Package className="w-16 h-16 mb-4" />
              <p className="text-lg font-medium">Seu carrinho está vazio</p>
              <p className="text-sm mt-1">Adicione produtos do catálogo</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="w-16 h-16 bg-white rounded-md flex items-center justify-center flex-shrink-0 border border-gray-200">
                    {item.imagem ? (
                      <img
                        src={item.imagem}
                        alt={item.nome}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-blue-300" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {item.nome}
                    </h4>
                    {item.marca && <p className="text-xs text-gray-500">{item.marca}</p>}
                    <p className="text-sm font-bold text-blue-700 mt-1">
                      {formatCurrency(item.preco * item.quantidade)}
                    </p>

                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantidade - 1)
                        }
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-semibold w-6 text-center">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.productId, item.quantidade + 1)
                        }
                        disabled={item.quantidade >= item.estoqueDisponivel}
                        className="w-7 h-7 flex items-center justify-center bg-white border border-gray-200 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeItem(item.productId)}
                        className="ml-auto w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="px-4 py-4 border-t border-gray-100 bg-gray-50">
            <div className="space-y-2 mb-4">
              <input
                type="text"
                placeholder="Seu nome *"
                value={clienteNome}
                onChange={(e) => setClienteNome(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-gray-600 text-sm">Subtotal ({totalItems} itens)</span>
              <span className="text-xl font-bold text-gray-900">
                {formatCurrency(totalPrice)}
              </span>
            </div>
            <Button
              onClick={handleCheckout}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold h-12 text-base"
            >
              Simular Pedido
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
