import { RestaurantOrdersPanel } from "@/features/restaurants-user/components/RestaurantOrdersPanel";
import api from "@/lib/axios";
import type { Restaurant } from "@/features/restaurants/types/RestaurantData";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import {
  Box,
  Button,
  CircularProgress,
  Container,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import React, { useEffect, useState } from "react";
import { Link as RouterLink, useParams } from "react-router-dom";

/**
 * Dedicated orders hub for a venue (partner).
 * Route: `/restaurant/my/:id/orders`
 */
export default function MyRestaurantOrdersPage() {
  const { id } = useParams<{ id: string }>();
  const theme = useTheme();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loadingVenue, setLoadingVenue] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    void (async () => {
      try {
        setLoadingVenue(true);
        const res = await api.get(`/restaurants/my/${id}`);
        if (!cancelled) setRestaurant(res.data);
      } catch {
        if (!cancelled) setRestaurant(null);
      } finally {
        if (!cancelled) setLoadingVenue(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const listBase = id ? `/restaurant/my/${encodeURIComponent(id)}/orders` : "";

  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "calc(100vh - 72px)", py: { xs: 2, sm: 3 } }}>
      <Container maxWidth="md">
        <Button
          component={RouterLink}
          to={id ? `/restaurant/my/${encodeURIComponent(id)}` : "/restaurant/my"}
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
          Back to venue
        </Button>

        {loadingVenue ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={36} />
          </Box>
        ) : (
          <>
            <Typography variant="h5" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.5 }}>
              Orders
              {restaurant?.name ? ` · ${restaurant.name}` : ""}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.5 }}>
              Manage live and past orders. Open an order for full line items and status controls.
            </Typography>
            {id && (
              <RestaurantOrdersPanel restaurantId={id} orderDetailBasePath={listBase} />
            )}
          </>
        )}
      </Container>
    </Box>
  );
}
