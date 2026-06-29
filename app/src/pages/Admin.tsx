import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import ProductForm from "@/components/ProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster, toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Package,
  ArrowLeft,
  Search,
  AlertTriangle,
  ShoppingBag,
  FileText,
  Download,
  X,
} from "lucide-react";
import type { Product, ProductFormData } from "@/lib/types";
import {
  getAllProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/lib/productStore";
import { formatCurrency, formatVolume } from "../utils/formatters";

type ViewState = "list" | "create" | "edit";
type TabState = "products" | "orders";

export default function Admin() {
  const navigate = useNavigate();
  const [view, setView] = useState<ViewState>("list");
  const [tab, setTab] = useState<TabState>("products");
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
  }, [searchTerm]);

  useEffect(() => {
    let list = getAllProducts();
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.nome.toLowerCase().includes(q) ||
          p.marca?.toLowerCase().includes(q) ||
          p.categoria.toLowerCase().includes(q) ||
          p.numero_produto.toLowerCase().includes(q)
      );
    }
    if (lowStockFilter) {
      list = list.filter((p) => p.quantidade_estoque <= 5);
    }
    setProducts(list);
  }, [debouncedSearch, lowStockFilter, refreshKey]);

  const handleCreate = (data: ProductFormData) => {
    createProduct(data);
    toast.success("Produto criado com sucesso!");
    setView("list");
    setRefreshKey((k) => k + 1);
  };

  const handleUpdate = (data: ProductFormData) => {
    if (!editingProduct) return;
    updateProduct(editingProduct.id, data);
    toast.success("Produto atualizado com sucesso!");
    setView("list");
    setEditingProduct(null);
    setRefreshKey((k) => k + 1);
  };

  const handleDelete = (id: number) => {
    deleteProduct(id);
    toast.success("Produto removido com sucesso!");
    setDeleteConfirm(null);
    setRefreshKey((k) => k + 1);
  };

  const getStockBadge = (estoque: number) => {
    if (estoque === 0)
      return (
        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded-full">
          Esgotado
        </span>
      );
    if (estoque <= 5)
      return (
        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
          {estoque} un.
        </span>
      );
    return (
      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
        {estoque} un.
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-right" richColors />

      <header className="bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate("/")}
                className="text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 bg-white/10 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">PC</span>
                </div>
                <span className="font-bold text-lg">Painel Administrativo</span>
              </div>
              <div className="ml-6 flex items-center gap-1">
                <button
                  onClick={() => setTab("products")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    tab === "products"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <Package className="w-4 h-4 inline mr-1" />
                  Produtos
                </button>
                <button
                  onClick={() => setTab("orders")}
                  className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                    tab === "orders"
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:text-white"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4 inline mr-1" />
                  Pedidos
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {tab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Pedidos</h1>
                <p className="text-gray-500 text-sm mt-1">
                  Gerencie os pedidos recebidos
                </p>
              </div>
              <Button
                onClick={() => setShowReport(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <FileText className="w-4 h-4 mr-2" />
                Relatório do Mês
              </Button>
            </div>

            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">
                Nenhum pedido recebido
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Os pedidos aparecerão aqui quando clientes finalizarem compras
              </p>
            </div>
          </div>
        )}

        {tab === "orders" && showReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowReport(false)}>
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Relatório de Vendas do Mês</h2>
                <button onClick={() => setShowReport(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="px-6 py-4 space-y-4">
                <p className="text-sm text-gray-500 text-center capitalize">
                  {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-blue-700">0</p>
                    <p className="text-xs text-blue-600 font-medium">Pedidos</p>
                  </div>
                  <div className="bg-emerald-50 rounded-lg p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-700">{formatCurrency(0)}</p>
                    <p className="text-xs text-emerald-600 font-medium">Faturamento</p>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Status</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm px-3 py-1.5 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Pendente</span>
                      <span className="font-semibold text-gray-900">0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Por Forma de Pagamento</h3>
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-sm px-3 py-1.5 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Nenhum dado</span>
                      <span className="font-semibold text-gray-900">{formatCurrency(0)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled>
                  <Download className="w-4 h-4 mr-2" />
                  Baixar Excel
                </Button>
              </div>
            </div>
          </div>
        )}

        {tab === "products" && view === "create" && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => setView("list")}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para lista
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Novo Produto</h1>
            </div>
            <ProductForm
              onSubmit={handleCreate}
              onCancel={() => setView("list")}
            />
          </div>
        )}

        {tab === "products" && view === "edit" && editingProduct && (
          <div>
            <div className="mb-6">
              <button
                onClick={() => {
                  setView("list");
                  setEditingProduct(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para lista
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Editar Produto</h1>
            </div>
            <ProductForm
              product={editingProduct}
              onSubmit={handleUpdate}
              onCancel={() => {
                setView("list");
                setEditingProduct(null);
              }}
            />
          </div>
        )}

        {tab === "products" && view === "list" && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Produtos
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                  Gerencie os produtos do catálogo
                </p>
              </div>
              <Button
                onClick={() => setView("create")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Novo Produto
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant={lowStockFilter ? "default" : "outline"}
                size="sm"
                onClick={() => setLowStockFilter((prev) => !prev)}
                className={lowStockFilter ? "bg-red-600 hover:bg-red-700 text-white" : "text-red-600 border-red-300 hover:bg-red-50"}
              >
                <AlertTriangle className="w-4 h-4 mr-1.5" />
                Estoque baixo
              </Button>
            </div>

            {products.length > 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                          Nº
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                          Nome
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                          Marca
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">
                          Litros
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">
                          Categoria
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                          Preço
                        </th>
                        <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                          Estoque
                        </th>
                        <th className="text-right text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {products.map((product) => (
                        <tr
                          key={product.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {product.numero_produto}
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-medium text-gray-900">
                              {product.nome}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                            {product.marca || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                            {product.litros ? formatVolume(product.litros) : "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 hidden sm:table-cell">
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs font-medium rounded-full">
                              {product.categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm font-semibold text-blue-700">
                            {formatCurrency(product.preco)}
                          </td>
                          <td className="px-4 py-3">
                            {getStockBadge(product.quantidade_estoque)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setEditingProduct(product);
                                  setView("edit");
                                }}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                title="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              {deleteConfirm === product.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(product.id)}
                                    className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                                  >
                                    Confirmar
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300 transition-colors"
                                  >
                                    Cancelar
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() =>
                                    setDeleteConfirm(product.id)
                                  }
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                  title="Excluir"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">
                  {searchTerm
                    ? "Nenhum produto encontrado"
                    : "Nenhum produto cadastrado"}
                </p>
                {!searchTerm && (
                  <p className="text-gray-400 text-sm mt-1">
                    Clique em "Novo Produto" para adicionar
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
