import { createOrder, listOrders, getOrderById, updateOrderStatus } from "../database/orders";
import type { InsertPedido, InsertPedidoItem, Pedido } from "../database/schema";

export const orderService = {
  create: (pedido: InsertPedido, itens: Omit<InsertPedidoItem, "pedido_id">[]) =>
    createOrder(pedido, itens),
  list: (token?: string) => listOrders(token),
  getById: (id: number, token?: string) => getOrderById(id, token),
  updateStatus: (id: number, status: Pedido["status"], token?: string) =>
    updateOrderStatus(id, status, token),
};
