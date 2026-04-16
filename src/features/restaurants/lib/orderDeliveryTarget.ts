import type { CustomerOrder } from "@/features/restaurants/types/customerOrder.types";
import { isActiveCustomerOrderStatus } from "@/features/restaurants/types/orderStatus";

/** Used when the API does not send an ETA (rough guide only). */
const FALLBACK_ACTIVE_MINUTES = 45;

export type ResolvedDeliveryTarget = {
  at: Date;
  /** True when ETA was inferred (not from the server). */
  isEstimate: boolean;
};

/**
 * Best-effort delivery arrival time for countdown UI.
 * Prefers explicit API fields; otherwise uses a placeholder window from order time for active orders.
 */
export function resolveDeliveryTarget(order: CustomerOrder): ResolvedDeliveryTarget | null {
  if (order.estimatedDeliveryAt) {
    const d = new Date(order.estimatedDeliveryAt);
    if (Number.isFinite(d.getTime())) return { at: d, isEstimate: false };
  }

  const base = order.createdAt ? new Date(order.createdAt) : null;
  if (!base || !Number.isFinite(base.getTime())) return null;

  const mins = order.estimatedDeliveryMinutes;
  if (typeof mins === "number" && mins > 0 && Number.isFinite(mins)) {
    return { at: new Date(base.getTime() + mins * 60_000), isEstimate: false };
  }

  if (!isActiveCustomerOrderStatus(order.status)) return null;

  return {
    at: new Date(base.getTime() + FALLBACK_ACTIVE_MINUTES * 60_000),
    isEstimate: true,
  };
}
