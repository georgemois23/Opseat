import api from "@/lib/axios";
import type { OrderStatus } from "@/features/restaurants/types/orderStatus";

/**
 * List orders for a restaurant you own.
 * Adjust path if your backend differs (e.g. `/restaurants/my/:id/orders`).
 */
export async function fetchRestaurantOrders(restaurantId: string): Promise<unknown> {
  const res = await api.get(`/order/restaurant/${restaurantId}`);
  return res.data;
}

/**
 * Update order workflow status.
 * Adjust path if your backend differs.
 */
export async function patchOrderStatus(orderId: string, status: OrderStatus): Promise<unknown> {
  const res = await api.patch(`/order/${orderId}/status`, { status });
  return res.data;
}
