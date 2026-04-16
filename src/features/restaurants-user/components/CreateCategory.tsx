import React from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Stack,
  IconButton,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';

interface CategoryDrawerProps {
  open: boolean;
  onClose: () => void;
  restaurantId: string;
  menuId: string;
  onSubmit: (data: unknown) => void;
}

const CategoryDrawer: React.FC<CategoryDrawerProps> = ({ open, onClose, restaurantId: _restaurantId, menuId: _menuId, onSubmit }) => {
  const theme = useTheme();
  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      order: 0,
      active: true,
    },
  });

  const outlineSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  const handleFormSubmit = (data: unknown) => {
    onSubmit(data);
    reset();
    onClose();
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          maxWidth: '100%',
          borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.default, 0.98),
        },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }} role="presentation">
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Menu structure
            </Typography>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" sx={{ mt: 0.5 }}>
              New category
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            aria-label="Close"
            sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>

        <form onSubmit={handleSubmit(handleFormSubmit)} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <Stack spacing={2.5} sx={{ flex: 1 }}>
            <Controller
              name="name"
              control={control}
              rules={{ required: 'Category name is required' }}
              render={({ field, fieldState }) => (
                <TextField
                  {...field}
                  label="Category name"
                  fullWidth
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  placeholder="e.g. Burgers, Drinks"
                  sx={outlineSx}
                />
              )}
            />

            <Controller
              name="order"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Display order"
                  fullWidth
                  onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                  sx={outlineSx}
                />
              )}
            />

            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value} color="success" />}
                  label={<Typography variant="body2">Category visible on menu</Typography>}
                />
              )}
            />

            <Box sx={{ mt: 'auto', pt: 3 }}>
              <Button type="submit" variant="contained" fullWidth size="large" sx={{ borderRadius: 2.5, textTransform: 'none', fontWeight: 800, py: 1.35 }}>
                Create category
              </Button>
            </Box>
          </Stack>
        </form>
      </Box>
    </Drawer>
  );
};

export default CategoryDrawer;
