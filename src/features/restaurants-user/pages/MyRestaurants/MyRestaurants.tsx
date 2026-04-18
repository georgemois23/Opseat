import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardActionArea,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRounded from '@mui/icons-material/AddRounded';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import StorefrontRounded from '@mui/icons-material/StorefrontRounded';
import api from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import type { Restaurant } from '@/features/restaurants/types/RestaurantData';
import { RestaurantActiveOrdersBadge } from '@/features/restaurants-user/components/RestaurantOrdersPanel';
import { useAuth } from '@/features/auth/hooks/useAuth';

const GRADIENTS = [
  ['#0D9488', '#14B8A6'],
  ['#C2410C', '#F97316'],
  ['#0369A1', '#0EA5E9'],
  ['#6D28D9', '#A78BFA'],
  ['#B45309', '#FBBF24'],
];

function hashGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

function normalizeMyRestaurantsList(raw: unknown): Restaurant[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((r): r is Restaurant => r != null && typeof r === 'object' && String((r as Restaurant).id ?? '') !== '');
}

function OwnerVenueCard({
  restaurant,
  onManage,
  onToggleDelivery,
}: {
  restaurant: Restaurant;
  onManage: () => void;
  onToggleDelivery: (e: React.MouseEvent) => void;
}) {
  const theme = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const [c0, c1] = hashGradient(restaurant.name);
  const open = restaurant.isDelivering;
  const cats = restaurant.categories?.slice(0, 3) ?? [];
  const img = restaurant.imageUrl?.trim();
  const showImage = Boolean(img) && !imgFailed;
  document.title = 'My Restaurants • OpsEat'

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
        bgcolor: alpha(theme.palette.background.paper, 0.65),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        backdropFilter: 'blur(10px)',
        transition: 'transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          borderColor: alpha(theme.palette.primary.main, 0.32),
          boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.08)}`,
        },
      }}
    >
      <CardActionArea onClick={onManage} sx={{ alignItems: 'stretch' }}>
        <Box
          sx={{
            height: 128,
            position: 'relative',
            display: 'flex',
            alignItems: 'flex-end',
            p: 1.5,
            background: showImage ? alpha('#000', 0.2) : `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)`,
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              inset: 0,
              zIndex: 0,
              background: showImage
                ? `linear-gradient(180deg, ${alpha('#000', 0.1)} 0%, ${alpha('#000', 0.72)} 100%)`
                : `linear-gradient(180deg, transparent 40%, ${alpha('#000', 0.55)} 100%)`,
            },
          }}
        >
          {showImage && (
            <Box
              component="img"
              src={img}
              alt=""
              onError={() => setImgFailed(true)}
              sx={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 0,
              }}
            />
          )}
          <Typography
            variant="h6"
            sx={{
              position: 'relative',
              zIndex: 1,
              pointerEvents: 'none',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: '#fff',
              textShadow: `0 1px 8px ${alpha('#000', 0.5)}`,
              lineHeight: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {restaurant.name}
          </Typography>
          <Chip
            size="small"
            label={open ? 'Accepting orders' : 'Paused'}
            sx={{
              position: 'absolute',
              top: 10,
              right: 10,
              zIndex: 2,
              fontWeight: 700,
              fontSize: '0.65rem',
              height: 24,
              bgcolor: open ? alpha(theme.palette.success.main, 0.95) : alpha('#000', 0.5),
              color: open ? theme.palette.success.contrastText : '#fff',
              border: open ? 'none' : `1px solid ${alpha('#fff', 0.2)}`,
            }}
          />
        </Box>
        <Stack spacing={1.25} sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.45 }}>
            {[restaurant.street, restaurant.postalCode, restaurant.city].filter(Boolean).join(' · ')}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {cats.map((c) => (
              <Chip
                key={c}
                label={String(c).replace(/_/g, ' ')}
                size="small"
                variant="outlined"
                sx={{
                  textTransform: 'capitalize',
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                  color: alpha(theme.palette.text.primary, 0.85),
                  fontSize: '0.7rem',
                  height: 22,
                }}
              />
            ))}
          </Stack>
          <RestaurantActiveOrdersBadge restaurantId={restaurant.id} />
        </Stack>
      </CardActionArea>
      <Stack
        direction="row"
        spacing={1}
        sx={{
          px: 2,
          pb: 2,
          pt: 0,
          flexWrap: 'wrap',
          gap: 1,
        }}
      >
        <Button
          size="small"
          variant="contained"
          onClick={(e) => {
            e.stopPropagation();
            onManage();
          }}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
        >
          Manage
        </Button>
        <Button
          size="small"
          variant="outlined"
          color={open ? 'warning' : 'success'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleDelivery(e);
          }}
          sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
        >
          {open ? 'Pause delivery' : 'Resume delivery'}
        </Button>
      </Stack>
    </Card>
  );
}

export const MyRestaurants: React.FC = () => {
  const theme = useTheme();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const isRestaurantUser = Boolean(user?.isRestaurantUser);

  const fetchRestaurants = async () => {
    try {
      const data = await api.get('/restaurants/my', { withCredentials: true });
      setRestaurants(normalizeMyRestaurantsList(data.data));
    } catch (error) {
      console.error('Failed to fetch restaurants:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  const handleToggleDelivery = async (id: string) => {
    try {
      await api.post(`/restaurants/my/${id}/open`, { withCredentials: true });
      fetchRestaurants();
    } catch (error) {
      console.error('Failed to toggle restaurant status:', error);
    }
  };

  /** Approved restaurant partners go straight to create; others apply first. */
  const handleCreateRestaurant = () => {
    if (isRestaurantUser) {
      navigate('/restaurant/create');
      return;
    }
    navigate('/partner/application');
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="min(70vh, 520px)"
        sx={{ width: '100%' }}
      >
        <CircularProgress size={36} thickness={4} sx={{ color: alpha(theme.palette.primary.main, 0.85) }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 }, pb: 6 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton
          onClick={() => navigate('/home')}
          aria-label="Back to home"
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.06em' }}>
          OpsEat for partners
        </Typography>
      </Stack>

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
            }}
          >
            Your restaurants
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75, maxWidth: 480, lineHeight: 1.55 }}>
            Manage menus, stock, and when you accept delivery orders.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddRounded />}
          onClick={handleCreateRestaurant}
          sx={{
            borderRadius: 2.5,
            py: 1.25,
            px: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            flexShrink: 0,
            boxShadow: `0 4px 14px ${alpha(theme.palette.primary.main, 0.15)}`,
          }}
        >
          {isRestaurantUser ? 'Add restaurant' : 'Apply to add a restaurant'}
        </Button>
      </Stack>

      {restaurants.length === 0 ? (
        <Box
          sx={{
            py: 6,
            px: 3,
            borderRadius: 3,
            textAlign: 'center',
            border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
            bgcolor: alpha(theme.palette.primary.main, 0.04),
          }}
        >
          <StorefrontRounded sx={{ fontSize: 48, color: alpha(theme.palette.primary.main, 0.45), mb: 1.5 }} />
          <Typography variant="h6" fontWeight={800} sx={{ mb: 1 }}>
            No venues yet
          </Typography>
          {isRestaurantUser ? (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 360, mx: 'auto', lineHeight: 1.55 }}>
                Create your first listing to start building menus and taking orders.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={handleCreateRestaurant}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Create restaurant
              </Button>
            </>
          ) : (
            <>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, maxWidth: 400, mx: 'auto', lineHeight: 1.55 }}>
                You need restaurant partner access before you can create a venue. Submit an application and we will
                review it.
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddRounded />}
                onClick={handleCreateRestaurant}
                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
              >
                Request restaurant partner access
              </Button>
            </>
          )}
        </Box>
      ) : (
        <Grid container spacing={2.5}>
          {restaurants
            .sort((a, b) => +b.isDelivering - +a.isDelivering)
            .map((restaurant) => (
              <Grid key={restaurant.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <OwnerVenueCard
                  restaurant={restaurant}
                  onManage={() => navigate(`/restaurant/my/${restaurant.id}`)}
                  onToggleDelivery={() => handleToggleDelivery(restaurant.id)}
                />
              </Grid>
            ))}
        </Grid>
      )}
    </Container>
  );
};

export default MyRestaurants;
