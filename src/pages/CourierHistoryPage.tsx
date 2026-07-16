import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import { useNavigate } from "react-router-dom";
import api from "@/lib/axios";

type Ride = {
  id: string;
  status: string;
  totalPrice?: number | string | null;
  createdAt?: string | null;
  restaurant?: { name?: string; street?: string; city?: string; postalCode?: string; country?: string } | null;
  deliveryAddress?: string | null;
  items?: Array<{ quantity?: number }> | null;
};

function formatMoney(v: unknown): string {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(n);
}

function restaurantAddress(r: Ride["restaurant"]): string {
  if (!r) return "—";
  const parts = [r.street, r.postalCode, r.city, r.country].filter(
    (x): x is string => typeof x === "string" && x.trim().length > 0
  );
  return parts.length ? parts.join(", ") : "—";
}

export default function CourierHistoryPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setLoading(true);
        const res = await api.get("/couriers/history");
        if (!cancelled) setRides(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setError("Could not load your ride history.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const deliveredCount = useMemo(
    () => rides.filter((r) => r.status === "delivered").length,
    [rides]
  );

  return (
    <Container maxWidth="md" sx={{ py: { xs: 2.5, md: 4 }, pb: 6 }}>
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

      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <HistoryRounded sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: "-0.03em" }}>
          Ride history
        </Typography>
        {!loading && rides.length > 0 ? (
          <Chip
            size="small"
            label={`${deliveredCount} delivered`}
            color="success"
            sx={{ fontWeight: 800 }}
          />
        ) : null}
      </Stack>

      {loading ? (
        <Stack alignItems="center" sx={{ py: 6 }}>
          <CircularProgress size={32} />
        </Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : rides.length === 0 ? (
        <Alert severity="info">No completed rides yet. Delivered and cancelled orders will show up here.</Alert>
      ) : (
        <Stack spacing={1.5}>
          {rides.map((ride) => {
            const nItems = (ride.items ?? []).reduce(
              (sum, it) => sum + (typeof it.quantity === "number" ? it.quantity : 1),
              0
            );
            const cancelled = ride.status === "cancelled";
            return (
              <Card
                key={ride.id}
                elevation={0}
                sx={{
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
                  bgcolor: alpha(theme.palette.background.paper, 0.6),
                }}
              >
                <CardContent>
                  <Stack spacing={0.75}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
                      <Typography fontWeight={800}>{ride.restaurant?.name ?? "Order"}</Typography>
                      <Chip
                        size="small"
                        label={cancelled ? "Cancelled" : "Delivered"}
                        color={cancelled ? "warning" : "success"}
                        variant="outlined"
                        sx={{ fontWeight: 800 }}
                      />
                    </Stack>
                    {ride.createdAt ? (
                      <Typography variant="caption" color="text.secondary">
                        {new Date(ride.createdAt).toLocaleString("el-GR")}
                      </Typography>
                    ) : null}
                    <Typography variant="body2">
                      <strong>Pickup:</strong> {restaurantAddress(ride.restaurant)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Deliver to:</strong> {ride.deliveryAddress?.trim() || "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {nItems} item{nItems === 1 ? "" : "s"} · {formatMoney(ride.totalPrice)}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Container>
  );
}
