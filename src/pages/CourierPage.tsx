import React, { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Card, CardContent, CircularProgress, Container, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import NearMeRounded from "@mui/icons-material/NearMeRounded";
import api from "@/lib/axios";
import { useNavigate } from "react-router-dom";
import { useSnackbar } from "@/lib/SnackbarContext";
import { useSocket } from "@/features/socket/hooks/useSocket";

type Coordinates = {
  latitude: number;
  longitude: number;
};

type IncomingDeliverySummary = {
  orderId: string | null;
  restaurantName: string;
  restaurantAddress: string;
  deliveryAddress: string;
  itemQuantity: number | null;
  totalPriceText: string;
};

function asRecord(v: unknown): Record<string, unknown> | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  return v as Record<string, unknown>;
}

function readNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const parsed = parseFloat(v.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function formatMoney(v: unknown): string {
  const n = readNumber(v);
  if (n == null) return "—";
  return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(n);
}

function normalizeIncomingDelivery(payload: unknown): IncomingDeliverySummary {
  const root = asRecord(payload);
  const order = asRecord(root?.order) ?? root;
  const restaurant = asRecord(order?.restaurant) ?? asRecord(root?.restaurant);

  const orderIdRaw = order?.id ?? order?.orderId ?? root?.orderId ?? root?.id;
  const orderId = typeof orderIdRaw === "string" ? orderIdRaw : orderIdRaw != null ? String(orderIdRaw) : null;

  const itemsRaw = Array.isArray(order?.items) ? order?.items : Array.isArray(root?.items) ? root?.items : [];
  const itemQuantity = itemsRaw?.reduce((sum, it) => {
    const rec = asRecord(it);
    const qty = readNumber(rec?.quantity);
    return sum + (qty ?? 1);
  }, 0);

  const restaurantNameRaw = restaurant?.name ?? order?.restaurantName ?? root?.restaurantName;
  const restaurantName =
    typeof restaurantNameRaw === "string" && restaurantNameRaw.trim() ? restaurantNameRaw : "—";

  const addressParts = [
    restaurant?.street,
    restaurant?.city,
    restaurant?.postalCode,
    restaurant?.country,
    order?.pickupAddress,
    root?.pickupAddress,
  ]
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .slice(0, 4);
  const restaurantAddress = addressParts.length ? addressParts.join(", ") : "—";

  const deliveryRaw =
    order?.deliveryAddress ?? root?.deliveryAddress ?? order?.dropoffAddress ?? root?.dropoffAddress;
  const deliveryAddress =
    typeof deliveryRaw === "string" && deliveryRaw.trim() ? deliveryRaw : "—";

  const totalRaw = order?.totalPrice ?? order?.total ?? root?.totalPrice ?? root?.total;
  const totalPriceText = formatMoney(totalRaw);

  return {
    orderId,
    restaurantName,
    restaurantAddress,
    deliveryAddress,
    itemQuantity: itemQuantity > 0 ? itemQuantity : null,
    totalPriceText,
  };
}

export default function CourierPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const { showSnackbar } = useSnackbar();
  const { connected, pendingOrder, clearPendingOrder, emitEvent } = useSocket();
  const toast = showSnackbar as (payload: { message: string; severity: string }) => void;

  const [sending, setSending] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [coords, setCoords] = useState<Coordinates | null>(null);
  const [error, setError] = useState<string>("");
  const [activeDelivery, setActiveDelivery] = useState<unknown | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Restore any in-flight delivery on load (survives refresh) so the courier can resume it.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get("/couriers/active-delivery");
        if (!cancelled) setActiveDelivery(res.data ?? null);
      } catch {
        if (!cancelled) setActiveDelivery(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const coordsText = useMemo(() => {
    if (!coords) return "Not sent yet";
    return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
  }, [coords]);

  const getCurrentPosition = (): Promise<GeolocationPosition> =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      });
    });

  const postCourierLocation = async (latitude: number, longitude: number): Promise<boolean> => {
    const payload = { latitude, longitude, lat: latitude, lng: longitude };
    const candidates = [
      () => api.post("/couriers/location", payload, { withCredentials: true }),
      () => api.post("/courier/location", payload, { withCredentials: true }),
      () => api.post("/couriers/me/location", payload, { withCredentials: true }),
    ];
    for (const run of candidates) {
      try {
        await run();
        return true;
      } catch {
        // try next route variant
      }
    }
    return false;
  };

  const handleSendLocation = async () => {
    if (sending) return;
    setSending(true);
    setError("");
    try {
      const position = await getCurrentPosition();
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const ok = await postCourierLocation(latitude, longitude);
      if (!ok) {
        setError("Could not send location to backend. Check courier location endpoint.");
        toast({ message: "Could not send location.", severity: "error" });
        return;
      }
      setCoords({ latitude, longitude });
      toast({ message: "Location sent.", severity: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not read your current location.";
      setError(msg);
      toast({ message: "Location permission or GPS failed.", severity: "error" });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!connected || !navigator.geolocation) {
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
        emitEvent("courier_location_update", { latitude, longitude, lat: latitude, lng: longitude });
      },
      () => {
        setStreaming(false);
      },
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
  }, [connected, emitEvent]);

  const incoming = useMemo(() => {
    return normalizeIncomingDelivery(pendingOrder);
  }, [pendingOrder]);

  const active = useMemo(() => normalizeIncomingDelivery(activeDelivery), [activeDelivery]);

  const handleResumeDelivery = () => {
    if (!active.orderId) return;
    const eta = (activeDelivery as { estimatedDeliveryTime?: string } | null)?.estimatedDeliveryTime ?? null;
    navigate(`/courier/delivery/${encodeURIComponent(active.orderId)}`, {
      state: { delivery: activeDelivery, summary: active, estimatedDeliveryTime: eta },
    });
  };

  const [accepting, setAccepting] = useState(false);

  const handleAcceptOrder = async () => {
    if (!incoming.orderId || accepting) return;
    setAccepting(true);
    try {
      const res = await api.post(
        `/couriers/delivery/${encodeURIComponent(incoming.orderId)}/accept`,
        {},
        { withCredentials: true }
      );
      const estimatedDeliveryTime = res.data?.estimatedDeliveryTime ?? null;
      navigate(`/courier/delivery/${encodeURIComponent(incoming.orderId)}`, {
        state: { delivery: pendingOrder, summary: incoming, estimatedDeliveryTime },
      });
      clearPendingOrder();
      toast({ message: "Delivery accepted.", severity: "success" });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not accept the delivery.";
      setError(msg);
      toast({ message: "Could not accept the delivery.", severity: "error" });
    } finally {
      setAccepting(false);
    }
  };

  const handleRejectOrder = () => {
    if (!incoming.orderId) return;
    emitEvent("reject_order", { orderId: incoming.orderId });
    clearPendingOrder();
    toast({ message: "Delivery rejected.", severity: "info" });
  };

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 4 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1.25} sx={{ mb: 2.5 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBackRounded />}
          onClick={() => navigate("/home")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back
        </Button>
        <Button
          variant="outlined"
          color="secondary"
          startIcon={<HistoryRounded />}
          onClick={() => navigate("/courier/history")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700 }}
        >
          History
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
              Courier location
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Send your current GPS location to backend.
            </Typography>

            <Alert severity={connected ? "success" : "warning"}>
              Socket: {connected ? "connected" : "disconnected"} {streaming ? "• live location streaming active" : ""}
            </Alert>

            <Alert severity="info">Last sent coordinates: {coordsText}</Alert>

            {active.orderId ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.success.main, 0.5)}`,
                  bgcolor: alpha(theme.palette.success.main, 0.08),
                }}
              >
                <CardContent>
                  <Stack spacing={1.25}>
                    <Typography fontWeight={800}>Active delivery in progress</Typography>
                    <Typography variant="body2">
                      <strong>Restaurant:</strong> {active.restaurantName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pickup:</strong> {active.restaurantAddress}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Deliver to:</strong> {active.deliveryAddress}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong> {active.totalPriceText}
                    </Typography>
                    <Button
                      variant="contained"
                      color="success"
                      onClick={handleResumeDelivery}
                      sx={{ textTransform: "none", alignSelf: "flex-start" }}
                    >
                      Resume delivery
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            ) : null}

            {pendingOrder ? (
              <Card
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.secondary.main, 0.4)}`,
                  bgcolor: alpha(theme.palette.secondary.main, 0.08),
                }}
              >
                <CardContent>
                  <Stack spacing={1.25}>
                    <Typography fontWeight={800}>Incoming delivery</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Order ID: {incoming.orderId ?? "Unknown"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Restaurant:</strong> {incoming.restaurantName}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Pickup:</strong> {incoming.restaurantAddress}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Deliver to:</strong> {incoming.deliveryAddress}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Items:</strong> {incoming.itemQuantity ?? "—"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total:</strong> {incoming.totalPriceText}
                    </Typography>
                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => void handleAcceptOrder()}
                        disabled={!incoming.orderId || accepting}
                        startIcon={accepting ? <CircularProgress size={16} color="inherit" /> : undefined}
                        sx={{ textTransform: "none" }}
                      >
                        {accepting ? "Accepting..." : "Accept"}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRejectOrder}
                        disabled={!incoming.orderId}
                        sx={{ textTransform: "none" }}
                      >
                        Reject
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            ) : (
              <Alert severity="info">Waiting for incoming deliveries…</Alert>
            )}

            {error ? <Alert severity="error">{error}</Alert> : null}

            <Button
              variant="contained"
              startIcon={sending ? <CircularProgress size={16} color="inherit" /> : <NearMeRounded />}
              onClick={() => void handleSendLocation()}
              disabled={sending}
              sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2, alignSelf: "flex-start" }}
            >
              {sending ? "Sending..." : "Send current location"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Container>
  );
}
