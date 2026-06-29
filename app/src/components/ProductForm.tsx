import { useState, useEffect, useRef } from "react";
import { X, Upload, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import type { Product } from "@/lib/types";

interface ProductFormProps {
  product?: Product | null;
  onSubmit: (data: {
    numero_produto: string;
    nome: string;
    categoria: string;
    marca?: string;
    litros?: number;
    preco: number;
    imagem?: string | null;
    quantidade_estoque: number;
  }) => void;
  onCancel: () => void;
}

export default function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [formData, setFormData] = useState({
    numero_produto: "",
    nome: "",
    categoria: "",
    marca: "",
    litros: "",
    preco: "",
    imagem: "",
    quantidade_estoque: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(product?.imagem || null);

  useEffect(() => {
    if (product) {
      setFormData({
        numero_produto: product.numero_produto,
        nome: product.nome,
        categoria: product.categoria || "",
        marca: product.marca || "",
        litros: product.litros ? String(product.litros) : "",
        preco: String(product.preco),
        imagem: product.imagem || "",
        quantidade_estoque: String(product.quantidade_estoque),
      });
      setImagePreview(product.imagem || null);
    }
  }, [product]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.numero_produto.trim()) newErrors.numero_produto = "Obrigatório";
    if (!formData.nome.trim()) newErrors.nome = "Obrigatório";
    if (!formData.categoria.trim()) newErrors.categoria = "Obrigatório";
    if (formData.litros && Number(formData.litros) <= 0) newErrors.litros = "Deve ser maior que 0";
    if (!formData.preco || Number(formData.preco) <= 0) newErrors.preco = "Deve ser maior que 0";
    if (formData.quantidade_estoque === "" || Number(formData.quantidade_estoque) < 0)
      newErrors.quantidade_estoque = "Deve ser 0 ou maior";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Selecione uma imagem válida");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande (máx 5MB)");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setImagePreview(dataUrl);
      setFormData((prev) => ({ ...prev, imagem: dataUrl }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, imagem: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    const imagemValue = formData.imagem.trim();
    const hasExistingImage = !!product?.imagem;

    onSubmit({
      numero_produto: formData.numero_produto.trim(),
      nome: formData.nome.trim(),
      categoria: formData.categoria.trim(),
      marca: formData.marca.trim() || undefined,
      litros: formData.litros ? Number(formData.litros) : undefined,
      preco: Number(formData.preco),
      imagem: imagemValue || (hasExistingImage ? null : undefined),
      quantidade_estoque: Number(formData.quantidade_estoque),
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">
          {product ? "Editar Produto" : "Novo Produto"}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="numero_produto" className="text-sm font-medium">
              Número do Produto <span className="text-red-500">*</span>
            </Label>
            <Input
              id="numero_produto"
              value={formData.numero_produto}
              onChange={(e) =>
                setFormData({ ...formData, numero_produto: e.target.value })
              }
              placeholder="Ex: CC-001"
              className={errors.numero_produto ? "border-red-300" : ""}
            />
            {errors.numero_produto && (
              <p className="text-xs text-red-500">{errors.numero_produto}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nome" className="text-sm font-medium">
              Nome <span className="text-red-500">*</span>
            </Label>
            <Input
              id="nome"
              value={formData.nome}
              onChange={(e) =>
                setFormData({ ...formData, nome: e.target.value })
              }
              placeholder="Nome do produto"
              className={errors.nome ? "border-red-300" : ""}
            />
            {errors.nome && (
              <p className="text-xs text-red-500">{errors.nome}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="categoria" className="text-sm font-medium">
              Categoria <span className="text-red-500">*</span>
            </Label>
            <Input
              id="categoria"
              value={formData.categoria}
              onChange={(e) =>
                setFormData({ ...formData, categoria: e.target.value })
              }
              placeholder="Ex: Silicone, Limpeza, Cera..."
              className={errors.categoria ? "border-red-300" : ""}
            />
            {errors.categoria && (
              <p className="text-xs text-red-500">{errors.categoria}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="marca" className="text-sm font-medium">
              Marca
            </Label>
            <Input
              id="marca"
              value={formData.marca}
              onChange={(e) =>
                setFormData({ ...formData, marca: e.target.value })
              }
              placeholder="Ex: 3M (opcional)"
              className={errors.marca ? "border-red-300" : ""}
            />
            {errors.marca && (
              <p className="text-xs text-red-500">{errors.marca}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="litros" className="text-sm font-medium">
              Litros
            </Label>
            <Input
              id="litros"
              type="number"
              step="0.01"
              value={formData.litros}
              onChange={(e) =>
                setFormData({ ...formData, litros: e.target.value })
              }
              placeholder="Ex: 5.0 (opcional)"
              className={errors.litros ? "border-red-300" : ""}
            />
            {errors.litros && (
              <p className="text-xs text-red-500">{errors.litros}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="preco" className="text-sm font-medium">
              Preço (R$) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="preco"
              type="number"
              step="0.01"
              value={formData.preco}
              onChange={(e) =>
                setFormData({ ...formData, preco: e.target.value })
              }
              placeholder="Ex: 89.90"
              className={errors.preco ? "border-red-300" : ""}
            />
            {errors.preco && (
              <p className="text-xs text-red-500">{errors.preco}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="quantidade_estoque" className="text-sm font-medium">
              Quantidade em Estoque <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantidade_estoque"
              type="number"
              value={formData.quantidade_estoque}
              onChange={(e) =>
                setFormData({ ...formData, quantidade_estoque: e.target.value })
              }
              placeholder="Ex: 20"
              className={errors.quantidade_estoque ? "border-red-300" : ""}
            />
            {errors.quantidade_estoque && (
              <p className="text-xs text-red-500">{errors.quantidade_estoque}</p>
            )}
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label className="text-sm font-medium">Imagem (opcional)</Label>
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
                <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
              </div>
              {imagePreview && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition-colors shrink-0"
                  title="Remover imagem"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
            {imagePreview && (
              <div className="mt-2 rounded-md overflow-hidden border border-gray-200 w-32 h-32">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">
            {product ? "Salvar Alterações" : "Criar Produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
