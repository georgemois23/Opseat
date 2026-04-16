import api from "@/lib/axios";

export interface AddOrderItemPayload {
  restaurantId: string;
  menuItemId: string;
  quantity: number;
  ingredientIds: string[];
  comment?: string;
}

/** Pending order for this restaurant, or null if none. */
export async function fetchCurrentOrder(restaurantId: string): Promise<unknown> {
  const res = await api.get("/order/current", { params: { restaurantId } });
  return res.data;
}

export async function addOrderItem(payload: AddOrderItemPayload): Promise<unknown> {
  const res = await api.post("/order/item", payload);
  return res.data;
}

export async function patchOrderItem(
  orderItemId: string,
  body: { quantity?: number; comment?: string }
): Promise<unknown> {
  const res = await api.patch(`/order/item/${orderItemId}`, body);
  return res.data;
}

export async function deleteOrderItem(orderItemId: string): Promise<unknown> {
  const res = await api.delete(`/order/item/${orderItemId}`);
  return res.data;
}

export interface SubmitOrderPayload {
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  deliveryType?: string;
  delivery_type?: string;
}

/** Finalize pending order (adjust path to match your backend). */
export async function submitOrder(
  orderId: string,
  payload?: SubmitOrderPayload
): Promise<unknown> {
  const res = await api.post(`/order/${orderId}/submit`, payload ?? {});
  return res.data;
}
