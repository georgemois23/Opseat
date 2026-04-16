import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Stack,
  useTheme,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import AddRounded from '@mui/icons-material/AddRounded';
import api from '@/lib/axios';

export function CreateMenu({ restaurantId }: { restaurantId: string }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [menuDescription, setMenuDescription] = useState('');

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const outlineSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
      '&:hover fieldset': { borderColor: alpha(theme.palette.primary.main, 0.28) },
    },
  } as const;

  const handleSubmit = async () => {
    try {
      await api.post(`menu/${restaurantId}/create`, {
        name: menuName,
      });
    } catch (err) {
      console.error('Failed to create menu:', err);
    }

    setMenuName('');
    setMenuDescription('');
    handleClose();
  };

  return (
    <>
      <Button
        variant="contained"
        onClick={handleOpen}
        startIcon={<AddRounded />}
        sx={{
          borderRadius: 2,
          textTransform: 'none',
          fontWeight: 800,
          boxShadow: `0 6px 20px ${alpha(theme.palette.primary.main, 0.3)}`,
        }}
      >
        Create menu
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 0,
          sx: {
            borderRadius: 3,
            border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
            bgcolor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(12px)',
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2.5, px: 2.5 }}>
          <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'text.secondary' }}>
            New menu
          </Typography>
          <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" sx={{ mt: 0.5 }}>
            Create menu
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, pt: 1 }}>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label="Menu name"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              sx={outlineSx}
              placeholder="e.g. Lunch, Dinner, Drinks"
            />
            <TextField
              fullWidth
              label="Description (optional)"
              value={menuDescription}
              onChange={(e) => setMenuDescription(e.target.value)}
              multiline
              rows={3}
              sx={outlineSx}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 2.5, pb: 2.5, pt: 1, gap: 1 }}>
          <Button onClick={handleClose} sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!menuName.trim()}
            sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 800, px: 2.5 }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
