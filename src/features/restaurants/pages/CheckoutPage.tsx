import api from "@/lib/axios";
import { useRestaurantOrderCart } from "@/features/restaurants/hooks/useRestaurantOrderCart";
import ItemPreviewModal from "@/features/restaurants/components/PreviewItem";
import { submitOrder } from "@/features/restaurants/services/restaurantOrder.api";
import { Restaurant } from "@/features/restaurants/types/RestaurantData";
import type { RestaurantCartItem } from "@/features/restaurants/types/orderCart.types";
import { useLocationContext } from "@/features/location/services/LocationContext";
import {
  buildNearbyParamsFromGps,
  readCachedGpsContext,
} from "@/features/location/services/locationRequestParams";
import { useSnackbar } from "@/lib/SnackbarContext";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import LocationOnOutlined from "@mui/icons-material/LocationOnOutlined";
import ManageAccountsRounded from "@mui/icons-material/ManageAccountsRounded";
import RestaurantRounded from "@mui/icons-material/RestaurantRounded";
import ShoppingBagOutlined from "@mui/icons-material/ShoppingBagOutlined";
import LocalShippingRounded from "@mui/icons-material/LocalShippingRounded";
import StorefrontRounded from "@mui/icons-material/StorefrontRounded";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link as RouterLink, useNavigate, useParams } from "react-router-dom";

type SnackbarFn = (opts: { message: string; severity: string }) => void;
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || "";
export enum DeliveryType {
  DELIVERY = "delivery",
  PICKUP = "pickup",
}

interface SavedAddress {
  id: string;
  label: string;
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
  isDefault?: boolean;
  latitude?: number;
  longitude?: number;
}

type ReverseAddress = {
  street: string;
  streetNumber: string;
  city: string;
  country: string;
  postalCode: string;
};

