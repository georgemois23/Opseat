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
  Container,
  useTheme,
  IconButton,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import ArrowBackRounded from '@mui/icons-material/ArrowBackRounded';
import api from '@/lib/axios';
import { useNavigate } from 'react-router-dom';
import RestaurantScheduleForm from './RestaurantScheduleForm';
import { RestaurantCategoryForm } from '@/features/restaurants-user/components/CategorySelect';
import { GreekRestaurantCategory, RestaurantSchedule } from '../types/RestaurantData';

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;

interface MapboxFeature {
  place_name: string;
  center: number[];
  context?: { id: string; text: string }[];
  text: string;
  address?: string;
}

export default function CreateRestaurant() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    street: '',
    city: '',
    postalCode: '',
    country: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    deliveryRadius: undefined as number | undefined,
    categories: [] as GreekRestaurantCategory[],
    schedules: [] as RestaurantSchedule[],
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

  const formValidate =
    form.name &&
    form.street &&
    form.city &&
    form.postalCode &&
    form.country &&
    form.latitude !== undefined &&
    form.longitude !== undefined &&
    form.deliveryRadius !== undefined &&
    form.categories.length > 0 &&
    form.schedules.length > 0;

  const handleSearchAddress = async (q: string) => {
    if (!q) return setResults([]);

    try {
      const res = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`, {
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
    if (!formValidate) return;
    try {
      await api.post(
        `/restaurants/create`,
        {
          name: form.name,
          street: form.street,
          city: form.city,
          postalCode: form.postalCode,
          country: form.country,
          latitude: form.latitude,
          longitude: form.longitude,
          deliveryRadius: form.deliveryRadius,
          categories: form.categories,
          schedules: form.schedules,
        },
        { withCredentials: true }
      );
    } catch (error) {
      console.error('Failed to create restaurant', error);
    }
    navigate('/restaurant/my');
  };

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 2, md: 4 }, pb: 8 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
        <IconButton
          onClick={() => navigate('/restaurant/my')}
          aria-label="Back"
          sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}` }}
        >
          <ArrowBackRounded />
        </IconButton>
        <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ letterSpacing: '0.06em' }}>
          New listing
        </Typography>
      </Stack>

      <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" sx={{ mb: 0.75 }}>
        Create restaurant
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.55 }}>
        Add your venue details, delivery radius, and hours. You can edit everything later.
      </Typography>

      <Stack spacing={2.5}>
        <TextField
          label="Restaurant name"
          value={form.name}
          onChange={(e) => handleChange('name', e.target.value)}
          fullWidth
          sx={outlineSx}
        />

        <Box sx={{ position: 'relative' }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', display: 'block', mb: 1 }}>
            Address
          </Typography>
          <TextField
            label="Search address"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearchAddress(e.target.value);
            }}
            fullWidth
            placeholder="Start typing…"
            sx={outlineSx}
          />

          {results.length > 0 && (
            <Paper
              elevation={0}
              sx={{
                mt: 1,
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                boxShadow: `0 12px 40px ${alpha(theme.palette.common.black, 0.1)}`,
                maxHeight: 280,
                overflow: 'auto',
              }}
            >
              <List dense disablePadding>
                {results.map((r, i) => (
                  <ListItemButton key={i} onClick={() => handleSelectAddress(r)} sx={{ py: 1.25 }}>
                    <ListItemText primary={r.place_name} primaryTypographyProps={{ variant: 'body2' }} />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          )}
        </Box>

        <TextField label="Street" value={form.street} onChange={(e) => handleChange('street', e.target.value)} fullWidth sx={outlineSx} />
        <TextField label="City" value={form.city} onChange={(e) => handleChange('city', e.target.value)} fullWidth sx={outlineSx} />
        <TextField label="Postal code" value={form.postalCode} onChange={(e) => handleChange('postalCode', e.target.value)} fullWidth sx={outlineSx} />
        <TextField label="Country" value={form.country} onChange={(e) => handleChange('country', e.target.value)} fullWidth sx={outlineSx} />

        <TextField
          label="Delivery radius (km)"
          value={form.deliveryRadius ?? ''}
          onChange={(e) => handleChange('deliveryRadius', Number(e.target.value))}
          fullWidth
          sx={outlineSx}
        />

        <RestaurantCategoryForm
          initialCategories={form.categories}
          onChange={(newCategories) => {
            setForm((prev) => ({
              ...prev,
              categories: newCategories,
            }));
          }}
        />

        <RestaurantScheduleForm onChange={handleScheduleChange} />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!formValidate}
          size="large"
          fullWidth
          sx={{
            mt: 2,
            borderRadius: 2.5,
            textTransform: 'none',
            fontWeight: 800,
            py: 1.35,
            boxShadow: `0 8px 28px ${alpha(theme.palette.primary.main, 0.35)}`,
            '&.Mui-disabled': { opacity: 0.85 },
          }}
        >
          Create restaurant
        </Button>
      </Stack>
    </Container>
  );
}
