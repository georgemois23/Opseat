import api from '@/lib/axios';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import {
  Box,
  Typography,
  Divider,
  CircularProgress,
  Button,
  Stack,
  FormControlLabel,
  Switch,
  Chip,
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useState, useEffect } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import EditMyRestaurant from './EditMyRestaurant';
import { Menu, Restaurant } from '@/features/restaurants/types/RestaurantData';
import { CreateMenu } from '../../components/CreateMenu';
import CategoryDrawer from '../../components/CreateCategory';
import MenuItemIngredientDrawer from '../../components/CreateMenuItemIngredient';
import CreateMenuItemDrawer from '../../components/CreateFullitemMenu';
import PantryManager from '../../components/IngredientsManagerDrawer';
import { RestaurantOrdersPanel } from '../../components/RestaurantOrdersPanel';

const MENU_GRADIENTS = [
  ['#0D9488', '#14B8A6'],
  ['#C2410C', '#F97316'],
  ['#0369A1', '#0EA5E9'],
];

function menuHeroGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return MENU_GRADIENTS[Math.abs(h) % MENU_GRADIENTS.length];
}

const MyRestaurantPreview = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [isCategoryDrawerOpen, setIsCategoryDrawerOpen] = useState(false);
  const [menuIdSelectedForCategory, setMenuIdSelectedForCategory] = useState<string | null>(null);
  const [menuItemIngredientDrawerOpen, setMenuItemIngredientDrawerOpen] = useState(false);
  const [categoryIdSelected, setCategoryIdSelected] = useState<string | null>(null);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [categorySelected, setCategorySelected] = useState<string>('');

  document.title = `${restaurant?.name ?? "Restaurant"} • My Restaurants • OpsEat`

  const [menu, setMenu] = useState<Menu[] | null>(null);

  const handleOpenDrawer = () => setIsDrawerOpen(true);
  const handleCloseDrawer = () => setIsDrawerOpen(false);

  const fetchRestaurant = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/restaurants/my/${id}`);
      setRestaurant(res.data);
    } catch (err) {
      console.error('Failed to fetch restaurant:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchRestaurant();
  }, [id]);

  const getRestaurantMenu = async () => {
    try {
      const res = await api.get(`/menu/${restaurant?.id}`);
      setMenu(res.data);
    } catch (err) {
      console.error('Failed to fetch restaurant menu:', err);
    }
  };

  useEffect(() => {
    if (restaurant) {
      getRestaurantMenu();
    }
  }, [restaurant]);

  const handleOpenRestaurant = async () => {
    try {
      await api.post(`/restaurants/my/${id}/open`);
      fetchRestaurant();
    } catch (err) {
      console.error('Failed to toggle restaurant status:', err);
    }
  };

  const handleToggleItemAvailability = async (itemId: string, currentStatus: boolean) => {
    try {
      await api.patch(`/menu/items/${itemId}/toggle`, { available: !currentStatus });
      getRestaurantMenu();
    } catch (err) {
      console.error('Failed to toggle item availability:', err);
      getRestaurantMenu();
    }
  };

  const handleCreateCategory = (data: any) => {
    try {
      void api.post(`menu/${restaurant?.id}/${menuIdSelectedForCategory}/create/category`, data);
    } catch (err) {
      console.error('Failed to create category:', err);
    }
  };

  const handleCreateItem = (data: any) => {
    try {
      void api.post(`menu/${restaurant?.id}/create/full-menu-item`, data);
      setIsCreateItemOpen(false);
    } catch (err) {
      console.error('Failed to create menu item:', err);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'min(70vh, 480px)',
        }}
      >
        <CircularProgress size={36} thickness={4} sx={{ color: alpha(theme.palette.primary.main, 0.85) }} />
      </Box>
    );
  }

  if (!restaurant) {
    return (
      <Box
        sx={{
          p: 3,
          maxWidth: 440,
          mx: 'auto',
          mt: 4,
          borderRadius: 3,
          border: `1px dashed ${alpha(theme.palette.error.main, 0.35)}`,
          bgcolor: alpha(theme.palette.error.main, 0.06),
          textAlign: 'center',
        }}
      >
        <Typography color="error.light" fontWeight={800}>
          Restaurant not found
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
          This link may be wrong or you no longer have access.
        </Typography>
        <Button variant="outlined" onClick={() => navigate('/restaurant/my')} sx={{ borderRadius: 2, textTransform: 'none' }}>
          Back to your restaurants
        </Button>
      </Box>
    );
  }

  const [h0, h1] = menuHeroGradient(restaurant.name);
  const heroImg = restaurant.imageUrl?.trim();
  const delivering = restaurant.isDelivering;

  const surface = {
    borderRadius: 3,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
    bgcolor: alpha(theme.palette.background.paper, 0.55),
    backdropFilter: 'blur(12px)',
  } as const;

  return (
    <Box sx={{ pb: 8, px: { xs: 2, sm: 2, md: 3 }, pt: { xs: 2, sm: 3 }, maxWidth: 920, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton
          onClick={() => navigate('/restaurant/my')}
          aria-label="Back to your restaurants"
          sx={{
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.5),
          }}
        >
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.06em' }}>
          Your venue
        </Typography>
      </Stack>

      <Box
        sx={{
          position: 'relative',
          borderRadius: 3,
          overflow: 'hidden',
          minHeight: { xs: 200, sm: 220 },
          mb: 2.5,
          border: `1px solid ${alpha(theme.palette.primary.main, delivering ? 0.2 : 0.12)}`,
          bgcolor: alpha(theme.palette.primary.main, delivering ? 0.06 : 0.04),
          background: heroImg ? undefined : `linear-gradient(135deg, ${h0}55 0%, ${h1}99 100%)`,
        }}
      >
        {heroImg ? (
          <Box
            component="img"
            src={heroImg}
            alt=""
            sx={{
              width: '100%',
              height: { xs: 200, sm: 220 },
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              height: { xs: 200, sm: 220 },
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
              ? `linear-gradient(180deg, ${alpha('#000', 0.05)} 0%, ${alpha('#000', 0.78)} 100%)`
              : `linear-gradient(180deg, transparent 0%, ${alpha('#000', 0.55)} 100%)`,
            pointerEvents: 'none',
          }}
        />
        <Box sx={{ position: 'absolute', left: 0, right: 0, bottom: 0, p: 2.5, pt: 5 }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" gap={1.5} flexWrap="wrap">
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h4"
                fontWeight={800}
                letterSpacing="-0.03em"
                sx={{ color: '#fff', textShadow: `0 2px 16px ${alpha('#000', 0.55)}`, lineHeight: 1.15 }}
              >
                {restaurant.name}
              </Typography>
              <Typography
                variant="body2"
                sx={{ mt: 1, color: alpha('#fff', 0.88), textShadow: `0 1px 8px ${alpha('#000', 0.45)}` }}
              >
                {restaurant.street}, {restaurant.postalCode} {restaurant.city}
              </Typography>
              <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap sx={{ mt: 1.25 }}>
                {restaurant.categories.map((cat) => (
                  <Chip
                    key={cat}
                    label={String(cat).replace(/_/g, ' ')}
                    size="small"
                    sx={{
                      textTransform: 'capitalize',
                      fontWeight: 600,
                      fontSize: '0.7rem',
                      height: 24,
                      bgcolor: alpha('#fff', 0.18),
                      color: '#fff',
                      border: `1px solid ${alpha('#fff', 0.28)}`,
                      backdropFilter: 'blur(6px)',
                    }}
                  />
                ))}
              </Stack>
            </Box>
            <Chip
              label={delivering ? 'Accepting orders' : 'Delivery paused'}
              sx={{
                fontWeight: 800,
                fontSize: '0.7rem',
                height: 30,
                bgcolor: delivering ? alpha(theme.palette.success.main, 0.95) : alpha('#000', 0.45),
                color: delivering ? theme.palette.success.contrastText : '#fff',
                border: `1px solid ${alpha('#fff', delivering ? 0.2 : 0.25)}`,
              }}
            />
          </Stack>
        </Box>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mb: 3 }}>
        <Button
          variant="contained"
          fullWidth
          sx={{
            borderRadius: 2.5,
            py: 1.35,
            textTransform: 'none',
            fontWeight: 800,
            boxShadow: delivering
              ? `0 4px 14px ${alpha(theme.palette.warning.main, 0.25)}`
              : `0 4px 14px ${alpha(theme.palette.success.main, 0.25)}`,
          }}
          color={delivering ? 'warning' : 'success'}
          onClick={handleOpenRestaurant}
        >
          {delivering ? 'Pause delivery' : 'Resume delivery'}
        </Button>
        <Button
          variant="outlined"
          fullWidth
          startIcon={<EditRounded />}
          onClick={handleOpenDrawer}
          sx={{
            borderRadius: 2.5,
            py: 1.35,
            textTransform: 'none',
            fontWeight: 700,
            borderColor: alpha(theme.palette.primary.main, 0.35),
          }}
        >
          Edit details
        </Button>
      </Stack>

      <Box sx={{ ...surface, p: 2.5, mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
            }}
          >
            Orders
          </Typography>
          <Button
            component={RouterLink}
            to={`/restaurant/my/${encodeURIComponent(restaurant.id)}/orders`}
            size="small"
            variant="outlined"
            color="secondary"
            sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2 }}
          >
            Open orders page
          </Button>
        </Stack>
        <RestaurantOrdersPanel restaurantId={restaurant.id} />
      </Box>

      <Box sx={{ ...surface, p: 2.5, mb: 3 }}>
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            fontWeight: 800,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: 'text.secondary',
            mb: 1.5,
          }}
        >
          Pantry & ingredients
        </Typography>
        <PantryManager restaurantId={restaurant.id} onDataChange={() => getRestaurantMenu()} />
      </Box>

      <Divider sx={{ my: 1, borderColor: alpha(theme.palette.primary.main, 0.1) }} />

      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 2.5, mt: 3 }}>
        <Box>
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              fontWeight: 800,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'text.secondary',
              mb: 0.5,
            }}
          >
            Menus
          </Typography>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            Menu management
          </Typography>
        </Box>
        <Box sx={{ '& .MuiButton-root': { borderRadius: 2, textTransform: 'none', fontWeight: 700 } }}>
          <CreateMenu restaurantId={restaurant.id} />
        </Box>
      </Stack>

      {menu && menu.length > 0 ? (
        <Stack spacing={2.5}>
          {menu.map((menuObj) => (
            <Box key={menuObj.id} sx={{ ...surface, p: { xs: 2, sm: 2.5 } }}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                alignItems={{ xs: 'flex-start', sm: 'center' }}
                justifyContent="space-between"
                spacing={1.5}
                sx={{ mb: 2 }}
              >
                <Typography variant="subtitle1" fontWeight={800} color="primary" sx={{ letterSpacing: '-0.01em' }}>
                  {menuObj.name}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => {
                    setMenuIdSelectedForCategory(menuObj.id);
                    setIsCategoryDrawerOpen(true);
                  }}
                  sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, flexShrink: 0, boxShadow: 'none' }}
                >
                  Add category
                </Button>
              </Stack>

              {menuObj.categories?.map((cat) => (
                <Box
                  key={cat.id}
                  sx={{
                    mt: 2.5,
                    pl: { xs: 1.5, sm: 2 },
                    borderLeft: `3px solid ${alpha(theme.palette.secondary.main, 0.45)}`,
                  }}
                >
                  <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} sx={{ mb: 1.25 }}>
                    <Typography fontWeight={800} sx={{ letterSpacing: '-0.01em' }}>
                      {cat.name}
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => {
                        setCategorySelected(cat.name);
                        setCategoryIdSelected(cat.id);
                        setIsCreateItemOpen(true);
                      }}
                      sx={{ textTransform: 'none', fontWeight: 700 }}
                    >
                      + Add item
                    </Button>
                  </Stack>

                  <Box sx={{ mt: 0.5 }}>
                    {cat.items && cat.items.length > 0 ? (
                      cat.items.map((menuItem, idx) => (
                        <Box
                          key={menuItem.id}
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: 2,
                            py: 1.75,
                            borderBottom:
                              idx < cat.items!.length - 1 ? `1px solid ${alpha(theme.palette.divider, 0.85)}` : 'none',
                            opacity: menuItem.isSoldOut ? 0.72 : 1,
                          }}
                        >
                          <Box sx={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                            <Typography variant="body1" fontWeight={700} sx={{ letterSpacing: '-0.01em' }}>
                              {menuItem.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                              €{Number(menuItem.price).toFixed(2)}
                            </Typography>

                            {menuItem.isSoldOut && menuItem.available && (
                              <Box sx={{ mt: 0.5, mb: 1 }}>
                                <Typography variant="caption" color="error" sx={{ display: 'block', fontWeight: 700 }}>
                                  Sold out — missing ingredients:
                                </Typography>
                                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.5 }}>
                                  {menuItem.ingredients
                                    ?.filter((link: { required?: boolean; ingredient?: { available?: boolean; id: string; name: string } }) => link.required && !link.ingredient?.available)
                                    .map(
                                      (link: { ingredient: { id: string; name: string } }) => (
                                        <Chip
                                          key={link.ingredient.id}
                                          label={link.ingredient.name}
                                          size="small"
                                          color="error"
                                          variant="outlined"
                                          sx={{
                                            height: 22,
                                            fontSize: '0.65rem',
                                            textTransform: 'uppercase',
                                            borderColor: 'error.light',
                                          }}
                                        />
                                      )
                                    )}
                                </Stack>
                              </Box>
                            )}

                            <FormControlLabel
                              control={
                                <Switch
                                  size="small"
                                  checked={menuItem.available}
                                  onChange={() => handleToggleItemAvailability(menuItem.id, menuItem.available)}
                                  color="success"
                                />
                              }
                              label={
                                <Typography variant="caption" color="text.secondary">
                                  {menuItem.available ? 'Visible on menu' : 'Hidden'}
                                </Typography>
                              }
                              sx={{ ml: 0, mt: 0.5, alignItems: 'center' }}
                            />
                          </Box>

                          {menuItem.imageUrl && (
                            <Box
                              component="img"
                              src={menuItem.imageUrl}
                              alt=""
                              sx={{
                                width: 64,
                                height: 64,
                                borderRadius: 2,
                                objectFit: 'cover',
                                flexShrink: 0,
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                              }}
                            />
                          )}
                        </Box>
                      ))
                    ) : (
                      <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                        No items in this category yet.
                      </Typography>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          ))}
        </Stack>
      ) : (
        <Box
          sx={{
            ...surface,
            py: 4,
            px: 2,
            textAlign: 'center',
          }}
        >
          <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.55, maxWidth: 360, mx: 'auto' }}>
            No menus yet. Use <strong>Create Menu</strong> above to add your first menu, then categories and dishes.
          </Typography>
        </Box>
      )}

      <EditMyRestaurant open={isDrawerOpen} onClose={handleCloseDrawer} restaurantData={restaurant} />
      <CategoryDrawer
        open={isCategoryDrawerOpen}
        onClose={() => setIsCategoryDrawerOpen(false)}
        menuId={menuIdSelectedForCategory ?? ''}
        restaurantId={restaurant.id}
        onSubmit={(data) => handleCreateCategory(data)}
      />
      <MenuItemIngredientDrawer
        open={menuItemIngredientDrawerOpen}
        onClose={() => {}}
        menuItemId=""
        onSubmit={() => {}}
        existingIngredients={[]}
      />
      <CreateMenuItemDrawer
        open={isCreateItemOpen}
        onClose={() => setIsCreateItemOpen(false)}
        categoryId={categoryIdSelected ?? ''}
        categoryName={categorySelected}
        existingIngredients={[]}
        onSubmit={(data) => handleCreateItem(data)}
        restaurantId={restaurant?.id}
      />
    </Box>
  );
};

export default MyRestaurantPreview;
