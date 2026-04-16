import React, { useState } from 'react';
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
  MenuItem,
  Divider,
  ToggleButton,
  ToggleButtonGroup,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import { useForm, Controller } from 'react-hook-form';

const INGREDIENT_CATEGORIES = [
  'sauce',
  'meat',
  'cheese',
  'vegetable',
  'bread',
  'drink_base',
  'coffee',
  'spice',
  'other',
];

interface Props {
  open: boolean;
  onClose: () => void;
  menuItemId: string;
  existingIngredients: unknown[];
  onSubmit: (data: unknown) => void;
}

const MenuItemIngredientDrawer: React.FC<Props> = ({ open, onClose, menuItemId, existingIngredients, onSubmit }) => {
  const theme = useTheme();
  const [mode, setMode] = useState<'select' | 'new'>('select');

  const { control, handleSubmit, reset } = useForm({
    defaultValues: {
      menuItemId: menuItemId,
      ingredientId: '',
      newIngredientName: '',
      newIngredientCategory: 'other',
      quantity: 1,
      required: true,
    },
  });

  const outlineSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  const handleFormSubmit = (data: Record<string, unknown>) => {
    const payload = {
      ...data,
      ingredientId: mode === 'select' ? data.ingredientId : null,
      newIngredientName: mode === 'new' ? data.newIngredientName : null,
      newIngredientCategory: mode === 'new' ? data.newIngredientCategory : null,
    };
    onSubmit(payload);
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
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Recipe
            </Typography>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" sx={{ mt: 0.5 }}>
              Add ingredient
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={2.5}>
            <ToggleButtonGroup
              value={mode}
              exclusive
              onChange={(_, next) => next && setMode(next)}
              fullWidth
              size="small"
              sx={{
                p: 0.5,
                borderRadius: 2,
                bgcolor: alpha(theme.palette.primary.main, 0.06),
                border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                '& .MuiToggleButton-root': {
                  border: 'none',
                  borderRadius: 1.5,
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                },
                '& .Mui-selected': {
                  bgcolor: 'background.paper',
                  boxShadow: `0 1px 4px ${alpha(theme.palette.common.black, 0.08)}`,
                },
              }}
            >
              <ToggleButton value="select">From pantry</ToggleButton>
              <ToggleButton value="new">New ingredient</ToggleButton>
            </ToggleButtonGroup>

            {mode === 'select' ? (
              <Controller
                name="ingredientId"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Ingredient" fullWidth sx={outlineSx}>
                    {(existingIngredients as { id: string; name: string; category?: string }[]).map((ing) => (
                      <MenuItem key={ing.id} value={ing.id}>
                        {ing.name}
                        {ing.category ? ` (${ing.category})` : ''}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            ) : (
              <>
                <Controller
                  name="newIngredientName"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Name" fullWidth placeholder="e.g. Truffle oil" sx={outlineSx} />
                  )}
                />
                <Controller
                  name="newIngredientCategory"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Category" fullWidth sx={outlineSx}>
                      {INGREDIENT_CATEGORIES.map((cat) => (
                        <MenuItem key={cat} value={cat}>
                          {cat.replace(/_/g, ' ')}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              </>
            )}

            <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.08) }} />

            <Typography variant="caption" fontWeight={800} letterSpacing="0.08em" textTransform="uppercase" color="text.secondary">
              Amount & rules
            </Typography>

            <Controller
              name="quantity"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Quantity"
                  fullWidth
                  sx={outlineSx}
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
              )}
            />

            <Controller
              name="required"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch {...field} checked={field.value as boolean} color="success" />}
                  label={<Typography variant="body2">Required for this dish</Typography>}
                />
              )}
            />

            <Button type="submit" variant="contained" fullWidth size="large" sx={{ mt: 1, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, py: 1.35 }}>
              Add to item
            </Button>
          </Stack>
        </form>
      </Box>
    </Drawer>
  );
};

export default MenuItemIngredientDrawer;
