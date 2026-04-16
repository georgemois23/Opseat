import React, { useEffect } from 'react';
import { Box, Typography, Divider, Checkbox, FormControlLabel, Stack, Button, Tooltip, useTheme } from '@mui/material';
import { alpha } from '@mui/material/styles';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import dayjs, { Dayjs } from 'dayjs';
import { DayOfWeek } from '../types/dayOfWeek';
import { RestaurantSchedule } from '@/features/restaurants/types/RestaurantData';

interface Props {
  initialSchedules?: RestaurantSchedule[];
  onChange: (schedules: RestaurantSchedule[]) => void;
}

const toDayjs = (time: string): Dayjs | null => {
  if (!time) return null;
  return dayjs(`2024-01-01T${time}`);
};

/** `crypto.randomUUID` is missing in some browsers and on non-HTTPS origins. */
function newScheduleRowId(): string {
  const c = typeof globalThis !== 'undefined' ? (globalThis as { crypto?: Crypto }).crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    c.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `sched-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

const getDefaultSchedules = (): RestaurantSchedule[] => {
  return Object.keys(DayOfWeek)
    .filter((key) => isNaN(Number(key)))
    .map((key) => ({
      id: newScheduleRowId(),
      dayOfWeek: DayOfWeek[key as keyof typeof DayOfWeek],
      openTime: '09:00',
      closeTime: '22:00',
      isClosed: false,
      restaurant: {} as RestaurantSchedule['restaurant'],
    }));
};

const RestaurantScheduleForm = ({ initialSchedules, onChange }: Props) => {
  const theme = useTheme();
  const defaultSchedules = getDefaultSchedules();

  useEffect(() => {
    if (!initialSchedules || initialSchedules.length === 0) {
      onChange(defaultSchedules);
    }
  }, []);

  const schedules = initialSchedules && initialSchedules.length > 0 ? initialSchedules : defaultSchedules;

  const handleUpdate = (dayValue: DayOfWeek, field: keyof RestaurantSchedule, value: unknown) => {
    const updatedSchedules = schedules.map((item) => (item.dayOfWeek === dayValue ? { ...item, [field]: value } : item));
    onChange(updatedSchedules);
  };

  const applyToAll = () => {
    if (schedules.length === 0) return;

    const firstDay = schedules[0];
    const updatedSchedules = schedules.map((item) => ({
      ...item,
      openTime: firstDay.openTime,
      closeTime: firstDay.closeTime,
      isClosed: firstDay.isClosed,
    }));
    onChange(updatedSchedules);
  };

  const getDayName = (value: number) => {
    return DayOfWeek[value] || 'Unknown';
  };

  const outlineSlot = {
    textField: {
      size: 'small' as const,
      fullWidth: true,
      sx: {
        '& .MuiOutlinedInput-root': {
          borderRadius: 2,
          '& fieldset': { borderColor: alpha(theme.palette.primary.main, 0.14) },
        },
      },
    },
  };

  return (
    <Box
      sx={{
        mt: 1,
        p: { xs: 2, sm: 2.5 },
        border: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        backdropFilter: 'blur(8px)',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 800, letterSpacing: '-0.01em' }}>
          Operating hours
        </Typography>

        <Tooltip title="Copy first day to all other days">
          <Button
            variant="outlined"
            size="small"
            startIcon={<ContentCopyIcon sx={{ fontSize: 18 }} />}
            onClick={applyToAll}
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 700,
              borderColor: alpha(theme.palette.primary.main, 0.28),
            }}
          >
            Apply to all
          </Button>
        </Tooltip>
      </Box>

      <Divider sx={{ mb: 2.5, borderColor: alpha(theme.palette.primary.main, 0.08) }} />

      <Stack spacing={2.5}>
        {schedules.map((schedule) => (
          <Box
            key={schedule.dayOfWeek}
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'flex-start', sm: 'center' },
              gap: 2,
              opacity: schedule.isClosed ? 0.55 : 1,
              py: 1,
              borderBottom: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
              '&:last-of-type': { borderBottom: 'none', pb: 0 },
            }}
          >
            <Typography sx={{ width: { sm: 120 }, fontWeight: 700, textTransform: 'capitalize', color: 'text.secondary', fontSize: '0.9rem' }}>
              {getDayName(schedule.dayOfWeek).toLowerCase()}
            </Typography>

            <Box sx={{ display: 'flex', gap: 2, flexGrow: 1, width: '100%', flexWrap: 'wrap' }}>
              <TimePicker
                label="Open"
                value={toDayjs(schedule.openTime)}
                onChange={(newValue) =>
                  handleUpdate(schedule.dayOfWeek, 'openTime', newValue ? newValue.format('HH:mm') : '00:00')
                }
                ampm={false}
                disabled={schedule.isClosed}
                slotProps={outlineSlot}
              />

              <TimePicker
                label="Close"
                value={toDayjs(schedule.closeTime)}
                onChange={(newValue) =>
                  handleUpdate(schedule.dayOfWeek, 'closeTime', newValue ? newValue.format('HH:mm') : '00:00')
                }
                ampm={false}
                disabled={schedule.isClosed}
                slotProps={outlineSlot}
              />
            </Box>

            <FormControlLabel
              sx={{ minWidth: 100, ml: 0 }}
              control={
                <Checkbox
                  checked={schedule.isClosed}
                  onChange={(e) => handleUpdate(schedule.dayOfWeek, 'isClosed', e.target.checked)}
                  color="error"
                  size="small"
                />
              }
              label={<Typography variant="body2">Closed</Typography>}
            />
          </Box>
        ))}
      </Stack>
    </Box>
  );
};

export default RestaurantScheduleForm;
