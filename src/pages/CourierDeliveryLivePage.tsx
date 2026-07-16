import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Card, CardContent, Container, Stack, Typography } from "@mui/material";
import RestaurantMap from "@/features/restaurants/components/RestaurantMap";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import NearMeRounded from "@mui/icons-material/NearMeRounded";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSocket } from "@/features/socket/hooks/useSocket";
import api from "@/lib/axios";
import { OrderStatus, isTerminalOrderStatus } from "@/features/restaurants/types/orderStatus";

type Coordinates = { latitude: number; longitude: number };

type DeliverySummary = {
  restaurantName?: string;
  restaurantAddress?: string;
  deliveryAddress?: string;
  deliveryLat?: number;
  deliveryLng?: number;
  itemQuantity?: number | null;
  totalPriceText?: string;
};

function asFiniteNumber(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
}

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function formatMoney(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(n);
}

function asSummaryFromState(locationState: unknown): DeliverySummary {
  const s = asRecord(asRecord(locationState)?.summary);
  return (s as DeliverySummary) ?? {};
}

/** Build the courier-facing summary from a full order fetched from the backend. */
function summaryFromOrder(order: unknown): DeliverySummary {
  const o = asRecord(order);
  if (!o) return {};
  const restaurant = asRecord(o.restaurant);
  const items = Array.isArray(o.items) ? o.items : [];
  const itemQuantity = items.reduce((sum, it) => {
    const qty = asRecord(it)?.quantity;
    return sum + (typeof qty === "number" ? qty : 1);
  }, 0);
  const restaurantAddress = [restaurant?.street, restaurant?.postalCode, restaurant?.city, restaurant?.country]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .join(", ");
  return {
    restaurantName: typeof restaurant?.name === "string" ? restaurant.name : undefined,
    restaurantAddress: restaurantAddress || undefined,
    deliveryAddress: typeof o.deliveryAddress === "string" ? o.deliveryAddress : undefined,
    deliveryLat: asFiniteNumber(o.deliveryLat),
    deliveryLng: asFiniteNumber(o.deliveryLng),
    itemQuantity: itemQuantity > 0 ? itemQuantity : null,
    totalPriceText: formatMoney(o.totalPrice),
  };
}

