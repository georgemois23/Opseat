import React, { useMemo } from 'react';
import { Autocomplete, TextField, Typography, Box, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { GreekRestaurantCategory } from '@/features/restaurants/types/RestaurantData';

interface RestaurantCategoryFormProps {
  initialCategories: GreekRestaurantCategory[];
  onChange: (newCategories: GreekRestaurantCategory[]) => void;
}

const categoryOptions = Object.values(GreekRestaurantCategory).map((value) => ({
  label: value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' '),
  value,
}));

export const RestaurantCategoryForm: React.FC<RestaurantCategoryFormProps> = ({ initialCategories, onChange }) => {
  const theme = useTheme();

  const selectedOptions = useMemo(() => {
    return categoryOptions.filter((opt) => initialCategories.includes(opt.value));
  }, [initialCategories]);

  const outlineSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  return (
    <Box>
      <Typography variant="caption" sx={{ display: 'block', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'text.secondary', mb: 1 }}>
        Cuisine & type
      </Typography>
      <Autocomplete
        multiple
        options={categoryOptions}
        value={selectedOptions}
        filterSelectedOptions
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.value === value.value}
        onChange={(_, newValue) => {
          const valuesOnly = newValue.map((item) => item.value);
          onChange(valuesOnly);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Categories" placeholder="Search and select…" sx={outlineSx} />
        )}
        ChipProps={{
          sx: {
            borderRadius: 1.5,
            fontWeight: 600,
            fontSize: '0.75rem',
            borderColor: alpha(theme.palette.primary.main, 0.25),
          },
        }}
      />
    </Box>
  );
};
