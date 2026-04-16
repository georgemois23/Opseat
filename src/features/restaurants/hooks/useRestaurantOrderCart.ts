import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  cartLineMergeKey,
  ingredientIdsFromModalItem,
  normalizeOrderPayload,
  RestaurantCartItem,
} from "@/features/restaurants/types/orderCart.types";
import {
  addOrderItem,
  deleteOrderItem,
  fetchCurrentOrder,
  patchOrderItem,
} from "@/features/restaurants/services/restaurantOrder.api";
import { useSnackbar } from "@/lib/SnackbarContext";

type SnackbarFn = (opts: { message: string; severity: string }) => void;

export interface UseRestaurantOrderCartOptions {
  /** Restaurant UUID for `/orders/current` and POST body. */
  restaurantId: string | undefined;
  acceptingOrders: boolean;
}

function parseTotalNumber(v: string | number | null | undefined): number | null {
  if (v == null) return null;
  const n = parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

export function useRestaurantOrderCart({
  restaurantId,
  acceptingOrders,
}: UseRestaurantOrderCartOptions) {
  const { showSnackbar } = useSnackbar();
  const toast = showSnackbar as SnackbarFn;
  const [cartItems, setCartItems] = useState<RestaurantCartItem[]>([]);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderTotalPrice, setOrderTotalPrice] = useState<string | number | null>(null);
  const [isOrderBootstrapping, setIsOrderBootstrapping] = useState(false);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const cartRef = useRef<RestaurantCartItem[]>([]);
  useEffect(() => {
    cartRef.current = cartItems;
  }, [cartItems]);

  const subtotal = useMemo(() => {
    const official = parseTotalNumber(orderTotalPrice);
    if (official != null) return official;
    return cartItems.reduce((sum, item) => {
      const p = parseFloat(String(item.price)) || 0;
      const q = Number(item.quantity) || 0;
      return sum + p * q;
    }, 0);
  }, [orderTotalPrice, cartItems]);

  const applyNormalizedOrder = useCallback((data: unknown) => {
    const norm = normalizeOrderPayload(data);
    if (!norm) {
      setOrderId(null);
      setCartItems([]);
      setOrderTotalPrice(null);
      return;
    }
    setOrderId(norm.orderId);
    setCartItems(norm.items);
    setOrderTotalPrice(norm.totalPrice);
  }, []);

  const refreshFromCurrentOrder = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await fetchCurrentOrder(restaurantId);
      if (data == null || data === "") {
        setOrderId(null);
        setCartItems([]);
        setOrderTotalPrice(null);
        return;
      }
      const norm = normalizeOrderPayload(data);
      if (norm) {
        setOrderId(norm.orderId);
        setCartItems(norm.items);
        setOrderTotalPrice(norm.totalPrice);
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        setOrderId(null);
        setCartItems([]);
        setOrderTotalPrice(null);
        return;
      }
      console.error("Failed to load current order:", err);
    }
  }, [restaurantId]);

  useEffect(() => {
    if (!acceptingOrders || !restaurantId) {
      setOrderId(null);
      setCartItems([]);
      setOrderTotalPrice(null);
      setBootstrapError(null);
      setIsOrderBootstrapping(false);
      return;
    }

    let cancelled = false;
    setIsOrderBootstrapping(true);
    setBootstrapError(null);

    void (async () => {
      try {
        const data = await fetchCurrentOrder(restaurantId);
        if (cancelled) return;
        if (data == null || data === "") {
          setOrderId(null);
          setCartItems([]);
          setOrderTotalPrice(null);
          return;
        }
        applyNormalizedOrder(data);
      } catch (err: unknown) {
        if (cancelled) return;
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) {
          setOrderId(null);
          setCartItems([]);
          setOrderTotalPrice(null);
          return;
        }
        setBootstrapError("Could not load your basket");
        console.error(err);
      } finally {
        if (!cancelled) setIsOrderBootstrapping(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [restaurantId, acceptingOrders, applyNormalizedOrder]);

  const addToCart = useCallback(
    async (newItem: any) => {
      if (!acceptingOrders || !restaurantId) return;
      const menuItemId = String(newItem.id);
      const quantity = Math.max(1, Number(newItem.quantity) || 1);
      const ingredientIds = ingredientIdsFromModalItem(newItem);
      const commentRaw =
        typeof newItem.comments === "string"
          ? newItem.comments
          : typeof newItem.comment === "string"
            ? newItem.comment
            : "";
      const comment = commentRaw.trim() ? commentRaw : undefined;
      try {
        await addOrderItem({
          restaurantId,
          menuItemId,
          quantity,
          ingredientIds,
          comment,
        });
        await refreshFromCurrentOrder();
      } catch (err) {
        console.error("addOrderItem failed:", err);
        toast({ message: "Could not add item to basket", severity: "error" });
      }
    },
    [acceptingOrders, restaurantId, refreshFromCurrentOrder, toast]
  );

  const replaceCartLine = useCallback(
    async (lineId: string, newItem: any) => {
      if (!acceptingOrders || !restaurantId) return;
      const menuItemId = String(newItem.id);
      const quantity = Math.max(1, Number(newItem.quantity) || 1);
      const ingredientIds = ingredientIdsFromModalItem(newItem);
      const commentRaw =
        typeof newItem.comments === "string"
          ? newItem.comments
          : typeof newItem.comment === "string"
            ? newItem.comment
            : "";
      const comment = commentRaw;
      const customizedIngredients = Array.isArray(newItem.customizedIngredients)
        ? newItem.customizedIngredients
        : [];
      const oldRow = cartRef.current.find((r) => r.id === lineId);
      const candidate: RestaurantCartItem = {
        id: lineId,
        menuItemId,
        name: typeof newItem.name === "string" ? newItem.name : "",
        price: Number(newItem.price) || 0,
        quantity,
        customizedIngredients,
        comment,
      };
      const sameSignature = oldRow && cartLineMergeKey(oldRow) === cartLineMergeKey(candidate);
      try {
        if (sameSignature) {
          await patchOrderItem(lineId, { quantity, comment: comment || undefined });
        } else {
          await deleteOrderItem(lineId);
          await addOrderItem({
            restaurantId,
            menuItemId,
            quantity,
            ingredientIds,
            comment: comment.trim() ? comment : undefined,
          });
        }
        await refreshFromCurrentOrder();
      } catch (err) {
        console.error("replaceCartLine failed:", err);
        toast({ message: "Could not update basket item", severity: "error" });
        await refreshFromCurrentOrder();
      }
    },
    [acceptingOrders, restaurantId, refreshFromCurrentOrder, toast]
  );

  const updateLineQuantity = useCallback(
    (id: string, delta: number) => {
      if (!acceptingOrders || !restaurantId) return;
      const item = cartRef.current.find((i) => i.id === id);
      if (!item) return;

      const snapshot = [...cartRef.current];

      if (item.quantity === 1 && delta < 0) {
        setCartItems((prev) => prev.filter((i) => i.id !== id));
        void (async () => {
          try {
            await deleteOrderItem(id);
            await refreshFromCurrentOrder();
          } catch (err) {
            console.error("deleteOrderItem failed:", err);
            setCartItems(snapshot);
            toast({ message: "Could not remove item", severity: "error" });
          }
        })();
        return;
      }

      const nextQty = Math.max(1, Number(item.quantity) + delta);
      setCartItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: nextQty } : i))
      );

      void (async () => {
        try {
          await patchOrderItem(id, { quantity: nextQty });
          await refreshFromCurrentOrder();
        } catch (err) {
          console.error("patchOrderItem failed:", err);
          setCartItems(snapshot);
          toast({ message: "Could not update quantity", severity: "error" });
        }
      })();
    },
    [acceptingOrders, restaurantId, refreshFromCurrentOrder, toast]
  );

  const removeLine = useCallback(
    (id: string) => {
      if (!acceptingOrders || !restaurantId) return;
      const snapshot = [...cartRef.current];
      setCartItems((prev) => prev.filter((item) => item.id !== id));
      void (async () => {
        try {
          await deleteOrderItem(id);
          await refreshFromCurrentOrder();
        } catch (err) {
          console.error("deleteOrderItem failed:", err);
          setCartItems(snapshot);
          toast({ message: "Could not remove item", severity: "error" });
        }
      })();
    },
    [acceptingOrders, restaurantId, refreshFromCurrentOrder, toast]
  );

  return {
    cartItems,
    subtotal,
    addToCart,
    replaceCartLine,
    updateLineQuantity,
    removeLine,
    orderId,
    orderTotalPrice,
    isOrderBootstrapping,
    bootstrapError,
  };
}
