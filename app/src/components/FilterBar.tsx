import { Search, Filter, X, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useMemo, useEffect, useRef } from "react";

export interface FilterState {
  search: string;
  marca: string;
  litros: string;
  categoria: string;
  orderBy: string;
}

const LITROS_RANGES = [
  { value: "0-1", label: "Até 1L" },
  { value: "1-2", label: "1L a 2L" },
  { value: "2-3", label: "2L a 3L" },
  { value: "3-4", label: "3L a 4L" },
  { value: "4-999", label: "Mais de 4L" },
];

const ORDER_OPTIONS = [
  { value: "nome_asc", label: "Nome A-Z" },
  { value: "nome_desc", label: "Nome Z-A" },
  { value: "preco_asc", label: "Menor preço" },
  { value: "preco_desc", label: "Maior preço" },
];

interface FilterBarProps {
  marcas: string[];
  categorias: string[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
}

function countActiveFilters(filters: FilterState) {
  let count = 0;
  if (filters.marca) count++;
  if (filters.litros) count++;
  if (filters.categoria) count++;
  if (filters.orderBy) count++;
  return count;
}

export default function FilterBar({
  marcas,
  categorias,
  filters,
  onFiltersChange,
}: FilterBarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.search);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 400);
  };

  const hasActiveFilters =
    filters.search || filters.marca || filters.litros || filters.categoria || filters.orderBy;

  const activeCount = useMemo(() => countActiveFilters(filters), [filters]);

  const clearFilters = () => {
    onFiltersChange({ search: "", marca: "", litros: "", categoria: "", orderBy: "" });
  };

  const activeFilterChips = useMemo(() => {
    const chips: { label: string; onRemove: () => void }[] = [];
    if (filters.marca)
      chips.push({ label: filters.marca, onRemove: () => onFiltersChange({ ...filters, marca: "" }) });
    if (filters.litros) {
      const r = LITROS_RANGES.find((r) => r.value === filters.litros);
      chips.push({ label: r?.label || filters.litros, onRemove: () => onFiltersChange({ ...filters, litros: "" }) });
    }
    if (filters.categoria)
      chips.push({ label: filters.categoria, onRemove: () => onFiltersChange({ ...filters, categoria: "" }) });
    if (filters.orderBy) {
      const o = ORDER_OPTIONS.find((o) => o.value === filters.orderBy);
      chips.push({ label: o?.label || filters.orderBy, onRemove: () => onFiltersChange({ ...filters, orderBy: "" }) });
    }
    return chips;
  }, [filters, onFiltersChange]);

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        {/* Desktop filters */}
        <div className="hidden md:flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Buscar produtos..."
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9 h-9 text-sm border-gray-300 focus-visible:ring-blue-500"
            />
          </div>

          <Select
            value={filters.marca}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, marca: value })
            }
          >
            <SelectTrigger className="w-40 h-9 text-sm border-gray-300 data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
              <SelectValue placeholder="Marca" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {marcas.map((marca) => (
                <SelectItem key={marca} value={marca}>
                  {marca}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.litros}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, litros: value })
            }
          >
            <SelectTrigger className="w-40 h-9 text-sm border-gray-300 data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
              <SelectValue placeholder="Litros" />
            </SelectTrigger>
            <SelectContent>
              {LITROS_RANGES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.categoria}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, categoria: value })
            }
          >
            <SelectTrigger className="w-40 h-9 text-sm border-gray-300 data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {categorias.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.orderBy}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, orderBy: value })
            }
          >
            <SelectTrigger className="w-44 h-9 text-sm border-gray-300 data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-9 text-gray-500 hover:text-red-500 hover:bg-red-50 shrink-0"
            >
              <X className="w-4 h-4 mr-1" />
              Limpar
            </Button>
          )}
        </div>

        {/* Mobile filters */}
        <div className="md:hidden">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Buscar produtos..."
                value={searchInput}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9 h-10 text-sm border-gray-300 focus-visible:ring-blue-500"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileOpen(!mobileOpen)}
              className={`h-10 px-3 relative ${activeCount > 0 ? "border-blue-400 text-blue-600 bg-blue-50" : ""}`}
            >
              <Filter className="w-4 h-4" />
              {activeCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-blue-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </Button>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-10 px-2 text-gray-400 hover:text-red-500"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Active filter chips */}
          {activeFilterChips.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {activeFilterChips.map((chip, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200"
                >
                  {chip.label}
                  <button
                    onClick={chip.onRemove}
                    className="ml-0.5 hover:text-blue-900"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div
            className={`overflow-hidden transition-all duration-200 ease-in-out ${
              mobileOpen ? "max-h-96 opacity-100 mt-3" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex flex-col gap-2 pb-2">
              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">
                  Marca
                </span>
                <Select
                  value={filters.marca}
                  onValueChange={(value) => {
                    onFiltersChange({ ...filters, marca: value });
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-sm data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
                    <SelectValue placeholder="Selecione uma marca" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {marcas.map((marca) => (
                      <SelectItem key={marca} value={marca}>
                        {marca}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">
                  Litros
                </span>
                <Select
                  value={filters.litros}
                  onValueChange={(value) => {
                    onFiltersChange({ ...filters, litros: value });
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-sm data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
                    <SelectValue placeholder="Selecione a embalagem" />
                  </SelectTrigger>
                  <SelectContent>
                    {LITROS_RANGES.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">
                  Categoria
                </span>
                <Select
                  value={filters.categoria}
                  onValueChange={(value) => {
                    onFiltersChange({ ...filters, categoria: value });
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-sm data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {categorias.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <span className="text-[11px] uppercase tracking-wider text-gray-400 font-medium mb-1.5 block">
                  Ordenar
                </span>
                <Select
                  value={filters.orderBy}
                  onValueChange={(value) => {
                    onFiltersChange({ ...filters, orderBy: value });
                  }}
                >
                  <SelectTrigger className="w-full h-10 text-sm data-[state=open]:border-blue-400 data-[state=open]:ring-1 data-[state=open]:ring-blue-400">
                    <SelectValue placeholder="Ordenar produtos" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
