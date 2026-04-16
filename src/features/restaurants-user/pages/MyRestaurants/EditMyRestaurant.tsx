import React, { useCallback, useState } from 'react';
import axios from 'axios';
import {
  Box,
  TextField,
  Button,
  Stack,
  Typography,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  Drawer,
  IconButton,
  Divider,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import api from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import RestaurantScheduleForm from '../../../restaurants/pages/RestaurantScheduleForm';
import { Restaurant, RestaurantSchedule } from '@/features/restaurants/types/RestaurantData';
import { RestaurantCategoryForm } from '../../components/CategorySelect';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

interface MapboxFeature {
  place_name: string;
  center: number[];
  context?: { id: string; text: string }[];
  text: string;
  address?: string;
}

interface CreateRestaurantDrawerProps {
  open: boolean;
  onClose: () => void;
  restaurantData: Restaurant;
}

export default function EditMyRestaurant({ open, onClose, restaurantData }: CreateRestaurantDrawerProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: restaurantData.name || '',
    street: restaurantData.street || '',
    city: restaurantData.city || '',
    postalCode: restaurantData.postalCode || '',
    country: restaurantData.country || '',
    latitude: restaurantData.latitude || undefined,
    longitude: restaurantData.longitude || undefined,
    deliveryRadius: restaurantData.deliveryRadius || undefined,
    schedules: restaurantData.schedules || [],
    categories: restaurantData.categories || [],
    minimumOrderAmount: restaurantData.minimumOrderAmount || undefined,
  });

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MapboxFeature[]>([]);

  const outlineSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  const handleChange = (field: string, value: unknown) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleScheduleChange = useCallback((newSchedules: RestaurantSchedule[]) => {
    setForm((prev) => ({
      ...prev,
      schedules: newSchedules,
    }));
  }, []);

  const handleSearchAddress = async (searchQuery: string) => {
    if (!searchQuery) return setResults([]);

    try {
      const res = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`, {
        params: {
          access_token: MAPBOX_TOKEN,
          autocomplete: true,
          limit: 5,
        },
      });
      setResults(res.data.features);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectAddress = (feature: MapboxFeature) => {
    const [lng, lat] = feature.center;
    let city = '';
    let postalCode = '';
    let country = '';

    feature.context?.forEach((ctx) => {
      if (ctx.id.startsWith('postcode')) postalCode = ctx.text;
      if (ctx.id.startsWith('place')) city = ctx.text;
      if (ctx.id.startsWith('country')) country = ctx.text;
    });

    const fullStreet = feature.address ? `${feature.address} ${feature.text}` : feature.text;

    setForm((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      street: fullStreet || '',
      city: city,
      postalCode: postalCode,
      country: country,
    }));

    setQuery(feature.place_name);
    setResults([]);
  };

  const handleSubmit = async () => {
    try {
      await api.post(`/restaurants/my/${restaurantData.id}/update`, form, { withCredentials: true });
      onClose();
      navigate('/restaurant/my');
    } catch (error) {
      console.error('Failed to update restaurant', error);
    }
  };

  const formValidate =
    form.name &&
    form.street &&
    form.city &&
    form.postalCode &&
    form.country &&
    form.latitude !== undefined &&
    form.longitude !== undefined &&
    form.deliveryRadius !== undefined &&
    form.minimumOrderAmount !== undefined &&
    form.minimumOrderAmount > 0;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 560 },
          maxWidth: '100vw',
          borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.default, 0.98),
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <Box>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
            Venue settings
          </Typography>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
            Edit restaurant
          </Typography>
        </Box>
        <IconButton onClick={onClose} aria-label="Close" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.08) }} />

      <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
        <Stack spacing={2.5}>
          <TextField
            label="Restaurant name"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            fullWidth
            required
            sx={outlineSx}
          />

          <Box sx={{ position: 'relative' }}>
            <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
              Address
            </Typography>
            <TextField
              label="Search address"
              value={query}
              placeholder="Start typing…"
              onChange={(e) => {
                setQuery(e.target.value);
                handleSearchAddress(e.target.value);
              }}
              fullWidth
              sx={outlineSx}
            />
            {results.length > 0 && (
              <Paper
                elevation={0}
                sx={{
                  position: 'absolute',
                  zIndex: 10,
                  left: 0,
                  right: 0,
                  mt: 1,
                  borderRadius: 2,
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                  boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.12)}`,
                  maxHeight: 280,
                  overflow: 'auto',
                }}
              >
                <List dense disablePadding>
                  {results.map((r, i) => (
                    <ListItemButton key={i} onClick={() => handleSelectAddress(r)} sx={{ py: 1.25, alignItems: 'flex-start' }}>
                      <ListItemText primary={r.place_name} primaryTypographyProps={{ variant: 'body2', sx: { lineHeight: 1.45 } }} />
                    </ListItemButton>
                  ))}
                </List>
              </Paper>
            )}
          </Box>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Street" value={form.street} fullWidth onChange={(e) => handleChange('street', e.target.value)} sx={outlineSx} />
            <TextField label="City" value={form.city} fullWidth onChange={(e) => handleChange('city', e.target.value)} sx={outlineSx} />
          </Stack>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField label="Postal code" value={form.postalCode} fullWidth onChange={(e) => handleChange('postalCode', e.target.value)} sx={outlineSx} />
            <TextField label="Country" value={form.country} fullWidth onChange={(e) => handleChange('country', e.target.value)} sx={outlineSx} />
          </Stack>

          <RestaurantCategoryForm
            initialCategories={form.categories}
            onChange={(newCategories) => {
              setForm((prev) => ({
                ...prev,
                categories: newCategories,
              }));
            }}
          />

          <TextField
            label="Delivery radius (km)"
            type="text"
            value={form.deliveryRadius ?? ''}
            fullWidth
            onChange={(e) => handleChange('deliveryRadius', Number(e.target.value))}
            sx={outlineSx}
          />
          <TextField
            label="Minimum order amount"
            type="text"
            value={form.minimumOrderAmount ?? ''}
            fullWidth
            onChange={(e) => handleChange('minimumOrderAmount', Number(e.target.value))}
            sx={outlineSx}
          />

          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', display: 'block' }}>
            Business hours
          </Typography>
          <RestaurantScheduleForm initialSchedules={form.schedules} onChange={handleScheduleChange} />
        </Stack>
      </Box>

      <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.08) }} />
      <Box
        sx={{
          p: 2,
          flexShrink: 0,
          bgcolor: alpha(theme.palette.background.paper, 0.8),
          backdropFilter: 'blur(8px)',
        }}
      >
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={handleSubmit}
          disabled={!formValidate}
          sx={{
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            py: 1.35,
            '&.Mui-disabled': {
              opacity: 0.85,
            },
          }}
        >
          Save changes
        </Button>
      </Box>
    </Drawer>
  );
}
