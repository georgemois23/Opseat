import api from '@/lib/axios';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import AddRounded from '@mui/icons-material/AddRounded';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Button,
  Chip,
  Stack,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  useMediaQuery,
  SwipeableDrawer,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Menu, MenuItem, Restaurant } from '../types/RestaurantData';
import type { RestaurantCartItem } from '../types/orderCart.types';
import ItemPreviewModal from '../components/PreviewItem';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlaceRoundedIcon from '@mui/icons-material/PlaceRounded';
import ScheduleRoundedIcon from '@mui/icons-material/ScheduleRounded';
import SidebarCart from '../components/SideBarCart';
import { DayOfWeek } from '../types/dayOfWeek';
import { useRestaurantOrderCart } from '../hooks/useRestaurantOrderCart';
import { useLocationContext } from "@/features/location/services/LocationContext";
import {
  buildNearbyParamsFromGps,
  readCachedGpsContext,
} from "@/features/location/services/locationRequestParams";

function findMenuItemInMenus(menus: Menu[] | null, menuItemId: string): MenuItem | undefined {
  if (!menus?.length) return undefined;
  for (const m of menus) {
    for (const cat of m.categories ?? []) {
      const hit = cat.items?.find((i) => i.id === menuItemId);
      if (hit) return hit;
    }
  }
  return undefined;
}

const MENU_GRADIENTS = [
  ['#0D9488', '#14B8A6'],
  ['#C2410C', '#F97316'],
  ['#0369A1', '#0EA5E9'],
];

function menuItemGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return MENU_GRADIENTS[Math.abs(h) % MENU_GRADIENTS.length];
}

/** Matches `Header`: Toolbar spacer xs 48 + mobile address row 40 */
const MOBILE_FIXED_HEADER_PX = 88;
/** Sticky category chip row (py + button) — keep in sync with strip styles */
const MOBILE_STICKY_CATEGORIES_PX = 52;
/** Desktop: Toolbar spacer md 72 + small gap */
const DESKTOP_SCROLL_OFFSET_PX = 80;

