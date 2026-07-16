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

  // Base the ETA on when the order was actually placed (checkout), not when the
  // draft cart was first created — a cart can sit as a draft for hours/days, which
  // would otherwise push the fallback ETA far into the past.
  const baseSource = order.placedAt ?? order.createdAt;
  const base = baseSource ? new Date(baseSource) : null;
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
