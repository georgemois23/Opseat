import api from "@/lib/axios";
import {
  normalizeCustomerOrdersResponse,
  type CustomerOrder,
} from "@/features/restaurants/types/customerOrder.types";
import { OrderStatus } from "@/features/restaurants/types/orderStatus";

/** Current user’s orders (submitted and historical). Adjust path if your backend differs. */
export async function fetchMyOrders(): Promise<unknown> {
  const res = await api.get("/order/my");
  return res.data;
}

/** Resolve one order for the signed-in customer (from `/order/my`). */
export async function fetchCustomerOrderById(orderId: string): Promise<CustomerOrder | null> {
  const data = await fetchMyOrders();
  const list = normalizeCustomerOrdersResponse(data);
  return list.find((o) => o.id === orderId) ?? null;
}

/** Customer-side cancellation. Currently allowed only for pending orders in the UI. */
export async function cancelCustomerOrder(orderId: string): Promise<unknown> {
  const res = await api.patch(`/order/${orderId}/cancel`);
  return res.data;
}
