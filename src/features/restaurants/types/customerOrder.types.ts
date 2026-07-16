import {
  OrderStatus,
  compareOrdersForListDisplay,
  parseOrderStatus,
} from "@/features/restaurants/types/orderStatus";

/** Shared shape for line-item lists (customer drawer, kitchen panel, order page). */
export interface OrderLineDisplay {
  id: string;
  quantity: number;
  priceAtOrder?: string | number;
  comment?: string;
  menuItem?: { id?: string; name?: string };
  /** Flat dish title when `menuItem` was not populated (some admin / list payloads). */
  dishName?: string;
  /** Customisations still on the line (excludes removed). */
  ingredientNames?: string[];
}

export interface CustomerOrderLine extends OrderLineDisplay {}

export interface CustomerOrder {
  id: string;
  status: OrderStatus;
  totalPrice?: string | number;
  createdAt?: string;
  /** When the order was actually placed (checkout), as opposed to when the draft cart was created. */
  placedAt?: string;
  deliveryType?: "delivery" | "pickup";
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  /**
   * Delivery instant (ISO). Normalization merges `estimatedDeliveryTime` first
   * (usually set when the restaurant accepts), then other ETA fields.
   */
  estimatedDeliveryAt?: string;
  deliveredAt?: string;
  /** Minutes from order creation until expected delivery (API). */
  estimatedDeliveryMinutes?: number;
  restaurant?: { id?: string; name?: string; slug?: string };
  items?: CustomerOrderLine[];
}

function pickFirstString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === "string" && v.length > 0) return v;
  }
  return undefined;
}

/**
 * Backend `estimatedDeliveryTime` (often set when the order is accepted).
 * Supports ISO datetime string, unix seconds/ms, or minutes from order `createdAt`.
 */
