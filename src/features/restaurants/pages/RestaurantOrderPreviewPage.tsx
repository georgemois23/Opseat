import { CustomerOrderFullDetail } from "@/features/customer/components/CustomerOrderDetails";
import {
  cancelCustomerOrder,
  fetchCustomerOrderById,
} from "@/features/restaurants/services/customerOrders.api";
import type { CustomerOrder } from "@/features/restaurants/types/customerOrder.types";
import { OrderStatus } from "@/features/restaurants/types/orderStatus";
import { useSnackbar } from "@/lib/SnackbarContext";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import ReceiptLongRounded from "@mui/icons-material/ReceiptLongRounded";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

const RestaurantOrderPreviewPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const [order, setOrder] = useState<CustomerOrder | null | undefined>(undefined);
  const [cancelling, setCancelling] = useState(false);

  const load = useCallback(async () => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setOrder(undefined);
    try {
      const o = await fetchCustomerOrderById(orderId);
      setOrder(o);
    } catch {
      setOrder(null);
    }
  }, [orderId]);

  useEffect(() => {
    void load();
  }, [load]);

  const { backHref, backLabel } = useMemo(() => {
    if (order === undefined) return { backHref: "/home", backLabel: "Back" };
    if (order === null) return { backHref: "/home", backLabel: "Back to home" };
    const s = order.restaurant?.slug ?? order.restaurant?.id;
    if (s) {
      return {
        backHref: `/restaurant/${encodeURIComponent(s)}`,
        backLabel: "Back to restaurant",
      };
    }
    return { backHref: "/home", backLabel: "Back to home" };
  }, [order]);

  const border = alpha(theme.palette.divider, 0.9);
  const canCancelOrder = !!order && order.status === OrderStatus.PENDING;

  const handleCancelOrder = useCallback(async () => {
    if (!order || order.status !== OrderStatus.PENDING || cancelling) return;
    try {
      setCancelling(true);
      await cancelCustomerOrder(order.id);
      (showSnackbar as (payload: { message: string; severity: string }) => void)({
        message: "Order cancelled.",
        severity: "success",
      });
      await load();
    } catch {
      (showSnackbar as (payload: { message: string; severity: string }) => void)({
        message: "Could not cancel order.",
        severity: "error",
      });
    } finally {
      setCancelling(false);
    }
  }, [order, cancelling, showSnackbar, load]);

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 72px)",
        bgcolor: "background.default",
        py: { xs: 2, sm: 4 },
        px: { xs: 0, sm: 1 },
      }}
    >
      <Container maxWidth="sm">
        <Button
          component={RouterLink}
          to={backHref}
          startIcon={<ArrowBackRounded />}
          variant="text"
          sx={{
            mb: 2,
            textTransform: "none",
            fontWeight: 700,
            color: "text.primary",
            "&:hover": { bgcolor: alpha(theme.palette.action.hover, 0.08) },
          }}
        >
          {backLabel}
        </Button>

        <Paper
          elevation={0}
          sx={{
            p: { xs: 2.5, sm: 3 },
            borderRadius: 3,
            border: `1px solid ${border}`,
            bgcolor: "background.paper",
            boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
            <ReceiptLongRounded color="secondary" />
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em">
              Order details
            </Typography>
          </Stack>

          {order === undefined ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress size={36} />
            </Box>
          ) : order === null ? (
            <Typography color="text.secondary" sx={{ lineHeight: 1.6 }}>
              We couldn&apos;t find this order. It may belong to another account or the link is out of date.
            </Typography>
          ) : (
            <>
              <CustomerOrderFullDetail order={order} />
              {canCancelOrder && (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => void handleCancelOrder()}
                  disabled={cancelling}
                  sx={{
                    mt: 2.5,
                    textTransform: "none",
                    fontWeight: 700,
                    borderRadius: 2,
                  }}
                >
                  {cancelling ? "Cancelling..." : "Cancel order"}
                </Button>
              )}
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default RestaurantOrderPreviewPage;