const CategorySection = ({
  cat,
  availableItems,
  soldOutItems,
  handleItemClick,
  orderingEnabled = true,
}: any) => {
  const [showSoldOut, setShowSoldOut] = React.useState(false);
  const theme = useTheme();

  return (
    <Box sx={{ mt: 2, ml: { xs: 0, md: 0 } }}>
      <Typography
        variant="overline"
        sx={{
          display: 'block',
          textAlign: 'left',
          fontWeight: 800,
          letterSpacing: '0.12em',
          px: { xs: 0, sm: 0 },
          py: 1,
          color: alpha(theme.palette.secondary.main, 0.95),
          borderBottom: `2px solid ${alpha(theme.palette.primary.main, 0.35)}`,
        }}
      >
        {cat.name}
      </Typography>

      <Box sx={{ mt: 1 }}>
        {availableItems.map((menuItem: any) => (
          <MenuItemRow
            key={menuItem.id}
            menuItem={menuItem}
            onClick={handleItemClick}
            orderingEnabled={orderingEnabled}
          />
        ))}

        {soldOutItems.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="text"
              color="inherit"
              size="small"
              startIcon={showSoldOut ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              onClick={() => setShowSoldOut(!showSoldOut)}
              sx={{
                textTransform: 'none',
                fontWeight: 700,
                color: alpha(theme.palette.text.secondary, 0.95),
                '&:hover': {
                  bgcolor: alpha(theme.palette.primary.main, 0.08),
                  color: alpha(theme.palette.primary.light, 1),
                },
              }}
            >
              {soldOutItems.length} unavailable {soldOutItems.length === 1 ? 'item' : 'items'}
            </Button>

            {showSoldOut && (
              <Box sx={{ mt: 1 }}>
                {soldOutItems.map((menuItem: any) => (
                  <MenuItemRow
                    key={menuItem.id}
                    menuItem={menuItem}
                    onClick={handleItemClick}
                    isSoldOut
                    orderingEnabled={orderingEnabled}
                  />
                ))}
              </Box>
            )}
          </Box>
        )}

        {availableItems.length === 0 && soldOutItems.length === 0 && (
          <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 2 }}>
            No items in this category yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
};

const MenuItemRow = ({ menuItem, onClick, isSoldOut, orderingEnabled = true }: any) => {
  const theme = useTheme();
  const [c0, c1] = menuItemGradient(menuItem.name || '');
  const hasImg = Boolean(menuItem.imageUrl?.trim());
  const browseOnly = !orderingEnabled;
  const canOpenDetail = !isSoldOut;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 2,
        py: 2.5,
        px: { xs: 1, sm: 1 },
        borderRadius: 2,
        opacity: isSoldOut ? 0.55 : browseOnly ? 0.92 : 1,
        filter: isSoldOut ? 'grayscale(0.85)' : browseOnly ? 'grayscale(0.15)' : 'none',
        transition: 'background-color 0.2s ease, opacity 0.2s ease, filter 0.2s ease',
        cursor: canOpenDetail ? 'pointer' : 'default',
        borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
        '&:hover':
          canOpenDetail
            ? { bgcolor: alpha(theme.palette.primary.main, browseOnly ? 0.04 : 0.06) }
            : {},
      }}
      onClick={() => canOpenDetail && onClick(menuItem)}
    >
      <Box sx={{ flex: 1, pr: 1, textAlign: 'left', minWidth: 0 }}>
        <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 0.5 }}>
          {menuItem.name}
        </Typography>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            lineHeight: 1.5,
          }}
        >
          {menuItem.description}
        </Typography>

        <Typography variant="body1" fontWeight={800} sx={{ color: alpha(theme.palette.primary.light, 1) }}>
          From €{Number(menuItem.price || 0).toFixed(2)}
        </Typography>
      </Box>

      <Box sx={{ position: 'relative', flexShrink: 0, width: { xs: 96, md: 112 }, height: { xs: 96, md: 112 } }}>
        <Box
          sx={{
            width: '100%',
            height: '100%',
            borderRadius: 2,
            overflow: 'hidden',
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.1),
            background: hasImg ? undefined : `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)`,
          }}
        >
          {hasImg ? (
            <Box
              component="img"
              src={menuItem.imageUrl}
              alt={menuItem.name}
              draggable={false}
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Box
              sx={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: alpha(theme.palette.common.white, 0.5),
                fontSize: '1.75rem',
                fontWeight: 800,
              }}
            >
              {(menuItem.name || '?')[0]}
            </Box>
          )}
        </Box>

        {!isSoldOut && orderingEnabled && (
          <Box
            sx={{
              position: 'absolute',
              bottom: -4,
              right: -4,
              bgcolor: alpha(theme.palette.secondary.main, 0.95),
              borderRadius: 2,
              boxShadow: `0 4px 14px ${alpha(theme.palette.common.black, 0.35)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 34,
              height: 34,
              border: `2px solid ${alpha(theme.palette.background.paper, 0.9)}`,
            }}
          >
            <AddRounded sx={{ fontSize: 22, color: theme.palette.secondary.contrastText }} />
          </Box>
        )}
        {!isSoldOut && browseOnly && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 4,
              right: 4,
              px: 0.75,
              py: 0.25,
              borderRadius: 1,
              bgcolor: alpha(theme.palette.common.black, 0.55),
              border: `1px solid ${alpha(theme.palette.common.white, 0.2)}`,
            }}
          >
            <Typography variant="caption" sx={{ color: alpha(theme.palette.common.white, 0.95), fontWeight: 700, fontSize: '0.65rem' }}>
              View
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

const RestaurantPreview = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { locationSource } = useLocationContext();
  const gpsCtx = readCachedGpsContext();
  const gpsParamsForRequest = useMemo(
    () => (locationSource === "gps" ? buildNearbyParamsFromGps(gpsCtx) : undefined),
    [locationSource, gpsCtx?.latitude, gpsCtx?.longitude]
  );
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [menu, setMenu] = useState<Menu[] | null>(null);
  const categoryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const stickyCategoryStripRef = useRef<HTMLDivElement | null>(null);
  const [errormessage, setErrorMessage] = useState<string | null>(null);

  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCartLineId, setEditingCartLineId] = useState<string | null>(null);
  const [cartModalPrefill, setCartModalPrefill] = useState<{
    ingredientIds: string[];
    comments: string;
  } | null>(null);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('lg')); 
  document.title = `${restaurant?.name ?? "Restaurant"} • OpsEat`;
  const [isCartOpen, setIsCartOpen] = useState(false);

  const outOfRange = Boolean(restaurant?.outOfRange);
  const acceptingOrders = Boolean(restaurant?.isDelivering) && !outOfRange;

  const {
    cartItems,
    subtotal,
    addToCart,
    replaceCartLine,
    updateLineQuantity,
    removeLine,
  } = useRestaurantOrderCart({
    restaurantId: restaurant?.id,
    acceptingOrders,
  });

  const handleCheckout = () => {
    if (!restaurant?.isDelivering || restaurant?.outOfRange || !slug) return;
    navigate(`/restaurant/${slug}/checkout`);
  };

  const allCategories = useMemo(() => {
    if (!menu) return [];
    return menu.flatMap((m) => m.categories || []);
  }, [menu]);

  const [stickyStripHeightPx, setStickyStripHeightPx] = useState(MOBILE_STICKY_CATEGORIES_PX);

  useLayoutEffect(() => {
    const el = stickyCategoryStripRef.current;
    if (!isMobile || !el) {
      setStickyStripHeightPx(MOBILE_STICKY_CATEGORIES_PX);
      return;
    }
    const apply = () => setStickyStripHeightPx(Math.ceil(el.getBoundingClientRect().height) || MOBILE_STICKY_CATEGORIES_PX);
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [isMobile, allCategories.length]);

  const scrollAnchorPx = isMobile
    ? MOBILE_FIXED_HEADER_PX + stickyStripHeightPx
    : DESKTOP_SCROLL_OFFSET_PX;

  const updateActiveCategoryFromScroll = useCallback(() => {
    if (!allCategories.length) return;

    const doc = document.documentElement;
    const scrollBottom = window.scrollY + window.innerHeight;
    const docHeight = doc.scrollHeight;
    if (scrollBottom >= docHeight - 32) {
      setActiveCategory(allCategories[allCategories.length - 1]?.id ?? null);
      return;
    }

    const line = scrollAnchorPx + 4;
    let current: string | null = null;
    for (const cat of allCategories) {
      const el = categoryRefs.current[cat.id];
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= line) {
        current = cat.id;
      }
    }
    setActiveCategory(current ?? allCategories[0]?.id ?? null);
  }, [allCategories, scrollAnchorPx]);

  useEffect(() => {
    if (!allCategories.length) return;

    const run = () => {
      requestAnimationFrame(() => updateActiveCategoryFromScroll());
    };

    run();
    const t = window.setTimeout(run, 100);
    const t2 = window.setTimeout(run, 450);
    window.addEventListener("scroll", run, { passive: true });
    window.addEventListener("resize", run);

    return () => {
      window.removeEventListener("scroll", run);
      window.removeEventListener("resize", run);
      window.clearTimeout(t);
      window.clearTimeout(t2);
    };
  }, [allCategories, updateActiveCategoryFromScroll]);

  const closeItemModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingCartLineId(null);
    setCartModalPrefill(null);
  }, []);

  const handleItemClick = (item: any) => {
    if (item.isSoldOut) return;
    setEditingCartLineId(null);
    setCartModalPrefill(null);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  const handleCartLineClick = useCallback(
    (line: RestaurantCartItem) => {
      const menuItemId = line.menuItemId ?? line.id;
      const base = findMenuItemInMenus(menu, menuItemId);
      const ingIds = (line.customizedIngredients ?? [])
        .map((l) => l?.ingredient?.id)
        .filter((id): id is string => typeof id === "string");
      if (base) {
        setSelectedItem(base);
        setCartModalPrefill({
          ingredientIds: ingIds.length ? ingIds : base.ingredients.map((l) => l.ingredient.id),
          comments:
            typeof line.comment === "string"
              ? line.comment
              : typeof line.comments === "string"
                ? line.comments
                : "",
        });
      } else {
        setSelectedItem({
          id: menuItemId,
          name: line.name,
          description: "",
          price: Number(line.price) || 0,
          imageUrl: line.imageUrl,
          available: true,
          isSoldOut: false,
          ingredients: [],
        });
        setCartModalPrefill({
          ingredientIds: ingIds,
          comments:
            typeof line.comment === "string"
              ? line.comment
              : typeof line.comments === "string"
                ? line.comments
                : "",
        });
      }
      setEditingCartLineId(line.id);
      setIsModalOpen(true);
    },
    [menu]
  );

  const scrollToCategory = useCallback(
    (categoryId: string) => {
      const target = categoryRefs.current[categoryId];
      if (!target) return;
      const top = target.getBoundingClientRect().top + window.scrollY - scrollAnchorPx;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
      window.setTimeout(() => setActiveCategory(categoryId), 350);
    },
    [scrollAnchorPx]
  );

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/restaurants/details/${slug}`, {
        params: gpsParamsForRequest,
      });
      setRestaurant(res.data);
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
      setErrorMessage((err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Failed to fetch restaurant");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) fetchRestaurant();
  }, [slug, gpsParamsForRequest]);

  useEffect(() => {
    if (!restaurant?.id) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get(`/menu/${restaurant.id}`);
        if (!cancelled) setMenu(res.data);
      } catch (err) {
        console.error('Failed to fetch restaurant menu:', err);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [restaurant?.id]);

  useEffect(() => {
    if (!acceptingOrders) setIsCartOpen(false);
  }, [acceptingOrders]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          p: 4,
        }}
      >
        <CircularProgress sx={{ color: alpha(theme.palette.primary.light, 0.9) }} />
        <Typography variant="body2" color="text.secondary">
          Loading menu…
        </Typography>
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box
        sx={{
          p: 4,
          maxWidth: 480,
          mx: 'auto',
          mt: 4,
          borderRadius: 2,
          border: `1px dashed ${alpha(theme.palette.error.main, 0.35)}`,
          bgcolor: alpha(theme.palette.error.main, 0.06),
          textAlign: 'center',
        }}
      >
        <Typography color="error.light" fontWeight={700}>
          Restaurant not found
        </Typography>
        
          
          {errormessage ? (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {errormessage}
            </Typography>
          ) :
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          This link may be outdated or the venue is no longer listed.
          </Typography>
          }
      </Box>
    );
  }

  const [h0, h1] = menuItemGradient(restaurant.name);
  const heroImg = restaurant.imageUrl?.trim();
  const mapsQuery = encodeURIComponent(`${restaurant.street}, ${restaurant.postalCode} ${restaurant.city}`);
  const dayLabel = (day: DayOfWeek) => {
    switch (day) {
      case DayOfWeek.SUNDAY:
        return 'sunday';
      case DayOfWeek.MONDAY:
        return 'monday';
      case DayOfWeek.TUESDAY:
        return 'tuesday';
      case DayOfWeek.WEDNESDAY:
        return 'wednesday';
      case DayOfWeek.THURSDAY:
        return 'thursday';
      case DayOfWeek.FRIDAY:
        return 'friday';
      case DayOfWeek.SATURDAY:
        return 'saturday';
      default:
        return 'unknown';
    }
  };

  const scheduleRows = (restaurant.schedules ?? [])
    .slice()
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((s) => ({
      id: s.id,
      day: dayLabel(s.dayOfWeek),
      isClosed: s.isClosed,
      hours: `${String(s.openTime || '').slice(0, 5)} - ${String(s.closeTime || '').slice(0, 5)}`,
    }));

  return (
    <Box sx={{ p: { xs: 0, sm: 2, md: 3 }, pb: 10, mb: { xs: 10, lg: 4 } }}>
      <Box sx={{ px: { xs: 2, sm: 2, md: 0 }, pt: { xs: 2, sm: 2 }, mb: 2 }}>
        <Box
          sx={{
            position: 'relative',
            borderRadius: 3,
            overflow: 'hidden',
            minHeight: { xs: 160, sm: 200 },
            border: `1px solid ${alpha(theme.palette.primary.main, acceptingOrders ? 0.2 : 0.12)}`,
            bgcolor: alpha(theme.palette.primary.main, acceptingOrders ? 0.08 : 0.05),
            background: heroImg ? undefined : `linear-gradient(135deg, ${h0}55 0%, ${h1}99 100%)`,
            opacity: acceptingOrders ? 1 : 0.92,
            filter: acceptingOrders ? 'none' : 'saturate(0.72)',
            transition: 'filter 0.25s ease, opacity 0.25s ease',
          }}
        >
          {heroImg ? (
            <Box
              component="img"
              src={heroImg}
              alt=""
              sx={{
                width: '100%',
                height: { xs: 180, sm: 220 },
                objectFit: 'cover',
                display: 'block',
              }}
            />
          ) : (
            <Box
              sx={{
                height: { xs: 180, sm: 220 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${h0} 0%, ${h1} 100%)`,
              }}
            >
              <RestaurantIcon sx={{ fontSize: 72, color: alpha(theme.palette.common.white, 0.35) }} />
            </Box>
          )}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background: heroImg
                ? `linear-gradient(180deg, ${alpha('#000', 0.05)} 0%, ${alpha('#000', 0.75)} 100%)`
                : `linear-gradient(180deg, transparent 0%, ${alpha('#000', 0.5)} 100%)`,
              pointerEvents: 'none',
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              p: 2,
              pt: 4,
            }}
          >
            <Stack direction="row" alignItems="center" justifyContent="space-between" gap={1} flexWrap="wrap">
              <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" sx={{ color: '#fff', textShadow: `0 2px 12px ${alpha('#000', 0.5)}` }}>
                {restaurant.name}
              </Typography>
              <Chip
                label={
                  outOfRange
                    ? 'Not delivering to your address'
                    : acceptingOrders
                      ? 'Delivering now'
                      : 'Not delivering'
                }
                size="small"
                sx={{
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  maxWidth: { xs: '100%', sm: 280 },
                  height: 'auto',
                  py: 0.5,
                  '& .MuiChip-label': { whiteSpace: 'normal', textAlign: 'center', lineHeight: 1.25 },
                  color:
                    outOfRange
                      ? theme.palette.warning.contrastText
                      : acceptingOrders
                        ? theme.palette.success.contrastText
                        : alpha(theme.palette.common.white, 0.95),
                  bgcolor: outOfRange
                    ? alpha(theme.palette.warning.main, 0.92)
                    : acceptingOrders
                      ? alpha(theme.palette.success.main, 0.95)
                      : alpha(theme.palette.error.main, 0.45),
                  border: `1px solid ${alpha(theme.palette.common.white, acceptingOrders ? 0.25 : 0.35)}`,
                  backdropFilter: 'blur(6px)',
                }}
              />
            </Stack>
            <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: alpha(theme.palette.common.white, 0.88),
                  cursor: 'pointer',
                  textShadow: `0 1px 8px ${alpha('#000', 0.45)}`,
                  lineHeight: 1.3,
                  '&:hover': { color: alpha(theme.palette.common.white, 0.98) },
                }}
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`,
                    '_blank'
                  )
                }
              >
                {restaurant.street}, {restaurant.postalCode} {restaurant.city}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsInfoOpen(true)}
                aria-label="Restaurant details"
                sx={{
                  color: alpha(theme.palette.common.white, 0.92),
                  '&:hover': { bgcolor: 'transparent' },
                }}
              >
                <InfoOutlinedIcon sx={{ fontSize: 16 }} />
              </IconButton>
            </Stack>
            {restaurant.minimumOrderAmount && (
              <Typography
                variant="body2"
                sx={{
                  display: 'block',
                  mt: 0.5,
                  color: alpha(theme.palette.common.white, 0.75),
                  textAlign: 'left',
                }}
              >
                Minimum: {restaurant.minimumOrderAmount}€
              </Typography>
            )}
            <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: alpha(theme.palette.common.white, 0.75), fontWeight: 700 }}>
              {restaurant.categories.map((cat) => cat.charAt(0).toUpperCase() + cat.slice(1)).join(' · ')}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Divider sx={{ my: 0, mb: 2, borderColor: alpha(theme.palette.primary.main, 0.12) }} />

      {outOfRange && (
        <Box sx={{ px: { xs: 2, sm: 2, md: 3 }, mb: 2 }}>
          <Box
            sx={{
              maxWidth: 380,
              mx: 'auto',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.primary.main, 0.04),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
              boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                mb: 0.75,
                opacity: 0.9,
              }}
            >
              Outside delivery area
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.8125rem' }}>
              This restaurant doesn&apos;t deliver to your saved address. You can still browse the menu — update your address in the header or
              choose another restaurant nearby.
            </Typography>
          </Box>
        </Box>
      )}

      {!acceptingOrders && !outOfRange && (
        <Box sx={{ px: { xs: 2, sm: 2, md: 3 }, mb: 2 }}>
          <Box
            sx={{
              maxWidth: 380,
              mx: 'auto',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              bgcolor: alpha(theme.palette.text.primary, 0.035),
              border: `1px solid ${alpha(theme.palette.divider, 0.65)}`,
              boxShadow: `0 1px 0 ${alpha(theme.palette.common.black, 0.04)}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                color: 'text.secondary',
                mb: 0.75,
                opacity: 0.9,
              }}
            >
              Orders unavailable
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55, fontSize: '0.8125rem' }}>
              This restaurant isn&apos;t accepting orders right now. You can still browse the menu — ordering will open again when delivery is
              turned back on.
            </Typography>
          </Box>
        </Box>
      )}

      {isMobile && allCategories.length > 0 && (
        <Box
          ref={stickyCategoryStripRef}
          data-opseat-menu-categories
          sx={{
            position: 'sticky',
            top: `${MOBILE_FIXED_HEADER_PX}px`,
            zIndex: (t) => t.zIndex.appBar - 1,
            display: { xs: 'block', lg: 'none' },
            width: '100vw',
            maxWidth: '100vw',
            ml: 'calc(50% - 50vw)',
            mr: 'calc(50% - 50vw)',
            boxSizing: 'border-box',
            mb: 2,
            py: 1.25,
            pl: { xs: 2, sm: 2, md: 0 },  
            overflowX: 'auto',
            overflowY: 'hidden',
            whiteSpace: 'nowrap',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'thin',
            scrollbarColor: `${alpha(theme.palette.primary.main, 0.45)} transparent`,
            borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
            bgcolor: alpha(theme.palette.background.default, 0.94),
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            '&::-webkit-scrollbar': { height: 4 },
            '&::-webkit-scrollbar-thumb': {
              borderRadius: 4,
              bgcolor: alpha(theme.palette.primary.main, 0.35),
            },
          }}
        >
          <Stack
            direction="row"
            spacing={1}
            alignItems="center"
            sx={{
              flexWrap: 'nowrap',
              width: 'max-content',
              minWidth: '100%',
              boxSizing: 'border-box',
            }}
          >
            {allCategories.map((cat) => {
              const isActive = activeCategory === cat.id;
              return (
                <Button
                  key={cat.id}
                  size="small"
                  variant={isActive ? 'contained' : 'outlined'}
                  color={isActive ? 'secondary' : 'inherit'}
                  onClick={() => scrollToCategory(cat.id)}
                  sx={{
                    flexShrink: 0,
                    borderRadius: 999,
                    textTransform: 'capitalize',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    letterSpacing: '0.02em',
                    px: 2,
                    py: 0.85,
                    minWidth: 'auto',
                    borderColor: alpha(theme.palette.common.white, 0.14),
                    color: isActive ? undefined : alpha(theme.palette.text.primary, 0.88),
                    bgcolor: isActive ? undefined : alpha(theme.palette.background.paper, 0.35),
                    boxShadow: 'none',
                    backdropFilter: 'blur(8px)',
                    '&:hover': {
                      borderColor: alpha(theme.palette.secondary.main, 0.45),
                      bgcolor: isActive ? undefined : alpha(theme.palette.background.paper, 0.55),
                    },
                  }}
                >
                  {cat.name}
                </Button>
              );
            })}
          </Stack>
        </Box>
      )}

      {/* 2. Menu Section with Sidebar Navigation */}
      {menu && menu.length > 0 && (
        <Box sx={{ 
        width: '100%', 
        maxWidth: '1400px',  
        mx: 'auto',      
        // px: { xs: 2, md: 4 } 
        px: { xs: 2, sm: 2, md: 4 }
      }}>
        <Stack direction="row" spacing={4} alignItems="flex-start" justifyContent={'center'} sx={{ mt: 2,}}>
          
          {/* LEFT PANEL: Category Navigation */}
         {!isMobile && <Box
            sx={{
              width: 168,
              position: 'sticky',
              top: 80,
              display: { xs: 'none', md: 'block' },
              maxHeight: '80vh',
              overflowY: 'auto',
              textAlign: 'left',
              pr: 1,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': {
                borderRadius: 3,
                bgcolor: alpha(theme.palette.primary.main, 0.35),
              },
            }}
          >
            <Typography
              variant="overline"
              sx={{
                display: 'block',
                mb: 1.5,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: alpha(theme.palette.secondary.main, 0.95),
              }}
            >
              Menu
            </Typography>
            <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 2, letterSpacing: '-0.02em' }}>
              Categories
            </Typography>
            <Stack spacing={0.5}>
              {allCategories.map((cat) => {
                const isActive = activeCategory === cat.id;

                return (
                  <Button
                    key={cat.id}
                    variant="text"
                    onClick={() => scrollToCategory(cat.id)}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      borderRadius: 2,
                      py: 1,
                      px: 1.25,
                      color: isActive ? alpha(theme.palette.primary.light, 1) : alpha(theme.palette.text.secondary, 0.9),
                      fontWeight: isActive ? 800 : 600,
                      bgcolor: isActive ? alpha(theme.palette.primary.main, 0.12) : 'transparent',
                      borderLeft: isActive ? `3px solid ${theme.palette.primary.main}` : '3px solid transparent',
                      transition: 'all 0.2s ease',
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.main, 0.08),
                      },
                    }}
                  >
                    {cat.name}
                  </Button>
                );
              })}
            </Stack>
          </Box>
        }

          {/* RIGHT PANEL: Menu Items */}
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
            {menu.map((menuObj) => (
              <Box
                key={menuObj.id}
                sx={{
                  mb: 4,
                  p: { xs: 2, sm: 3 },
                  width: '100%',
                  maxWidth: 800,
                  borderRadius: 3,
                  bgcolor: alpha(theme.palette.background.paper, 0.72),
                  backdropFilter: 'blur(12px)',
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  boxSizing: 'border-box',
                  boxShadow: 'none',
                }}
              >
                {menuObj.categories?.map((cat) => {
                  const availableItems = cat.items?.filter((i) => !i.isSoldOut) || [];
                  const soldOutItems = cat.items?.filter((i) => i.isSoldOut) || [];

                  return (
                    <Box
                      key={cat.id}
                      id={String(cat.id)}
                      ref={(el: HTMLDivElement | null) => {
                        categoryRefs.current[cat.id] = el;
                      }}
                      style={{ scrollMarginTop: `${scrollAnchorPx}px` }}
                      sx={{
                        minHeight: 'min(40vh, 320px)',
                        textAlign: 'left',
                      }}
                    >
                    <CategorySection
                        cat={cat}
                        availableItems={availableItems}
                        soldOutItems={soldOutItems}
                        handleItemClick={handleItemClick}
                        orderingEnabled={acceptingOrders}
                      />
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>
          {acceptingOrders && !isMobile && (
          <Box 
            sx={{ 
              display: { xs: 'none', lg: 'block' }, 
              width: 320,
              position: 'sticky', 
              top: 90,              
              alignSelf: 'flex-start' 
            }}
          >
            <SidebarCart 
              items={cartItems} 
              onUpdateQuantity={updateLineQuantity}
              onRemove={removeLine}
              onCheckout={handleCheckout}
              onLineClick={handleCartLineClick}
              displayTotal={subtotal}
              minimumOrderAmount={restaurant.minimumOrderAmount ?? 0}
            />
          </Box>
          )}
        </Stack>
        {acceptingOrders && (
        <SwipeableDrawer
          anchor="bottom"
          open={isCartOpen}
          onClose={() => setIsCartOpen(false)}
          onOpen={() => setIsCartOpen(true)}
          swipeAreaWidth={56}
          disableBackdropTransition={false}
          disableDiscovery
          PaperProps={{
            sx: {
              maxHeight: 'min(90dvh, 100dvh)',
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              bgcolor: 'background.paper',
              backgroundImage: 'none',
              overflow: 'hidden',
              border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderBottom: 'none',
              boxShadow: `0 -12px 40px ${alpha(theme.palette.common.black, 0.45)}`,
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', pt: 1.25, pb: 0.5, flexShrink: 0 }}>
            <Box
              sx={{
                width: 40,
                height: 4,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.text.secondary, 0.35),
              }}
            />
          </Box>
          <Box sx={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', px: 0, pb: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}>
            <SidebarCart
              items={cartItems}
              onUpdateQuantity={updateLineQuantity}
              onRemove={removeLine}
              onCheckout={handleCheckout}
              onLineClick={handleCartLineClick}
              displayTotal={subtotal}
              minimumOrderAmount={restaurant.minimumOrderAmount ?? 0}
              isMobile
            />
          </Box>
        </SwipeableDrawer>
        )}

      {/* MOBILE FLOATING BUTTON */}
      {acceptingOrders && isMobile && cartItems.length > 0 && (
        <Box
          sx={{
            position: 'fixed',
            bottom: 'calc(20px + env(safe-area-inset-bottom, 0px))',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'min(92%, 420px)',
            zIndex: 1000,
          }}
        >
          <Button
            fullWidth
            variant="contained"
            color="primary"
            size="large"
            onClick={() => setIsCartOpen(true)}
            sx={{
              borderRadius: 3,
              py: 1.75,
              px: 2.5,
              textTransform: 'none',
              fontWeight: 800,
              boxShadow: `0 12px 32px ${alpha(theme.palette.common.black, 0.35)}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <Box
              sx={{
                minWidth: 28,
                height: 28,
                px: 0.75,
                borderRadius: 1.5,
                fontWeight: 800,
                fontSize: '0.85rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: alpha(theme.palette.common.white, 0.22),
                color: theme.palette.primary.contrastText,
              }}
            >
              {cartItems.reduce((n, i) => n + i.quantity, 0)}
            </Box>
            <Typography fontWeight={800}>View basket</Typography>
            <Typography fontWeight={800}>€{subtotal.toFixed(2)}</Typography>
          </Button>
        </Box>
      )}
      </Box>
      )}

      {/* 3. Modal */}
      <ItemPreviewModal
        open={isModalOpen}
        onClose={closeItemModal}
        item={selectedItem}
        orderingEnabled={acceptingOrders}
        cartPrefill={cartModalPrefill}
        isEditingCartLine={Boolean(editingCartLineId)}
        browseOnlyMessage={
          outOfRange
            ? "This restaurant doesn't deliver to your saved address. You can browse the menu, or change your address in the header to order."
            : undefined
        }
        onAddToOrder={(newItem: any) => {
          if (!acceptingOrders) return;
          if (editingCartLineId) replaceCartLine(editingCartLineId, newItem);
          else addToCart(newItem);
        }}
      />

      <Dialog
        open={isInfoOpen}
        onClose={() => setIsInfoOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: {
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.94),
            backgroundImage: `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.08)} 0%, ${alpha(theme.palette.background.paper, 0.98)} 42%)`,
            backdropFilter: 'blur(10px)',
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, letterSpacing: '-0.02em', pb: 1 }}>
          {restaurant.name}
        </DialogTitle>
        <DialogContent sx={{ pt: 1, 
                '&::-webkit-scrollbar': {
                  width: '6px', // Thin and elegant
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'transparent', // Keeps it clean
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: alpha(theme.palette.text.secondary, 0.2), // Subtle color
                  borderRadius: '10px',
                  transition: 'background-color 0.2s ease',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.4), // Pops on hover
                  },
                },
                // Firefox support
                scrollbarWidth: 'thin',
                scrollbarColor: `${alpha(theme.palette.text.secondary, 0.2)} transparent`,
              
               }}>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="flex-start">
              <PlaceRoundedIcon sx={{ fontSize: 18, mt: 0.3, color: 'text.secondary' }} />
              <Typography
                variant="body2"
                sx={{ cursor: 'pointer' }}
                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${mapsQuery}`, '_blank')}
              >
                {restaurant.street}, {restaurant.postalCode} {restaurant.city}
              </Typography>
            </Stack>

            <Box
              sx={{
                borderRadius: 2,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                height: { xs: 180, sm: 220 },
              }}
            >
              <Box
                component="iframe"
                title={`${restaurant.name} map`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps?q=${mapsQuery}&z=15&output=embed`}
                sx={{ width: '100%', height: '100%', border: 0 }}
              />
            </Box>

            <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }} />

            <Stack direction="row" spacing={1} alignItems="center">
              <ScheduleRoundedIcon sx={{ fontSize: 18, color: 'text.secondary' }} />
              <Typography variant="subtitle2" fontWeight={800}>
                Weekly schedule
              </Typography>
            </Stack>

            {scheduleRows.length > 0 ? (
              <Stack spacing={0.8}>
                {scheduleRows.map((row) => (
                  <Stack
                    key={row.id}
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{
                      py: 0.7,
                      px: 1.1,
                      borderRadius: 1.5,
                      bgcolor: alpha(theme.palette.primary.main, 0.04),
                      border: `1px solid ${alpha(theme.palette.primary.main, 0.08)}`,
                    }}
                  >
                    <Typography variant="body2" sx={{ textTransform: 'capitalize', fontWeight: 600 }}>
                      {row.day}
                    </Typography>
                    <Typography variant="body2" color={row.isClosed ? 'text.disabled' : 'text.secondary'}>
                      {row.isClosed ? 'Closed' : row.hours}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">
                Schedule not provided.
              </Typography>
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default RestaurantPreview;