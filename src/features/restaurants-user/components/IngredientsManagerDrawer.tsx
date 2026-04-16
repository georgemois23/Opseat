import React, { useState, useEffect, useMemo } from 'react';
import {
  Drawer,
  Box,
  Typography,
  Stack,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Switch,
  Chip,
  Divider,
  TextField,
  InputAdornment,
  Button,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import DeleteIcon from '@mui/icons-material/Delete';
import KitchenIcon from '@mui/icons-material/Kitchen';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import api from '@/lib/axios';

interface Ingredient {
  id: string;
  name: string;
  category: string;
  available: boolean;
}

interface Props {
  restaurantId: string;
  onDataChange?: () => void;
}

const PantryManager: React.FC<Props> = ({ restaurantId, onDataChange }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const activeCount = ingredients.filter((ing) => ing.available).length;
  const inActiveCount = ingredients.length - activeCount;

  const fetchIngredients = async () => {
    setLoading(true);
    try {
      const res = await api.get(`menu/${restaurantId}/ingredients`);
      setIngredients(res.data);
    } catch (err) {
      console.error('Failed to fetch ingredients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) fetchIngredients();
  }, [open, restaurantId]);

  const groupedIngredients = useMemo(() => {
    const filtered = ingredients.filter((ing) => ing.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return filtered.reduce(
      (acc, ing) => {
        const cat = ing.category || 'Uncategorized';
        if (!acc[cat]) acc[cat] = [];
        acc[cat].push(ing);
        return acc;
      },
      {} as Record<string, Ingredient[]>
    );
  }, [ingredients, searchTerm]);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      setIngredients((prev) => prev.map((ing) => (ing.id === id ? { ...ing, available: !currentStatus } : ing)));
      await api.patch(`menu/ingredients/${id}/toggle`, { available: !currentStatus });
      if (onDataChange) onDataChange();
    } catch (err) {
      fetchIngredients();
      console.error('Toggle failed', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this ingredient from the global pantry?')) return;
    try {
      await api.delete(`menu/ingredients/${id}`);
      setIngredients((prev) => prev.filter((ing) => ing.id !== id));
      if (onDataChange) onDataChange();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const outlineInputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      bgcolor: alpha(theme.palette.background.paper, 0.6),
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<KitchenIcon />}
        onClick={() => setOpen(true)}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 700,
          borderColor: alpha(theme.palette.primary.main, 0.3),
        }}
      >
        Manage pantry
      </Button>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: {
            width: { xs: '100%', sm: 440 },
            maxWidth: '100%',
            borderLeft: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            bgcolor: alpha(theme.palette.background.default, 0.98),
          },
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, height: '100%', display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box sx={{ minWidth: 0, pr: 1 }}>
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
                Inventory
              </Typography>
              <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: '-0.02em', mt: 0.5 }}>
                Restaurant pantry
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, lineHeight: 1.5 }}>
                <strong>{activeCount}</strong> in stock · <strong>{inActiveCount}</strong> unavailable · {ingredients.length} total
              </Typography>
            </Box>
            <IconButton
              onClick={() => setOpen(false)}
              aria-label="Close"
              sx={{
                borderRadius: 2,
                border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
                flexShrink: 0,
              }}
            >
              <CloseIcon />
            </IconButton>
          </Stack>

          <TextField
            fullWidth
            size="small"
            placeholder="Filter by name…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ mb: 2, ...outlineInputSx }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                </InputAdornment>
              ),
            }}
          />

          <Divider sx={{ mb: 2, borderColor: alpha(theme.palette.primary.main, 0.08) }} />

          {loading ? (
            <Stack alignItems="center" py={6}>
              <CircularProgress size={32} thickness={4} sx={{ color: alpha(theme.palette.primary.main, 0.85) }} />
            </Stack>
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto', pb: 2 }}>
              {Object.entries(groupedIngredients).length > 0 ? (
                Object.entries(groupedIngredients)
                  .sort()
                  .map(([category, items]) => (
                    <Accordion
                      key={category}
                      disableGutters
                      elevation={0}
                      defaultExpanded={searchTerm.length > 0}
                      sx={{
                        '&:before': { display: 'none' },
                        borderBottom: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
                        bgcolor: 'transparent',
                      }}
                    >
                      <AccordionSummary
                        expandIcon={<ExpandMoreIcon sx={{ color: 'text.secondary' }} />}
                        sx={{
                          px: 0,
                          minHeight: 48,
                          '& .MuiAccordionSummary-content': { my: 1 },
                        }}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography sx={{ fontWeight: 800, textTransform: 'capitalize', letterSpacing: '-0.01em' }}>
                            {category}
                          </Typography>
                          <Chip
                            label={items.length}
                            size="small"
                            variant="outlined"
                            sx={{
                              height: 22,
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              borderColor: alpha(theme.palette.primary.main, 0.25),
                            }}
                          />
                        </Stack>
                      </AccordionSummary>

                      <AccordionDetails sx={{ p: 0, pt: 0 }}>
                        <List sx={{ pt: 0 }}>
                          {items.map((ing) => (
                            <ListItem
                              key={ing.id}
                              sx={{
                                borderRadius: 2,
                                mb: 0.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.03),
                                border: `1px solid ${alpha(theme.palette.primary.main, 0.06)}`,
                              }}
                              secondaryAction={
                                <Stack direction="row" spacing={0.5} alignItems="center">
                                  <Switch
                                    edge="end"
                                    checked={ing.available}
                                    onChange={() => handleToggle(ing.id, ing.available)}
                                    color="success"
                                    size="small"
                                  />
                                  <IconButton edge="end" color="error" size="small" onClick={() => handleDelete(ing.id)} aria-label="Delete">
                                    <DeleteIcon fontSize="small" />
                                  </IconButton>
                                </Stack>
                              }
                            >
                              <ListItemText
                                primary={ing.name}
                                primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </AccordionDetails>
                    </Accordion>
                  ))
              ) : (
                <Typography sx={{ py: 8, textAlign: 'center' }} color="text.disabled" variant="body2">
                  No matching ingredients.
                </Typography>
              )}
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default PantryManager;