export default function CourierDeliveryLivePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { orderId } = useParams<{ orderId: string }>();
  const { connected, emitEvent, subscribe } = useSocket();

  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [pickedUp, setPickedUp] = useState(false);
  const [orderStatus, setOrderStatus] = useState<OrderStatus | null>(null);
  const [fetchedSummary, setFetchedSummary] = useState<DeliverySummary | null>(null);
  const [fetchedEta, setFetchedEta] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  const stateSummary = useMemo(() => asSummaryFromState(location.state), [location.state]);
  // Prefer server data (survives refresh); fall back to nav state for instant paint.
  const summary = fetchedSummary ?? stateSummary;

  const estimatedDeliveryTime = useMemo(() => {
    const raw =
      fetchedEta ??
      (location.state as { estimatedDeliveryTime?: unknown } | null)?.estimatedDeliveryTime;
    if (typeof raw !== "string" && typeof raw !== "number") return null;
    const d = new Date(raw);
    return Number.isNaN(d.getTime()) ? null : d;
  }, [fetchedEta, location.state]);

  const etaText = estimatedDeliveryTime
    ? estimatedDeliveryTime.toLocaleTimeString("el-GR", { hour: "2-digit", minute: "2-digit" })
    : "—";

  const terminal = orderStatus ? isTerminalOrderStatus(orderStatus) : false;

  // Load the full order from the backend so a page refresh restores everything.
  const loadDelivery = useCallback(async () => {
    if (!orderId) return;
    try {
      const res = await api.get(`/couriers/delivery/${orderId}`);
      const order = res.data;
      if (!order) return;
      setFetchedSummary(summaryFromOrder(order));
      const status = (order.status ?? null) as OrderStatus | null;
      setOrderStatus(status);
      setFetchedEta(order.estimatedDeliveryTime ?? null);
      // If the courier already picked up (on the way) restore the picked-up UI.
      if (status === OrderStatus.ON_THE_WAY || (status && isTerminalOrderStatus(status))) {
        setPickedUp(true);
      }
    } catch (err) {
      console.error("Failed to load delivery details:", err);
    }
  }, [orderId]);

  useEffect(() => {
    void loadDelivery();
  }, [loadDelivery]);

  // React to live status changes for this order (e.g. restaurant marks it delivered).
  useEffect(() => {
    if (!orderId) return;
    const unsub = subscribe("order_status_changed", (payload: { orderId?: string; status?: OrderStatus }) => {
      if (payload?.orderId && payload.orderId !== orderId) return;
      if (payload?.status) setOrderStatus(payload.status);
      void loadDelivery();
    });
    return unsub;
  }, [subscribe, orderId, loadDelivery]);

  useEffect(() => {
    // Stop GPS streaming once the delivery is over (delivered / cancelled).
    if (!connected || !orderId || terminal || !navigator.geolocation) {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setStreaming(false);
      return;
    }

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        setCoords({ latitude, longitude });
        emitEvent("delivery_location_update", {
          orderId,
          latitude,
          longitude,
          lat: latitude,
          lng: longitude,
        });
      },
      () => setStreaming(false),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 4000 }
    );
    watchIdRef.current = id;
    setStreaming(true);

    return () => {
      if (watchIdRef.current != null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      setStreaming(false);
    };
  }, [connected, emitEvent, orderId, terminal]);

  const coordsText = coords ? `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}` : "Waiting for GPS…";

  const handlePickup = () => {
    if (!orderId) return;
    // Emit both common event names so backend can handle either convention.
    api.post(`/couriers/delivery/${orderId}/pickup`).catch((err) => {
      console.error("Failed to notify backend of pickup:", err);
    });
    emitEvent("pickup_order", { orderId, status: "on_the_way" });
    emitEvent("courier_on_the_way", { orderId, status: "on_the_way" });
    setPickedUp(true);
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2.5, md: 4 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/courier")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back to courier dashboard
        </Button>
      </Stack>

      <Card
        elevation={0}
        sx={{
          borderRadius: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
              Live delivery
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Order ID: {orderId ?? "—"}
            </Typography>

            <Alert severity={connected ? "success" : "warning"}>
              Socket: {connected ? "connected" : "disconnected"} {streaming ? "• streaming live delivery location" : ""}
            </Alert>

            <Alert severity="info" icon={<NearMeRounded fontSize="inherit" />}>
              Current location: {coordsText}
            </Alert>

            {terminal ? (
              <Alert severity={orderStatus === OrderStatus.CANCELLED ? "warning" : "success"}>
                {orderStatus === OrderStatus.CANCELLED
                  ? "This delivery was cancelled. You're available for new orders."
                  : "This delivery is complete (delivered). You're available for new orders."}
              </Alert>
            ) : pickedUp ? (
              <Alert severity="success">Customer notified: courier is on the way.</Alert>
            ) : null}

            <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems="flex-start">
              <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="subtitle2" fontWeight={800}>
                  Delivery details
                </Typography>
                <Typography variant="body2">
                  <strong>Restaurant:</strong> {summary.restaurantName ?? "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Pickup:</strong> {summary.restaurantAddress ?? "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Delivery:</strong> {summary.deliveryAddress ?? "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Items:</strong> {summary.itemQuantity ?? "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Total:</strong> {summary.totalPriceText ?? "—"}
                </Typography>
                <Typography variant="body2">
                  <strong>Est. delivery by:</strong> {etaText}
                </Typography>
                {orderStatus ? (
                  <Typography variant="body2">
                    <strong>Status:</strong> {orderStatus}
                  </Typography>
                ) : null}
              </Stack>

              {summary.deliveryLat != null && summary.deliveryLng != null ? (
                <Box sx={{ width: { xs: "100%", md: "auto" } }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={700}
                    sx={{ display: "block", pl: 2, mb: -1 }}
                  >
                    Client's location
                  </Typography>
                  <RestaurantMap
                    lat={summary.deliveryLat}
                    lng={summary.deliveryLng}
                    name="Client's home"
                    address={summary.deliveryAddress}
                    size={260}
                  />
                </Box>
              ) : null}
            </Stack>

            {terminal ? (
              <Button
                variant="contained"
                color="primary"
                onClick={() => navigate("/courier")}
                sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, alignSelf: "flex-start" }}
              >
                Back to dashboard
              </Button>
            ) : (
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={!orderId || pickedUp}
                  onClick={handlePickup}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  {pickedUp ? "Picked up" : "Pick up and notify user"}
                </Button>
                {pickedUp ? (
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => {
                      if (orderId) emitEvent("finish_delivery", { orderId });
                      navigate("/courier");
                    }}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                  >
                    Delivery finished
                  </Button>
                ) : null}
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => {
                    if (orderId) emitEvent("reject_order", { orderId });
                    navigate("/courier");
                  }}
                  sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                >
                  Cancel delivery
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
