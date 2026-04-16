import React from "react";
import {
  Box,
  Typography,
  Button,
  Stack,
  IconButton,
  Divider,
  Paper,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ShoppingBasketOutlined from "@mui/icons-material/ShoppingBasketOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import type { RestaurantCartItem } from "@/features/restaurants/types/orderCart.types";

interface SidebarCartProps {
  items: RestaurantCartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onCheckout: () => void;
  /** Opens item detail / edit (e.g. preview modal). Quantity controls stop propagation. */
  onLineClick?: (item: RestaurantCartItem) => void;
  /** When set (e.g. official `order.totalPrice` from API), used for subtotal + checkout row. */
  displayTotal?: number | null;
  minimumOrderAmount?: number | string;
  isMobile?: boolean;
}

const SideBarCart: React.FC<SidebarCartProps> = ({
  items,
  onUpdateQuantity,
  onRemove,
  onCheckout,
  onLineClick,
  displayTotal,
  minimumOrderAmount = 0,
  isMobile = false,
}) => {
  const theme = useTheme();
  const sumLines = items.reduce((sum, item) => {
    const p = parseFloat(String(item.price)) || 0;
    const q = Number(item.quantity) || 0;
    return sum + p * q;
  }, 0);
  const subtotal =
    typeof displayTotal === "number" && Number.isFinite(displayTotal) ? displayTotal : sumLines;
  const minOrder = Number(minimumOrderAmount) || 0;
  const missingForMinimum =
    minOrder > 0 ? Math.max(0, minOrder - subtotal) : 0;
  const checkoutDisabled = subtotal < minOrder;

  const border = alpha(theme.palette.primary.main, 0.16);

  return (
    <Paper
      elevation={0}
      sx={{
        height: isMobile ? "100%" : "calc(100vh - 140px)",
        maxHeight: isMobile ? "100%" : undefined,
        minHeight: isMobile ? 0 : undefined,
        flex: isMobile ? 1 : undefined,
        display: "flex",
        flexDirection: "column",
        position: isMobile ? "relative" : "sticky",
        top: isMobile ? undefined : 120,
        borderRadius: isMobile ? 0 : 3,
        overflow: "hidden",
        bgcolor: alpha(theme.palette.background.paper, 0.85),
        backdropFilter: "blur(12px)",
        border: isMobile ?  "none" :`1px solid ${border}`,
        backgroundImage: "none",
      }}
    >
      <Box
        sx={{
          p: 2,
          flexShrink: 0,
          borderBottom: `1px solid ${border}`,
        }}
      >
        <Typography
          variant="overline"
          sx={{
            display: "block",
            letterSpacing: "0.12em",
            fontWeight: 700,
            color: alpha(theme.palette.secondary.main, 0.95),
            mb: 0.25,
          }}
        >
          Your basket
        </Typography>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ShoppingBasketOutlined sx={{ color: alpha(theme.palette.primary.light, 0.95), fontSize: 26 }} />
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            Order
          </Typography>
        </Stack>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          p: 2,
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.35),
          },
        }}
      >
        {items.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              borderRadius: 2,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.28)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.35),
            }}
          >
            <ShoppingBasketOutlined
              sx={{ fontSize: 44, color: alpha(theme.palette.primary.main, 0.4), mb: 1.5 }}
            />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
              Nothing here yet
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75, lineHeight: 1.5 }}>
              Add dishes from the menu to place an order.
            </Typography>
          </Box>
        ) : (
          <Stack spacing={0}>
            {items.map((item, index) => {
              const p = parseFloat(String(item.price)) || 0;
              const lineTotal = p * item.quantity;
              const extras = (item.customizedIngredients ?? [])
                .map((l) => {
                  const ing = l?.ingredient as { name?: string } | undefined;
                  return typeof ing?.name === "string" ? ing.name : null;
                })
                .filter((n): n is string => typeof n === "string" && n.length > 0);
              return (
                <Box key={item.id}>
                  <Stack
                    direction="row"
                    spacing={1.5}
                    onClick={() => onLineClick?.(item)}
                    sx={{
                      py: 1.75,
                      ...(onLineClick
                        ? {
                            cursor: "pointer",
                            borderRadius: 2,
                            mx: -0.5,
                            px: 0.5,
                            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          }
                        : {}),
                    }}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        flexShrink: 0,
                        overflow: "hidden",
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      }}
                    >
                      {item.imageUrl ? (
                        <Box
                          component="img"
                          src={item.imageUrl}
                          alt=""
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      ) : (
                        <Box
                          sx={{
                            width: "100%",
                            height: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: alpha(theme.palette.primary.light, 0.5),
                            fontSize: "1.35rem",
                            fontWeight: 800,
                          }}
                        >
                          {item.name?.[0]?.toUpperCase() ?? "·"}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Typography variant="body2" fontWeight={800} sx={{ lineHeight: 1.35 }}>
                          {item.name}
                        </Typography>
                        <Typography variant="body2" fontWeight={800} sx={{ color: alpha(theme.palette.primary.light, 1), flexShrink: 0 }}>
                          €{lineTotal.toFixed(2)}
                        </Typography>
                      </Stack>
                      {extras.length > 0 ? (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: "block", textAlign: "left", mt: 0.35, lineHeight: 1.35 }}
                        >
                          {extras.join(", ")}
                        </Typography>
                      ) : null}
                      {(item.comment || item.comments) ? (
                        <Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "left", mt: 0.25, fontStyle: "italic" }}>
                          Comment: {item.comment ?? item.comments}
                        </Typography>
                      ) : null}

                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 1.25 }}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          onClick={(e) => e.stopPropagation()}
                          sx={{
                            border: `1px solid ${alpha(theme.palette.primary.main, 0.28)}`,
                            borderRadius: 2,
                            bgcolor: alpha(theme.palette.common.white, 0.04),
                          }}
                        >
                          <IconButton
                            size="small"
                            onClick={() => onUpdateQuantity(item.id, -1)}
                            aria-label={item.quantity === 1 ? "Remove item" : "Decrease quantity"}
                            sx={{ color: item.quantity === 1 ? "error.light" : "text.primary" }}
                          >
                            {item.quantity === 1 ? (
                              <DeleteOutlineIcon fontSize="small" />
                            ) : (
                              <RemoveIcon fontSize="small" />
                            )}
                          </IconButton>
                          <Typography sx={{ px: 1.25, fontSize: "0.875rem", fontWeight: 800, minWidth: 24, textAlign: "center" }}>
                            {item.quantity}
                          </Typography>
                          <IconButton size="small" onClick={() => onUpdateQuantity(item.id, 1)} aria-label="Increase quantity">
                            <AddIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </Stack>
                    </Box>
                  </Stack>
                  {index < items.length - 1 ? (
                    <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }} />
                  ) : null}
                </Box>
              );
            })}
          </Stack>
        )}
      </Box>

      {items.length > 0 && (
        <Box
          sx={{
            p: 2,
            flexShrink: 0,
            borderTop: `1px solid ${border}`,
            bgcolor: alpha(theme.palette.common.black, 0.12),
          }}
        >
          {checkoutDisabled && minOrder > 0 && (
            <Typography
              variant="caption"
              color={alpha(theme.palette.secondary.main, 0.95)}
              sx={{ display: "block", mt: 1, lineHeight: 1.4, textAlign: "center", fontWeight: 700 }}
            >
              Add {missingForMinimum.toFixed(2)}€ more to reach the minimum order (€{minOrder.toFixed(2)}).
            </Typography>
          )}
          <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 1.5 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Subtotal
            </Typography>
            <Typography variant="h6" fontWeight={800}>
              €{subtotal.toFixed(2)}
            </Typography>
          </Stack>
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={onCheckout}
            disabled={checkoutDisabled}
            sx={{
              borderRadius: 2,
              textTransform: "none",
              py: 1.35,
              fontWeight: 700,
              boxShadow: "none",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              px: 2,
            }}
          >
            <Box
              sx={{
                minWidth: 28,
                height: 28,
                px: 0.75,
                borderRadius: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.8rem",
                bgcolor: alpha(theme.palette.common.white, 0.22),
                color: theme.palette.primary.contrastText,
              }}
            >
              {items.reduce((n, i) => n + i.quantity, 0)}
            </Box>
            <Typography fontWeight={800}>Checkout</Typography>
            <Typography fontWeight={800}>€{subtotal.toFixed(2)}</Typography>
          </Button>
          
        </Box>
      )}
    </Paper>
  );
};

export default SideBarCart;
