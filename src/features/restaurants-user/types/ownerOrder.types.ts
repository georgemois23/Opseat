import { parseOrderLineItemsForDisplay, type OrderLineDisplay } from "@/features/restaurants/types/customerOrder.types";
import { compareOrdersForListDisplay, OrderStatus, parseOrderStatus } from "@/features/restaurants/types/orderStatus";

export interface OwnerOrderLine extends OrderLineDisplay {
  menuItem?: { id?: string; name?: string };
}

export interface OwnerOrder {
  id: string;
  status: OrderStatus;
  totalPrice?: string | number;
  createdAt?: string;
  deliveryType?: "delivery" | "pickup";
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  items?: OwnerOrderLine[];
}

function pickFirstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

function pickFirstFiniteNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "number" && Number.isFinite(v)) return v;
    if (typeof v === "string" && v.length > 0) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function parseDeliveryType(value: unknown): "delivery" | "pickup" | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "delivery") return "delivery";
  if (normalized === "pickup" || normalized === "pick_up") return "pickup";
  return undefined;
}

export function normalizeOrdersResponse(data: unknown): OwnerOrder[] {
  const raw = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { orders?: unknown }).orders)
      ? (data as { orders: unknown[] }).orders
      : [];

  const out: OwnerOrder[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : null;
    if (!id) continue;
    const st = parseOrderStatus(r.status);
    if (!st || st === OrderStatus.DRAFT) continue;

    const items = parseOrderLineItemsForDisplay(r.items) as OwnerOrderLine[];

    out.push({
      id,
      status: st,
      totalPrice:
        typeof r.totalPrice === "string" || typeof r.totalPrice === "number" ? r.totalPrice : undefined,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
      deliveryType:
        parseDeliveryType(r.deliveryType) ??
        parseDeliveryType(r.delivery_type) ??
        parseDeliveryType(r.type),
      deliveryAddress: pickFirstString(r, ["deliveryAddress", "delivery_address"]),
      deliveryLat: pickFirstFiniteNumber(r, ["deliveryLat", "delivery_lat"]),
      deliveryLng: pickFirstFiniteNumber(r, ["deliveryLng", "delivery_lng"]),
      items,
    });
  }
  out.sort(compareOrdersForListDisplay);
  return out;
}
