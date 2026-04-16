export enum OrderStatus {
  DRAFT = "draft",
  PENDING = "pending",
  ACCEPTED = "accepted",
  PREPARING = "preparing",
  READY = "ready",
  ON_THE_WAY = "on_the_way",
  DELIVERED = "delivered",
  CANCELLED = "cancelled",
}

/** Statuses the kitchen can assign (draft is client-only). */
export const OWNER_ORDER_STATUS_OPTIONS: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];

/** Linear fulfilment chain for quick back/next in owner UIs (excludes cancelled). */
export const OWNER_FULFILMENT_PIPELINE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.ACCEPTED,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.ON_THE_WAY,
  OrderStatus.DELIVERED,
];

export function ownerFulfilmentPipelineIndex(status: OrderStatus): number {
  return OWNER_FULFILMENT_PIPELINE.indexOf(status);
}

/** Previous step in the fulfilment chain, or null if at start / not on chain (e.g. cancelled). */
export function previousOwnerPipelineStatus(status: OrderStatus): OrderStatus | null {
  /** No quick “step back” once marked delivered (use the status menu if a correction is needed). */
  if (status === OrderStatus.DELIVERED) return null;
  const i = ownerFulfilmentPipelineIndex(status);
  if (i <= 0) return null;
  return OWNER_FULFILMENT_PIPELINE[i - 1]!;
}

/** Next step in the fulfilment chain, or null if at end / not on chain. */
export function nextOwnerPipelineStatus(status: OrderStatus): OrderStatus | null {
  const i = ownerFulfilmentPipelineIndex(status);
  if (i < 0 || i >= OWNER_FULFILMENT_PIPELINE.length - 1) return null;
  return OWNER_FULFILMENT_PIPELINE[i + 1]!;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  [OrderStatus.DRAFT]: "Draft",
  [OrderStatus.PENDING]: "Pending",
  [OrderStatus.ACCEPTED]: "Accepted",
  [OrderStatus.PREPARING]: "Preparing",
  [OrderStatus.READY]: "Ready",
  [OrderStatus.ON_THE_WAY]: "On the way",
  [OrderStatus.DELIVERED]: "Delivered",
  [OrderStatus.CANCELLED]: "Cancelled",
};

export function parseOrderStatus(raw: unknown): OrderStatus | null {
  if (typeof raw !== "string") return null;
  const v = raw.toLowerCase().trim();
  const hit = Object.values(OrderStatus).find((s) => s === v);
  return hit ?? null;
}

export function isTerminalOrderStatus(status: OrderStatus): boolean {
  return status === OrderStatus.DELIVERED || status === OrderStatus.CANCELLED;
}

/** In-progress customer order (submitted, not finished or cancelled). */
export function isActiveCustomerOrderStatus(status: OrderStatus): boolean {
  if (status === OrderStatus.DRAFT) return false;
  return !isTerminalOrderStatus(status);
}

/**
 * Customer-facing list order: in-flight first, then delivered, then cancelled.
 * Lower number sorts earlier.
 */
export function customerOrderListTier(status: OrderStatus): number {
  if (status === OrderStatus.CANCELLED) return 2;
  if (status === OrderStatus.DELIVERED) return 1;
  if (status === OrderStatus.DRAFT) return 3;
  return 0;
}

function orderCreatedAtSortMs(createdAt?: string): number {
  if (!createdAt) return 0;
  const t = new Date(createdAt).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Kitchen + customer lists: in-flight → delivered → cancelled; newest first within each tier. */
export function compareOrdersForListDisplay(
  a: { status: OrderStatus; createdAt?: string },
  b: { status: OrderStatus; createdAt?: string }
): number {
  const da = customerOrderListTier(a.status);
  const db = customerOrderListTier(b.status);
  if (da !== db) return da - db;
  return orderCreatedAtSortMs(b.createdAt) - orderCreatedAtSortMs(a.createdAt);
}

/** MUI `Chip` color for order status badges (customer + owner UIs). */
export function muiOrderStatusChipColor(
  status: OrderStatus
): "default" | "primary" | "secondary" | "success" | "warning" | "error" | "info" {
  switch (status) {
    case OrderStatus.PENDING:
      return "warning";
    case OrderStatus.ACCEPTED:
    case OrderStatus.PREPARING:
      return "info";
    case OrderStatus.READY:
    case OrderStatus.ON_THE_WAY:
      return "primary";
    case OrderStatus.DELIVERED:
      return "success";
    case OrderStatus.CANCELLED:
      return "error";
    default:
      return "default";
  }
}