function parseEstimatedDeliveryTimeToIso(
  raw: unknown,
  orderCreatedAt?: string
): string | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "string") {
    const s = raw.trim();
    if (!s) return undefined;
    const d = new Date(s);
    if (Number.isFinite(d.getTime())) return d.toISOString();
    return undefined;
  }
  if (typeof raw === "number" && Number.isFinite(raw)) {
    if (raw > 1e12) return new Date(raw).toISOString();
    if (raw > 1e9) return new Date(raw * 1000).toISOString();
    if (raw > 0 && raw <= 24 * 60 && orderCreatedAt) {
      const base = new Date(orderCreatedAt);
      if (Number.isFinite(base.getTime())) {
        return new Date(base.getTime() + raw * 60_000).toISOString();
      }
    }
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

function ingredientNamesFromLine(l: Record<string, unknown>): string[] | undefined {
  const ingredients = Array.isArray(l.ingredients) ? l.ingredients : [];
  const names: string[] = [];
  for (const row of ingredients) {
    if (typeof row !== "object" || row === null) continue;
    if ((row as { removed?: boolean }).removed === true) continue;
    const n = (row as { ingredient?: { name?: string } }).ingredient?.name;
    if (typeof n === "string" && n.length) names.push(n);
  }
  return names.length ? names : undefined;
}

function pickNonEmptyString(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

function menuItemNameFromNested(obj: unknown): string | undefined {
  if (typeof obj !== "object" || obj === null) return undefined;
  const o = obj as Record<string, unknown>;
  return (
    pickNonEmptyString(o.name) ??
    pickNonEmptyString(o.title) ??
    pickNonEmptyString(o.label)
  );
}

/** Maps menu item id → display name from restaurant `menus` (same shape as `RestaurantData.Menu`). */
export function buildMenuItemNameLookupFromMenus(menus: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(menus)) return map;
  for (const menu of menus) {
    if (typeof menu !== "object" || menu === null) continue;
    const m = menu as Record<string, unknown>;
    const categories = Array.isArray(m.categories)
      ? m.categories
      : Array.isArray(m.menuCategories)
        ? m.menuCategories
        : [];
    for (const cat of categories) {
      if (typeof cat !== "object" || cat === null) continue;
      const c = cat as Record<string, unknown>;
      const catItems = Array.isArray(c.items) ? c.items : [];
      for (const it of catItems) {
        if (typeof it !== "object" || it === null) continue;
        const mi = it as Record<string, unknown>;
        const id = typeof mi.id === "string" ? mi.id : mi.id != null ? String(mi.id) : null;
        const n = pickNonEmptyString(mi.name);
        if (id && n) map.set(id, n);
      }
    }
  }
  return map;
}

/**
 * Normalises one order's `items` array for display (customer, owner, admin).
 * Handles `menuItem` / `menu_item`, `dish`, flat `name`, snake_case prices, etc.
 * When `menus` is passed (e.g. admin restaurant payload), resolves names via `menuItemId` / `menuItem.id` / line `id` (slug parity).
 */
export function parseOrderLineItemsForDisplay(itemsRaw: unknown, menus?: unknown): OrderLineDisplay[] {
  const items: OrderLineDisplay[] = [];
  if (!Array.isArray(itemsRaw)) return items;
  const nameLookup = menus != null ? buildMenuItemNameLookupFromMenus(menus) : null;
  for (const line of itemsRaw) {
    if (typeof line !== "object" || line === null) continue;
    const l = line as Record<string, unknown>;
    const lid = typeof l.id === "string" ? l.id : l.id != null ? String(l.id) : null;
    if (!lid) continue;
    const qty = typeof l.quantity === "number" ? l.quantity : Number(l.quantity) || 1;

    const nestedMenu = l.menuItem ?? l.menu_item;
    let menuItem: { id?: string; name?: string } | undefined;
    let dishName: string | undefined;

    const nestedName = menuItemNameFromNested(nestedMenu);
    if (nestedMenu && typeof nestedMenu === "object") {
      const mid = (nestedMenu as { id?: unknown }).id;
      const id = typeof mid === "string" ? mid : mid != null ? String(mid) : undefined;
      if (nestedName || id) {
        menuItem = { ...(id ? { id } : {}), ...(nestedName ? { name: nestedName } : {}) };
      }
    }

    if (!menuItem?.name) {
      const fromDish = menuItemNameFromNested(l.dish);
      if (fromDish) dishName = fromDish;
    }
    if (!menuItem?.name && !dishName) {
      const flat =
        pickNonEmptyString(l.name) ??
        pickNonEmptyString(l.title) ??
        pickNonEmptyString(l.dishName) ??
        pickNonEmptyString(l.product_name) ??
        pickNonEmptyString(l.menu_item_name);
      if (flat) dishName = flat;
    }

    if (nameLookup && !menuItem?.name && !dishName) {
      if (typeof l.menuItem === "string") {
        const fk = pickNonEmptyString(l.menuItem);
        if (fk) {
          const hit = nameLookup.get(fk);
          if (hit) dishName = hit;
        }
      }
      if (!dishName) {
        const lookupKey =
          pickNonEmptyString(l.menuItemId) ??
          pickNonEmptyString(l.menu_item_id) ??
          menuItem?.id ??
          lid;
        if (lookupKey) {
          const hit = nameLookup.get(lookupKey);
          if (hit) dishName = hit;
        }
      }
    }

    const priceAtOrder =
      typeof l.priceAtOrder === "string" || typeof l.priceAtOrder === "number"
        ? l.priceAtOrder
        : typeof l.price_at_order === "string" || typeof l.price_at_order === "number"
          ? l.price_at_order
          : undefined;
    const comment =
      typeof l.comment === "string"
        ? l.comment
        : typeof l.note === "string"
          ? l.note
          : undefined;
    const ingredientNames = ingredientNamesFromLine(l);
    items.push({
      id: lid,
      quantity: qty,
      menuItem,
      dishName,
      priceAtOrder,
      comment,
      ingredientNames,
    });
  }
  return items;
}

/** In-flight orders first, then delivered, then cancelled; within each group, newest first. */
export function sortCustomerOrdersForDisplay(orders: CustomerOrder[]): CustomerOrder[] {
  return [...orders].sort(compareOrdersForListDisplay);
}

export function normalizeCustomerOrdersResponse(data: unknown): CustomerOrder[] {
  const raw = Array.isArray(data)
    ? data
    : data && typeof data === "object" && Array.isArray((data as { orders?: unknown }).orders)
      ? (data as { orders: unknown[] }).orders
      : [];

  const out: CustomerOrder[] = [];
  for (const row of raw) {
    if (typeof row !== "object" || row === null) continue;
    const r = row as Record<string, unknown>;
    const id = typeof r.id === "string" ? r.id : null;
    if (!id) continue;
    const st = parseOrderStatus(r.status);
    if (!st || st === OrderStatus.DRAFT) continue;

    const rest = r.restaurant;
    const restaurant =
      typeof rest === "object" && rest !== null
        ? {
            id: typeof (rest as { id?: unknown }).id === "string" ? (rest as { id: string }).id : undefined,
            name:
              typeof (rest as { name?: unknown }).name === "string"
                ? (rest as { name: string }).name
                : undefined,
            slug:
              typeof (rest as { slug?: unknown }).slug === "string"
                ? (rest as { slug: string }).slug
                : undefined,
          }
        : undefined;

    const items = parseOrderLineItemsForDisplay(r.items);

    const createdAtStr = typeof r.createdAt === "string" ? r.createdAt : undefined;
    const placedAtStr = pickFirstString(r, ["placedAt", "placed_at"]);
    const fromEstimatedDeliveryTime = parseEstimatedDeliveryTimeToIso(
      r.estimatedDeliveryTime ?? r.estimated_delivery_time,
      createdAtStr
    );
    const estimatedDeliveryAt =
      fromEstimatedDeliveryTime ??
      pickFirstString(r, [
        "estimatedDeliveryAt",
        "estimated_delivery_at",
        "expectedDeliveryAt",
        "expected_delivery_at",
        "deliveryEta",
      ]);
    const deliveredAt = pickFirstString(r, ["deliveredAt", "delivered_at"]);
    const estimatedDeliveryMinutes = pickFirstFiniteNumber(r, [
      "estimatedDeliveryMinutes",
      "estimated_delivery_minutes",
      "deliveryEtaMinutes",
      "delivery_eta_minutes",
    ]);
    const deliveryAddress = pickFirstString(r, [
      "deliveryAddress",
      "delivery_address",
    ]);
    const deliveryType =
      parseDeliveryType(r.deliveryType) ??
      parseDeliveryType(r.delivery_type) ??
      parseDeliveryType(r.type);
    const deliveryLat = pickFirstFiniteNumber(r, ["deliveryLat", "delivery_lat"]);
    const deliveryLng = pickFirstFiniteNumber(r, ["deliveryLng", "delivery_lng"]);

    out.push({
      id,
      status: st,
      totalPrice:
        typeof r.totalPrice === "string" || typeof r.totalPrice === "number" ? r.totalPrice : undefined,
      createdAt: typeof r.createdAt === "string" ? r.createdAt : undefined,
      placedAt: placedAtStr,
      estimatedDeliveryAt,
      deliveredAt,
      estimatedDeliveryMinutes,
      deliveryType,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      restaurant,
      items,
    });
  }
  return sortCustomerOrdersForDisplay(out);
}
