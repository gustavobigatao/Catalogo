import {
  findAllProducts,
  findProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  updateStock,
  getUniqueFilters,
} from "../database/products";
import type { InsertProduct } from "../database/schema";
import { uploadImage, deleteImage, isBase64DataUrl } from "./storage";

export const productService = {
  list: findAllProducts,
  getById: findProductById,

  create: async (data: InsertProduct, token?: string) => {
    let imagem = data.imagem;

    if (imagem && isBase64DataUrl(imagem)) {
      const fileName = `product-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      imagem = await uploadImage(imagem, fileName);
    }

    return createProduct({ ...data, imagem: imagem ?? null }, token);
  },

  update: async (id: number, data: Partial<InsertProduct>, token?: string) => {
    const existing = await findProductById(id);
    const existingUrl = existing?.imagem;
    const newImage = data.imagem;

    let imageUrl: string | null | undefined;

    if (newImage === undefined) {
      imageUrl = undefined;
    } else if (newImage === null) {
      imageUrl = null;
      if (existingUrl && !isBase64DataUrl(existingUrl)) {
        await deleteImage(existingUrl);
      }
    } else if (isBase64DataUrl(newImage)) {
      imageUrl = await uploadImage(newImage, `product-${id}`);
      if (existingUrl && !isBase64DataUrl(existingUrl)) {
        await deleteImage(existingUrl);
      }
    } else {
      imageUrl = newImage;
    }

    const updateData = imageUrl === undefined ? data : { ...data, imagem: imageUrl };
    return updateProduct(id, updateData, token);
  },

  delete: async (id: number, token?: string) => {
    const product = await findProductById(id);
    if (product?.imagem && !isBase64DataUrl(product.imagem)) {
      await deleteImage(product.imagem);
    }
    return deleteProduct(id, token);
  },

  updateStock: (id: number, quantidade: number, token?: string) => updateStock(id, quantidade, token),
  getFilters: getUniqueFilters,
};
