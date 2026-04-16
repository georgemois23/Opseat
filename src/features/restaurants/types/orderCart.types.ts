/** In-memory cart row (order line from API + display fields). */
export interface RestaurantCartItem {
  /** Order line id from API (PATCH/DELETE target). */
  id: string;
  menuItemId?: string;
  name: string;
  price: number | string;
  quantity: number;
  comment?: string;
  comments?: string;
  customizedIngredients?: Array<{ ingredient?: { id?: string; name?: string } }>;
  imageUrl?: string;
}

export function ingredientIdsFromCartRow(item: RestaurantCartItem): string[] {
  return (item.customizedIngredients ?? [])
    .map((link) => link?.ingredient?.id)
    .filter((id): id is string => typeof id === "string");
}

export function ingredientIdsFromModalItem(newItem: {
  customizedIngredients?: Array<{ ingredient?: { id?: string } }>;
}): string[] {
  return (newItem.customizedIngredients ?? [])
    .map((link) => link?.ingredient?.id)
    .filter((id): id is string => typeof id === "string");
}

/** Same menu item + same ingredient set + same note → same logical line (for edit vs replace). */
export function cartLineMergeKey(item: RestaurantCartItem): string {
  const mid = item.menuItemId ?? item.id;
  const ids = ingredientIdsFromCartRow(item).slice().sort().join(",");
  const note =
    typeof item.comment === "string"
      ? item.comment
      : typeof item.comments === "string"
        ? item.comments
        : "";
  return `${mid}|${ids}|${note}`;
}

/**
 * Maps order JSON (GET current / mutation response) into local cart rows + totals.
 */
export function pendingOrderResponseToCartItems(data: unknown): RestaurantCartItem[] {
  if (typeof data !== "object" || data === null) return [];
  const rawItems = (data as { items?: unknown }).items;
  if (!Array.isArray(rawItems)) return [];

  const out: RestaurantCartItem[] = [];
  for (const line of rawItems) {
    if (typeof line !== "object" || line === null) continue;
    const l = line as Record<string, unknown>;
    const lineId = typeof l.id === "string" ? l.id : null;
    const menuItem = l.menuItem;
    if (!lineId || typeof menuItem !== "object" || menuItem === null) continue;
    const m = menuItem as Record<string, unknown>;
    const menuItemId = typeof m.id === "string" ? m.id : null;
    if (!menuItemId) continue;

    const name = typeof m.name === "string" ? m.name : "";
    const price =
      typeof l.priceAtOrder === "string" || typeof l.priceAtOrder === "number"
        ? String(l.priceAtOrder)
        : typeof m.price === "string" || typeof m.price === "number"
          ? String(m.price)
          : "0";
    const qtyRaw = l.quantity;
    const quantity = typeof qtyRaw === "number" ? qtyRaw : Number(qtyRaw) || 1;
    const comment = typeof l.comment === "string" ? l.comment : "";
    const imageUrl = typeof m.imageUrl === "string" ? m.imageUrl : undefined;

    const ingredients = Array.isArray(l.ingredients) ? l.ingredients : [];
    const customizedIngredients = ingredients
      .filter((row) => {
        if (typeof row !== "object" || row === null) return false;
        return (row as { removed?: boolean }).removed !== true;
      })
      .map((row) => {
        const r = row as { ingredient?: { id?: string; name?: string } };
        const id = r.ingredient?.id;
        if (typeof id !== "string") return null;
        const ingName = typeof r.ingredient?.name === "string" ? r.ingredient.name : undefined;
        return { ingredient: { id, ...(ingName ? { name: ingName } : {}) } };
      })
      .filter((x): x is NonNullable<typeof x> => x != null);

    out.push({
      id: lineId,
      menuItemId,
      name,
      price,
      quantity: Math.max(1, quantity),
      comment,
      imageUrl,
      customizedIngredients,
    });
  }
  return out;
}

export function normalizeOrderPayload(data: unknown): {
  orderId: string | null;
  totalPrice: string | number | null;
  items: RestaurantCartItem[];
} | null {
  if (data == null) return null;
  const root =
    typeof data === "object" &&
    data !== null &&
    "order" in data &&
    typeof (data as { order: unknown }).order === "object" &&
    (data as { order: unknown }).order !== null
      ? ((data as { order: unknown }).order as Record<string, unknown>)
      : (data as Record<string, unknown>);
  if (typeof root !== "object" || root === null) return null;
  const orderId = typeof root.id === "string" ? root.id : null;
  const totalPrice =
    typeof root.totalPrice === "string" || typeof root.totalPrice === "number" ? root.totalPrice : null;
  const items = pendingOrderResponseToCartItems(root);
  return { orderId, totalPrice, items };
}
