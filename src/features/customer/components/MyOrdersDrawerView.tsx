import { fetchMyOrders } from "@/features/restaurants/services/customerOrders.api";
import {
  CustomerOrder,
  normalizeCustomerOrdersResponse,
} from "@/features/restaurants/types/customerOrder.types";
import { ORDER_STATUS_LABELS, muiOrderStatusChipColor } from "@/features/restaurants/types/orderStatus";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  CustomerOrderItemsList,
  OrderDeliveryRow,
  orderDeliveryTypeLabel,
} from "@/features/customer/components/CustomerOrderDetails";
import { alpha, useTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMobile } from "@/lib/useMobile";

function SheetHandle() {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", pt: 1, pb: 0.5, flexShrink: 0 }}>
      <Box
        sx={{
          width: 36,
          height: 4,
          borderRadius: 2,
          bgcolor: (t) => alpha(t.palette.text.secondary, 0.35),
        }}
      />
    </Box>
  );
}

const sheetPadding = {
  px: { xs: 2, sm: 3 },
  pt: { xs: 0, sm: 3 },
  pb: { xs: "calc(20px + env(safe-area-inset-bottom, 0px))", sm: 3 },
};

export default function MyOrdersDrawerView({
  onBack,
  onCloseDrawer,
}: {
  onBack: () => void;
  /** After navigating to a restaurant, close the account drawer. */
  onCloseDrawer: () => void;
}) {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMobile();
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await fetchMyOrders();
      setOrders(normalizeCustomerOrdersResponse(data));
    } catch (e) {
      console.error(e);
      setError("Could not load your orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const goOrderPreview = (o: CustomerOrder) => {
    navigate(`/order/${encodeURIComponent(o.id)}`);
    onCloseDrawer();
  };

  return (
    <Box
      sx={{
        width: isMobile ? "100%" : 400,
        maxWidth: "100%",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        /** Single scroll container so expanded accordions aren’t clipped by a nested flex region. */
        maxHeight: isMobile ? "min(90dvh, 100%)" : "calc(100vh - 16px)",
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        ...sheetPadding,
      }}
    >
      {isMobile && <SheetHandle />}
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, pt: isMobile ? 0.5 : 0 }}>
        <IconButton onClick={onBack} aria-label="Back" sx={{ ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>
        <ReceiptLongRounded sx={{ color: alpha(theme.palette.secondary.main, 0.9) }} />
        <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
          My orders
        </Typography>
      </Stack>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.5 }}>
        Orders after checkout appear here. Draft baskets stay on the restaurant menu until you submit.
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={32} sx={{ color: alpha(theme.palette.primary.main, 0.85) }} />
        </Box>
      ) : error ? (
        <Typography color="error" variant="body2">
          {error}
        </Typography>
      ) : orders.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 2,
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            No submitted orders yet. Browse restaurants and place an order to see it here.
          </Typography>
        </Paper>
      ) : (
        <Stack spacing={1} sx={{ width: "100%", pr: 0.5, pb: 0.5 }}>
          {orders.map((o) => {
            const total =
              o.totalPrice != null ? parseFloat(String(o.totalPrice)) : null;
            const name = o.restaurant?.name ?? "Restaurant";
            const border = alpha(theme.palette.primary.main, 0.14);
            return (
              <Accordion
                key={o.id}
                disableGutters
                elevation={0}
                sx={{
                  border: `1px solid ${border}`,
                  borderRadius: "12px !important",
                  bgcolor: alpha(theme.palette.background.paper, 0.5),
                  "&:before": { display: "none" },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: alpha(theme.palette.text.secondary, 0.85) }} />}
                  sx={{
                    px: 2,
                    py: 1.25,
                    alignItems: "flex-start",
                    "& .MuiAccordionSummary-content": {
                      my: 0.5,
                      overflow: "visible",
                      width: "100%",
                    },
                  }}
                >
                  <Stack spacing={1} sx={{ width: "100%", minWidth: 0, pr: 1, overflow: "visible" }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                      <Typography fontWeight={800} sx={{ lineHeight: 1.3, wordBreak: "break-word", pr: 0.5 }}>
                        {name}
                      </Typography>
                      <Chip
                        size="small"
                        label={ORDER_STATUS_LABELS[o.status]}
                        color={muiOrderStatusChipColor(o.status)}
                        sx={{ fontWeight: 800, flexShrink: 0 }}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Placed{" "}
                      {o.createdAt
                        ? new Date(o.createdAt).toLocaleString()
                        : `order ${o.id.slice(0, 8)}…`}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Type: {orderDeliveryTypeLabel(o.deliveryType)}
                    </Typography>
                    <OrderDeliveryRow order={o} />
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ px: 2, pt: 0, pb: 2, display: "block", overflow: "visible" }}>
                  <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 800, letterSpacing: "0.06em" }}>
                    Your order
                  </Typography>
                  <Box sx={{ mt: 1, mb: 1.5 }}>
                    <CustomerOrderItemsList items={o.items ?? []} />
                  </Box>
                  {total != null && Number.isFinite(total) && (
                    <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1.5 }}>
                      Total €{total.toFixed(2)}
                    </Typography>
                  )}
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => goOrderPreview(o)}
                    sx={{ textTransform: "none", fontWeight: 700, borderRadius: 2 }}
                  >
                    View order
                  </Button>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

      {!loading && orders.length > 0 && (
        <Button
          size="small"
          variant="text"
          onClick={() => void load()}
          sx={{ mt: 1.5, alignSelf: "flex-start", textTransform: "none", fontWeight: 700 }}
        >
          Refresh
        </Button>
      )}
    </Box>
  );
}
