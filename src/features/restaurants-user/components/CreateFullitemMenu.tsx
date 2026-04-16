import React, { useEffect, useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  IconButton,
  MenuItem,
  Divider,
  Switch,
  FormControlLabel,
  InputAdornment,
  Autocomplete,
  createFilterOptions,
  Chip,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import api from '@/lib/axios';
import { IngredientCategory } from '../../restaurants/types/RestaurantData';

const filter = createFilterOptions<any>();

interface Props {
  open: boolean;
  onClose: () => void;
  categoryId: string;
  categoryName: string;
  existingIngredients: any[];
  onSubmit: (data: any) => void;
  restaurantId: string;
}

const CreateMenuItemDrawer: React.FC<Props> = ({
  open,
  onClose,
  categoryId,
  categoryName,
  existingIngredients,
  onSubmit,
  restaurantId,
}) => {
  const theme = useTheme();
  const [oldIngredients, setOldIngredients] = useState(existingIngredients);

  const { control, handleSubmit, reset, watch } = useForm({
    defaultValues: {
      categoryId: categoryId,
      name: '',
      description: '',
      imageUrl: '',
      price: 0,
      ingredients: [] as any[],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const imageUrlWatch = watch('imageUrl');
  const watchIngredients = watch('ingredients');

  const outlineSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  const fetchIngredients = async () => {
    try {
      const res = await api.get(`menu/${restaurantId}/ingredients`, { withCredentials: true });
      setOldIngredients(res.data);
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
    }
  };

  useEffect(() => {
    if (open) {
      fetchIngredients();
      reset({
        categoryId: categoryId,
        name: '',
        description: '',
        imageUrl: '',
        price: 0,
        ingredients: [],
      });
    }
  }, [open, categoryId]);

  const handleFormSubmit = (data: any) => {
    const formattedIngredients = data.ingredients.map((ing: any) => ({
      ingredientId: ing.value?.id || null,
      name: ing.value?.id ? null : ing.value?.name || ing.value,
      category: ing.value?.id ? null : ing.category,
      quantity: parseFloat(ing.quantity),
      required: ing.required,
      imageUrl: ing.value?.imageUrl || null,
    }));

    onSubmit({ ...data, categoryId: categoryId, ingredients: formattedIngredients });
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
          width: { xs: '100%', sm: 520 },
          maxWidth: '100%',
          borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.default, 0.98),
        },
      }}
    >
      <Box sx={{ p: { xs: 2, sm: 3 }, pb: 4, maxHeight: '100vh', overflow: 'auto' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box sx={{ minWidth: 0, pr: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
              Menu item
            </Typography>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" sx={{ mt: 0.5 }}>
              Add to “{categoryName}”
            </Typography>
          </Box>
          <IconButton onClick={onClose} aria-label="Close" sx={{ borderRadius: 2, border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}` }}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <form onSubmit={handleSubmit(handleFormSubmit)}>
          <Stack spacing={2.5}>
            <Controller
              name="name"
              control={control}
              render={({ field }) => <TextField {...field} label="Item name" fullWidth required sx={outlineSx} />}
            />

            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <TextField
                  {...field}
                  type="number"
                  label="Price"
                  fullWidth
                  sx={outlineSx}
                  onChange={(e) => field.onChange(e.target.value === '' ? 0 : Number(e.target.value))}
                  InputProps={{ startAdornment: <InputAdornment position="start">€</InputAdornment> }}
                />
              )}
            />

            <Controller
              name="description"
              control={control}
              render={({ field }) => <TextField {...field} label="Description" multiline rows={2} fullWidth sx={outlineSx} />}
            />

            <Stack spacing={1}>
              <Controller
                name="imageUrl"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Image URL"
                    fullWidth
                    placeholder="https://…"
                    helperText="Link to a food photo"
                    sx={outlineSx}
                  />
                )}
              />
              {imageUrlWatch && (
                <Box
                  component="img"
                  src={imageUrlWatch}
                  alt=""
                  sx={{
                    width: '100%',
                    height: 160,
                    objectFit: 'cover',
                    borderRadius: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                  }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
            </Stack>

            <Divider sx={{ borderColor: alpha(theme.palette.primary.main, 0.1) }}>
              <Typography variant="caption" fontWeight={800} color="text.secondary" sx={{ px: 1 }}>
                Recipe ingredients
              </Typography>
            </Divider>

            {fields.map((field, index) => {
              const selectedValue = watchIngredients[index]?.value;
              const isNewIngredient = selectedValue && !selectedValue.id;
              const isExistingIngredient = selectedValue && selectedValue.id;

              return (
                <Box
                  key={field.id}
                  sx={{
                    p: 2,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                    borderRadius: 2,
                    bgcolor: alpha(theme.palette.primary.main, 0.03),
                  }}
                >
                  <Stack spacing={2}>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Controller
                        name={`ingredients.${index}.value` as const}
                        control={control}
                        render={({ field: { onChange, value } }) => (
                          <Autocomplete
                            fullWidth
                            value={value}
                            onChange={(event, newValue) => {
                              if (newValue && newValue.isNew) {
                                onChange({ name: newValue.name, id: null });
                              } else {
                                onChange(newValue);
                              }
                            }}
                            filterOptions={(options, params) => {
                              const filtered = filter(options, params);
                              const { inputValue } = params;
                              if (inputValue !== '') {
                                filtered.unshift({
                                  isNew: true,
                                  name: inputValue,
                                  label: `+ Create new: “${inputValue}”`,
                                });
                              }
                              return filtered;
                            }}
                            options={oldIngredients}
                            getOptionLabel={(option) => {
                              if (typeof option === 'string') return option;
                              if (option.isNew) return option.name;
                              return option.id ? `${option.name} (${option.category})` : option.name;
                            }}
                            renderOption={(props, option) => (
                              <li {...props}>
                                <Stack direction="row" justifyContent="space-between" width="100%" alignItems="center">
                                  <Typography variant="body2" sx={{ color: option.isNew ? 'primary.main' : 'inherit' }}>
                                    {option.label || option.name}
                                  </Typography>
                                  {option.category && !option.isNew && (
                                    <Chip
                                      label={option.category}
                                      size="small"
                                      variant="outlined"
                                      sx={{ fontSize: '0.65rem', borderColor: alpha(theme.palette.primary.main, 0.3) }}
                                    />
                                  )}
                                </Stack>
                              </li>
                            )}
                            renderInput={(params) => <TextField {...params} label="Ingredient" size="small" sx={outlineSx} />}
                          />
                        )}
                      />
                      <IconButton color="error" onClick={() => remove(index)} sx={{ mt: 0.5 }} aria-label="Remove row">
                        <DeleteIcon />
                      </IconButton>
                    </Stack>

                    <Box sx={{ px: 0.5 }}>
                      {isExistingIngredient ? (
                        <Typography variant="caption" color="text.secondary">
                          Category: <strong>{selectedValue.category}</strong>
                        </Typography>
                      ) : isNewIngredient ? (
                        <Controller
                          name={`ingredients.${index}.category` as const}
                          control={control}
                          render={({ field }) => (
                            <TextField {...field} select label="New ingredient category" fullWidth size="small" required sx={{ ...outlineSx, mt: 0.5 }}>
                              {Object.values(IngredientCategory).map((cat) => (
                                <MenuItem key={cat} value={cat}>
                                  {cat}
                                </MenuItem>
                              ))}
                            </TextField>
                          )}
                        />
                      ) : null}
                    </Box>

                    <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                      <Controller
                        name={`ingredients.${index}.quantity` as const}
                        control={control}
                        render={({ field }) => (
                          <TextField {...field} label="Qty" type="number" size="small" sx={{ width: 100, ...outlineSx }} />
                        )}
                      />
                      <Controller
                        name={`ingredients.${index}.required` as const}
                        control={control}
                        render={({ field }) => (
                          <FormControlLabel
                            control={<Switch {...field} checked={field.value} size="small" color="success" />}
                            label={<Typography variant="body2">Required</Typography>}
                          />
                        )}
                      />
                    </Stack>
                  </Stack>
                </Box>
              );
            })}

            <Button
              startIcon={<AddIcon />}
              onClick={() => append({ value: null, quantity: 1, required: true, category: IngredientCategory.OTHER })}
              variant="outlined"
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, borderColor: alpha(theme.palette.primary.main, 0.3) }}
            >
              Add ingredient row
            </Button>

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              size="large"
              sx={{ mt: 2, borderRadius: 2.5, textTransform: 'none', fontWeight: 800, py: 1.35 }}
            >
              Create menu item
            </Button>
          </Stack>
        </form>
      </Box>
    </Drawer>
  );
};

export default CreateMenuItemDrawer;
