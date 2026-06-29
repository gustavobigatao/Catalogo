import { useState, useRef, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import FilterBar, { type FilterState } from "@/components/FilterBar";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, ChevronDown } from "lucide-react";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import { getAllProducts, getFilterOptions } from "@/lib/productStore";
import type { Product } from "@/lib/types";

const INCREMENT = 20;

function filterProducts(products: Product[], filters: FilterState): Product[] {
  let result = [...products];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.nome.toLowerCase().includes(q) ||
        p.marca?.toLowerCase().includes(q) ||
        p.categoria.toLowerCase().includes(q)
    );
  }

  if (filters.marca) {
    result = result.filter((p) => p.marca === filters.marca);
  }

  if (filters.litros) {
    const litrosNum = parseFloat(filters.litros);
    if (!isNaN(litrosNum)) {
      result = result.filter((p) => p.litros !== null && p.litros <= litrosNum);
    } else {
      const [min, max] = filters.litros.split("-").map(Number);
      if (!isNaN(min) && !isNaN(max)) {
        result = result.filter(
          (p) => p.litros !== null && p.litros >= min && p.litros <= max
        );
      }
    }
  }

  if (filters.categoria) {
    result = result.filter((p) => p.categoria === filters.categoria);
  }

  if (filters.orderBy) {
    switch (filters.orderBy) {
      case "nome_asc":
        result.sort((a, b) => a.nome.localeCompare(b.nome));
        break;
      case "nome_desc":
        result.sort((a, b) => b.nome.localeCompare(a.nome));
        break;
      case "preco_asc":
        result.sort((a, b) => a.preco - b.preco);
        break;
      case "preco_desc":
        result.sort((a, b) => b.preco - a.preco);
        break;
    }
  }

  return result;
}

function Catalog() {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    marca: "",
    litros: "",
    categoria: "",
    orderBy: "",
  });

  const allProducts = useMemo(() => getAllProducts(), []);
  const filtered = useMemo(() => filterProducts(allProducts, filters), [allProducts, filters]);
  const filterOptions = useMemo(() => getFilterOptions(), []);

  const [visibleCount, setVisibleCount] = useState(INCREMENT);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(INCREMENT);
  }, [filters]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + INCREMENT, filtered.length));
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [filtered.length]);

  const displayedProducts = filtered.slice(0, visibleCount);
  const hasMore = visibleCount < filtered.length;
  const filteredCount = filtered.length;

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      <Navbar />
      <CartDrawer />
      <FilterBar
        marcas={filterOptions.marcas}
        categorias={filterOptions.categorias}
        filters={filters}
        onFiltersChange={setFilters}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Catálogo de Produtos
          </h1>
          <p className="text-gray-500 mt-1 text-sm sm:text-base">
            Confira nossos produtos disponíveis
          </p>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm text-gray-500">
            <span className="font-semibold text-gray-700">{filteredCount}</span>{" "}
            produto{filteredCount !== 1 ? "s" : ""} encontrado
            {filteredCount !== 1 ? "s" : ""}
          </span>
        </div>

        {filtered.length > 0 ? (
          <div className="relative">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {displayedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {hasMore && (
              <>
                <div ref={sentinelRef} className="h-4" />
                <div className="flex justify-center mt-4 mb-8">
                  <button
                    onClick={() => setVisibleCount((prev) => Math.min(prev + INCREMENT, filtered.length))}
                    className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full shadow-sm hover:bg-gray-50 transition-colors text-sm font-medium text-gray-600"
                  >
                    <ChevronDown className="w-4 h-4" />
                    Carregar mais produtos
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <Package className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">Nenhum produto encontrado</p>
            <p className="text-sm mt-1">
              Tente ajustar os filtros ou buscar por outro termo
            </p>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <CartProvider>
      <Catalog />
      <Toaster position="top-right" richColors />
    </CartProvider>
  );
}