async function reverseGeocodeAddressFromGps(
  latitude: number,
  longitude: number
): Promise<ReverseAddress | null> {
  if (!MAPBOX_TOKEN) return null;
  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json`;
    const res = await api.get(url, {
      params: {
        access_token: MAPBOX_TOKEN,
        types: "address,place,postcode,country",
        limit: 1,
      },
      withCredentials: false,
    });
    const feature = Array.isArray(res.data?.features) ? res.data.features[0] : null;
    if (!feature) return null;
    const context = Array.isArray(feature.context) ? feature.context : [];
    return {
      street: String(feature.text || "").trim(),
      streetNumber: String(feature.address || "").trim(),
      city:
        String(
          context.find((c: { id?: string; text?: string }) => c?.id?.includes("place"))?.text || ""
        ).trim(),
      country:
        String(
          context.find((c: { id?: string; text?: string }) => c?.id?.includes("country"))?.text || ""
        ).trim(),
      postalCode:
        String(
          context.find((c: { id?: string; text?: string }) => c?.id?.includes("postcode"))?.text || ""
        ).trim(),
    };
  } catch {
    return null;
  }
}

function formatAddress(a: SavedAddress): string {
  const line1 = [a.streetNumber, a.street].filter(Boolean).join(" ").trim();
  const line2 = [a.postalCode, a.city].filter(Boolean).join(" ").trim();
  return [line1, line2, a.country].filter(Boolean).join(", ");
}

const CheckoutPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { showSnackbar } = useSnackbar();
  const { locationSource } = useLocationContext();
  const toast = showSnackbar as SnackbarFn;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [restaurantLoading, setRestaurantLoading] = useState(true);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resolvingAddress, setResolvingAddress] = useState(false);
  const [needsDeliveryLocation, setNeedsDeliveryLocation] = useState(false);
  const [checkoutPreviewItem, setCheckoutPreviewItem] = useState<any | null>(null);
  const [deliveryType, setDeliveryType] = useState<DeliveryType>(DeliveryType.DELIVERY);

  const outOfRange = Boolean(restaurant?.outOfRange);
  const acceptingOrders = Boolean(restaurant?.isDelivering) && !outOfRange;
  const canCheckoutByType =
    deliveryType === DeliveryType.DELIVERY
      ? acceptingOrders
      : Boolean(restaurant?.isDelivering);

  const {
    cartItems,
    subtotal,
    orderId,
    isOrderBootstrapping,
  } = useRestaurantOrderCart({
    restaurantId: restaurant?.id,
    acceptingOrders,
  });

  const defaultAddress = addresses.find((a) => a.isDefault) ?? addresses[0];
  const gpsCtx = readCachedGpsContext();
  const gpsParamsForRequest = useMemo(
    () =>
      locationSource === "gps"
        ? buildNearbyParamsFromGps(gpsCtx)
        : undefined,
    [locationSource, gpsCtx?.latitude, gpsCtx?.longitude]
  );
  const checkoutAddress =
    deliveryType === DeliveryType.DELIVERY && locationSource === "gps"
      ? undefined
      : defaultAddress;

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    void (async () => {
      try {
        setRestaurantLoading(true);
        const res = await api.get(`/restaurants/details/${slug}`, {
          params: gpsParamsForRequest,
        });
        if (!cancelled) setRestaurant(res.data);
      } catch {
        if (!cancelled) setRestaurant(null);
      } finally {
        if (!cancelled) setRestaurantLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, gpsParamsForRequest]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        setAddressesLoading(true);
        const res = await api.get("/user-address/my-addresses");
        if (!cancelled) setAddresses(Array.isArray(res.data) ? res.data : []);
      } catch {
        if (!cancelled) setAddresses([]);
      } finally {
        if (!cancelled) setAddressesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!slug || restaurantLoading || !restaurant || isOrderBootstrapping) return;
    if (cartItems.length === 0) {
      // navigate(`/restaurant/${slug}`, { replace: true });
    }
  }, [slug, restaurant, restaurantLoading, isOrderBootstrapping, cartItems.length, navigate]);

  useEffect(() => {
    if (restaurant?.name) {
      document.title = `Checkout • ${restaurant.name} • OpsEat`;
    }
  }, [restaurant?.name]);

  useEffect(() => {
    if (deliveryType !== DeliveryType.DELIVERY) return;
    if (!slug || restaurantLoading || addressesLoading || !restaurant || !outOfRange || resolvingAddress) return;
    if (!addresses.length) {
      setNeedsDeliveryLocation(true);
      return;
    }

    let cancelled = false;
    void (async () => {
      setResolvingAddress(true);
      setNeedsDeliveryLocation(false);
      const originalDefaultId = addresses.find((a) => a.isDefault)?.id ?? addresses[0]?.id ?? null;

      const candidates = [
        ...addresses.filter((a) => !a.isDefault),
      ];

      let matched: SavedAddress | null = null;
      for (const candidate of candidates) {
        try {
          await api.post(`/user-address/set-default/${candidate.id}`, {}, { withCredentials: true });
          const res = await api.get(`/restaurants/details/${slug}`, {
            params: gpsParamsForRequest,
          });
          if (cancelled) return;
          if (!res.data?.outOfRange) {
            matched = candidate;
            setRestaurant(res.data);
            break;
          }
        } catch {
          // keep trying other addresses
        }
      }

      if (cancelled) return;

      if (matched) {
        setAddresses((prev) => {
          const next = prev.map((a) => ({ ...a, isDefault: a.id === matched!.id }));
          next.sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0));
          return next;
        });
        toast({
          message: `Switched delivery address to "${matched.label || matched.street}" because your default is out of range.`,
          severity: "info",
        });
      } else {
        if (originalDefaultId) {
          try {
            await api.post(`/user-address/set-default/${originalDefaultId}`, {}, { withCredentials: true });
            const res = await api.get(`/restaurants/details/${slug}`, {
              params: gpsParamsForRequest,
            });
            if (!cancelled) setRestaurant(res.data);
          } catch {
            // no-op, we still show guidance below
          }
        }
        setNeedsDeliveryLocation(true);
      }

      setResolvingAddress(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [
    deliveryType,
    slug,
    restaurant,
    restaurantLoading,
    addresses,
    addressesLoading,
    outOfRange,
    resolvingAddress,
    gpsCtx?.latitude,
    gpsCtx?.longitude,
    gpsParamsForRequest,
    toast,
  ]);

  const menuPath = slug ? `/restaurant/${slug}` : "/home";

  const handlePlaceOrder = useCallback(async () => {
    if (!orderId) {
      toast({ message: "No active order to submit.", severity: "error" });
      return;
    }
    if (deliveryType === DeliveryType.DELIVERY && !checkoutAddress) {
      toast({ message: "Add a delivery address in the header before placing your order.", severity: "error" });
      return;
    }
    setSubmitting(true);
    try {
      await submitOrder(orderId, {
        deliveryAddress:
          deliveryType === DeliveryType.DELIVERY && checkoutAddress
            ? formatAddress(checkoutAddress)
            : undefined,
        deliveryLat:
          deliveryType === DeliveryType.DELIVERY && checkoutAddress
            ? checkoutAddress.latitude
              ? Number(checkoutAddress.latitude)
              : gpsCtx?.latitude
            : undefined,
        deliveryLng:
          deliveryType === DeliveryType.DELIVERY && checkoutAddress
            ? checkoutAddress.longitude
              ? Number(checkoutAddress.longitude)
              : gpsCtx?.longitude
            : undefined,
        deliveryType,
        delivery_type: deliveryType,
      });
      toast({ message: "Order placed successfully.", severity: "success" });
      navigate("/home", { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Could not place order. Try again.";
      toast({ message: msg, severity: "error" });
    } finally {
      setSubmitting(false);
    }
  }, [orderId, deliveryType, checkoutAddress, gpsCtx?.latitude, gpsCtx?.longitude, navigate, toast]);

  const handleOpenAddressDrawerWithLocation = useCallback(async () => {
    if (!gpsCtx) {
      toast({
        message: "Current location not available yet. Enable location permission and try again.",
        severity: "warning",
      });
      return;
    }

    const reverse = await reverseGeocodeAddressFromGps(gpsCtx.latitude, gpsCtx.longitude);
    window.dispatchEvent(
      new CustomEvent("opseat:address-prefill", {
        detail: {
          label: reverse?.street || gpsCtx.city || "Current location",
          street: reverse?.street || "",
          streetNumber: reverse?.streetNumber || "",
          city: reverse?.city || gpsCtx.city || "",
          country: reverse?.country || "",
          postalCode: reverse?.postalCode || "",
          latitude: gpsCtx.latitude,
          longitude: gpsCtx.longitude,
        },
      })
    );
    toast({
      message: "Address form opened with detected address details. Review and save.",
      severity: "info",
    });
  }, [gpsCtx, toast]);

  const handleOpenAddressDrawer = useCallback(() => {
    window.dispatchEvent(new CustomEvent("opseat:address-open"));
  }, []);

  const handleAutoAddCurrentLocation = useCallback(async () => {
    if (!gpsCtx) {
      toast({
        message: "Current location not available yet. Enable location permission and try again.",
        severity: "warning",
      });
      return;
    }

    const reverse = await reverseGeocodeAddressFromGps(gpsCtx.latitude, gpsCtx.longitude);
    const payload = {
      label: "Current location",
      street: reverse?.street || "Current location",
      streetNumber: reverse?.streetNumber || "",
      city: reverse?.city || gpsCtx.city || "Current city",
      country: reverse?.country || "Greece",
      postalCode: reverse?.postalCode || "",
      latitude: gpsCtx.latitude,
      longitude: gpsCtx.longitude,
    };

    try {
      const addRes = await api.post("/user-address/add", payload, { withCredentials: true });
      const createdId =
        typeof addRes?.data?.id === "string"
          ? addRes.data.id
          : typeof addRes?.data?.address?.id === "string"
            ? addRes.data.address.id
            : null;

      const res = await api.get("/user-address/my-addresses");
      const freshAddresses: SavedAddress[] = Array.isArray(res.data) ? res.data : [];

      let defaultId: string | null = createdId;
      if (!defaultId) {
        const byCoords = freshAddresses.find(
          (a) =>
            typeof a.latitude === "number" &&
            typeof a.longitude === "number" &&
            Math.abs(a.latitude - gpsCtx.latitude) < 1e-6 &&
            Math.abs(a.longitude - gpsCtx.longitude) < 1e-6
        );
        defaultId = byCoords?.id ?? null;
      }

      if (defaultId) {
        try {
          await api.post(`/user-address/set-default/${defaultId}`, {}, { withCredentials: true });
          const refreshed = await api.get("/user-address/my-addresses");
          const sorted: SavedAddress[] = Array.isArray(refreshed.data) ? refreshed.data : [];
          setAddresses(sorted);
        } catch {
          setAddresses(freshAddresses);
        }
      } else {
        setAddresses(freshAddresses);
      }

      setNeedsDeliveryLocation(false);
      toast({
        message: "Current location saved and set as default.",
        severity: "success",
      });
    } catch {
      handleOpenAddressDrawerWithLocation();
      toast({
        message: "Could not auto-save location. Please confirm and save it in Address Manager.",
        severity: "warning",
      });
    }
  }, [gpsCtx, handleOpenAddressDrawerWithLocation, toast]);

  const border = alpha(theme.palette.primary.main, 0.14);

  const openCheckoutItemPreview = useCallback((item: RestaurantCartItem) => {
    const ingredients = (item.customizedIngredients ?? [])
      .map((l) => l?.ingredient)
      .filter((ing): ing is { id?: string; name?: string } => !!ing?.id);

    const modalItem = {
      id: item.menuItemId ?? item.id,
      name: item.name,
      price: item.price,
      imageUrl: item.imageUrl,
      ingredients: ingredients.map((ingredient) => ({ ingredient })),
      comments: typeof item.comment === "string" ? item.comment : item.comments ?? "",
    };
    setCheckoutPreviewItem(modalItem);
  }, []);
  

  if (restaurantLoading || !slug) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
        <CircularProgress sx={{ color: alpha(theme.palette.primary.light, 0.9) }} />
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box sx={{ p: 3, maxWidth: 480, mx: "auto", mt: 4 }}>
        <Typography color="error" fontWeight={700}>
          Restaurant not found
        </Typography>
        <Button component={RouterLink} to="/home" sx={{ mt: 2 }}>
          Back to home
        </Button>
      </Box>
    );
  }

  if (!canCheckoutByType) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, mx: "auto" }}>
        <Button
          component={RouterLink}
          to={menuPath}
          startIcon={<ArrowBackRounded />}
          sx={{ mb: 2, textTransform: "none", fontWeight: 700 }}
        >
          Back to menu
        </Button>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.warning.main, 0.35)}`,
            bgcolor: alpha(theme.palette.warning.main, 0.08),
          }}
        >
          <Typography fontWeight={800}>Checkout unavailable</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {deliveryType === DeliveryType.DELIVERY
              ? resolvingAddress
                ? "Checking your other saved locations for delivery availability…"
                : needsDeliveryLocation
                  ? "This restaurant is not close to your saved default location. Add/set another delivery location from the header to continue."
                  : "This restaurant isn&apos;t delivering to your address right now. You can return to the menu to browse."
              : "This restaurant is not accepting pickup orders right now."}
          </Typography>
          {deliveryType === DeliveryType.DELIVERY && gpsCtx && (
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={handleOpenAddressDrawerWithLocation}
              sx={{ mt: 1.5, textTransform: "none", fontWeight: 700 }}
            >
              Save address
            </Button>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, pb: 8, maxWidth: 720, mx: "auto" }}>
      <Button
        component={RouterLink}
        to={menuPath}
        startIcon={<ArrowBackRounded />}
        sx={{ mb: 2, textTransform: "none", fontWeight: 700, color: "text.secondary" }}
      >
        Back to menu
      </Button>

      <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" sx={{ mb: 0.5 }}>
        Checkout
      </Typography>
      <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 3 }}>
        <RestaurantRounded sx={{ fontSize: 20, color: alpha(theme.palette.secondary.main, 0.95) }} />
        <Typography variant="subtitle1" fontWeight={700} color="text.secondary">
          {restaurant.name}
        </Typography>
      </Stack>

      <Stack spacing={2.5}>
        <Paper
          elevation={0}
          sx={{
            p: 1.5,
            borderRadius: 3,
            border: `1px solid ${border}`,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
          }}
        >
          <ToggleButtonGroup
            value={deliveryType}
            exclusive
            fullWidth
            onChange={(_, v) => {
              if (!v) return;
              setDeliveryType(v as DeliveryType);
            }}
            sx={{
              "& .MuiToggleButton-root": {
                textTransform: "none",
                fontWeight: 800,
                gap: 0.75,
                borderColor: alpha(theme.palette.primary.main, 0.25),
                // borderRadius: 1,
              },
            }}
          >
            <ToggleButton value={DeliveryType.DELIVERY}>
              <LocalShippingRounded fontSize="small" />
              Delivery
            </ToggleButton>
            <ToggleButton value={DeliveryType.PICKUP}>
              <StorefrontRounded fontSize="small" />
              Pickup
            </ToggleButton>
          </ToggleButtonGroup>
        </Paper>

        {deliveryType === DeliveryType.DELIVERY ? (
        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: `1px solid ${border}`,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
          }}
        >
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <LocationOnOutlined sx={{ color: alpha(theme.palette.primary.light, 0.95) }} />
            <Typography variant="overline" fontWeight={800} letterSpacing="0.14em" color="text.secondary">
              Delivery
            </Typography>
            <Box sx={{ flex: 1 }} />
            <Button
              size="small"
              variant="outlined"
              color="secondary"
              onClick={handleOpenAddressDrawer}
              sx={{ textTransform: "none", fontWeight: 700 }}
            >
              Manage addresses
            </Button>
          </Stack>
          {addressesLoading ? (
            <CircularProgress size={22} sx={{ color: alpha(theme.palette.primary.light, 0.8) }} />
          ) : checkoutAddress ? (
            <>
              <Typography fontWeight={800}>{checkoutAddress.label || "Address"}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
                {formatAddress(checkoutAddress)}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
                Change address from the header anytime.
              </Typography>
            </>
          ) : (
            <Stack spacing={1.25}>
              {locationSource === "gps" ? (
                <Stack spacing={1} alignItems="center" sx={{ textAlign: "center" }}>
                  <Typography variant="body2" fontWeight={800}>
                    Location detected
                  </Typography>
                  <Stack direction="row" alignItems="center" justifyContent="center" gap={1} flexWrap="wrap">
                    <Typography variant="body2" color="text.secondary">
                      GPS
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      •
                    </Typography>
                    <Typography variant="body2" fontWeight={800}>
                      {gpsCtx?.city || "Current location"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" gap={1} flexWrap="wrap" justifyContent="center" sx={{ mt: 0.5 }}>
                    <Button
                      size="small"
                      variant="contained"
                      color="secondary"
                      onClick={handleOpenAddressDrawerWithLocation}
                      sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                      Save address
                    </Button>
                    {/* <Button
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<ManageAccountsRounded fontSize="small" />}
                      onClick={handleOpenAddressDrawer}
                      sx={{ textTransform: "none", fontWeight: 800 }}
                    >
                      Manage addresses
                    </Button> */}
                  </Stack>
                </Stack>
              ) : (
                <Stack spacing={0.75}>
                  <Typography variant="body2" fontWeight={700}>
                    No delivery address
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Add or select an address to place a delivery order.
                  </Typography>
                  <Button
                    size="small"
                    variant="contained"
                    color="secondary"
                    onClick={handleOpenAddressDrawer}
                    sx={{ textTransform: "none", fontWeight: 800, alignSelf: "flex-start" }}
                  >
                    Manage addresses
                  </Button>
                </Stack>
              )}
            </Stack>
          )}
        </Paper>
        ) : (
          <Paper
            elevation={0}
            sx={{
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${border}`,
              bgcolor: alpha(theme.palette.background.paper, 0.85),
            }}
          >
            <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 1.5 }}>
              <StorefrontRounded sx={{ color: alpha(theme.palette.secondary.main, 0.95) }} />
              <Typography variant="overline" fontWeight={800} letterSpacing="0.14em" color="text.secondary">
                Pickup info
              </Typography>
            </Stack>
            <Typography fontWeight={800}>{restaurant.name}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, lineHeight: 1.5 }}>
              {restaurant.street}, {restaurant.postalCode} {restaurant.city}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.25 }}>
              You&apos;ll pick up this order from the restaurant location.
            </Typography>
          </Paper>
        )}

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: 3,
            border: `1px solid ${border}`,
            bgcolor: alpha(theme.palette.background.paper, 0.85),
          }}
        >
          <Stack direction="row" alignItems="center" gap={1} sx={{ mb: 2 }}>
            <ShoppingBagOutlined sx={{ color: alpha(theme.palette.primary.light, 0.95) }} />
            <Typography variant="overline" fontWeight={800} letterSpacing="0.14em" color="text.secondary">
              Your order
            </Typography>
          </Stack>
          {isOrderBootstrapping ? (
            <CircularProgress size={22} sx={{ color: alpha(theme.palette.primary.light, 0.8) }} />
          ) : (
            <Stack spacing={0} divider={<Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }} />}>
              {cartItems.map((item) => {
                const p = parseFloat(String(item.price)) || 0;
                const line = p * item.quantity;
                const extras = (item.customizedIngredients ?? [])
                  .map((l) => l?.ingredient?.name)
                  .filter((n): n is string => typeof n === "string" && n.length > 0);
                const note =
                  typeof item.comment === "string" && item.comment.trim().length > 0
                    ? item.comment.trim()
                    : typeof item.comments === "string" && item.comments.trim().length > 0
                      ? item.comments.trim()
                      : "";
                return (
                  <Stack
                    key={item.id}
                    direction="row"
                    spacing={1.5}
                    sx={{
                      py: 1.5,
                      cursor: "pointer",
                      borderRadius: 2,
                      px: 0.5,
                      mx: -0.5,
                      "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                    }}
                    alignItems="flex-start"
                    onClick={() => openCheckoutItemPreview(item)}
                  >
                    <Box
                      sx={{
                        width: 52,
                        height: 52,
                        borderRadius: 2,
                        overflow: "hidden",
                        flexShrink: 0,
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
                      }}
                    >
                      {item.imageUrl ? (
                        <Box
                          component="img"
                          src={item.imageUrl}
                          alt={item.name}
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
                            fontSize: "1.2rem",
                            fontWeight: 800,
                          }}
                        >
                          {item.name?.[0]?.toUpperCase() ?? "·"}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Typography fontWeight={800} sx={{ lineHeight: 1.35 }}>
                          {item.name}
                        </Typography>
                        <Typography fontWeight={800} sx={{ flexShrink: 0 }}>
                          {line.toFixed(2)}€
                        </Typography>
                      </Stack>
                      <Typography variant="caption" textAlign="left" color="text.secondary" sx={{ display: "block", mt: 0.25 }}>
                        {p.toFixed(2)}€ {item.quantity > 1 ? `× ${item.quantity}` : ""}
                      </Typography>
                      {extras.length > 0 && (
                        <Typography variant="caption" textAlign="left" color="text.secondary" sx={{ display: "block", mt: 0.35, lineHeight: 1.4 }}>
                          {extras.join(", ")}
                        </Typography>
                      )}
                      {note && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          textAlign="left"
                          sx={{ display: "block", mt: 0.25, fontStyle: "italic", lineHeight: 1.35 }}
                        >
                          Comment: {note}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                );
              })}
            </Stack>
          )}
          <Box
            sx={{
              mt: 2,
              pt: 2,
              borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
            }}
          >
            <Typography fontWeight={800}>Total</Typography>
            <Typography variant="h6" fontWeight={800} sx={{ color: alpha(theme.palette.primary.light, 1) }}>
              {subtotal.toFixed(2)}€
            </Typography>
          </Box>
        </Paper>

        <Button
          variant="contained"
          size="large"
          fullWidth
          disabled={
            submitting ||
            !orderId ||
            (deliveryType === DeliveryType.DELIVERY && !checkoutAddress) ||
            cartItems.length === 0
          }
          onClick={() => void handlePlaceOrder()}
          sx={{
            py: 1.5,
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 800,
            boxShadow: "none",
          }}
        >
          {submitting ? <CircularProgress size={24} color="inherit" /> : "Place order"}
        </Button>
      </Stack>
      <ItemPreviewModal
        open={Boolean(checkoutPreviewItem)}
        onClose={() => setCheckoutPreviewItem(null)}
        item={checkoutPreviewItem}
        orderingEnabled={false}
        checkoutPreview={true}
        onAddToOrder={() => {
          // checkout is read-only for item details
        }}
        browseOnlyMessage="Review your selected ingredients and notes."
        cartPrefill={
          checkoutPreviewItem
            ? {
                ingredientIds: (checkoutPreviewItem.ingredients ?? [])
                  .map((link: any) => link?.ingredient?.id)
                  .filter((id: unknown): id is string => typeof id === "string"),
                comments: checkoutPreviewItem.comments ?? "",
              }
            : null
        }
      />
    </Box>
  );
};

export default CheckoutPage;
