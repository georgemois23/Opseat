import { useLocationContext } from "@/features/location/services/LocationContext";
import {
  searchRestaurantsAndCuisines,
  SearchCuisineHit,
  SearchRestaurantHit,
} from "@/features/search/services/globalSearch.api";
import SearchIcon from "@mui/icons-material/Search";
import {
  alpha,
  Box,
  Chip,
  CircularProgress,
  ClickAwayListener,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

type Props = {
  isMobile: boolean;
};

function toTitle(value: string): string {
  const spaced = value.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function parseMinOrder(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

export default function GlobalHeaderSearch({ isMobile }: Props) {
  const theme = useTheme();
  const navigate = useNavigate();
  const { locationSource, effectiveCoords } = useLocationContext();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [restaurants, setRestaurants] = useState<SearchRestaurantHit[]>([]);
  const [cuisines, setCuisines] = useState<SearchCuisineHit[]>([]);

  const trimmed = q.trim();
  const canSearch = trimmed.length >= 2;

  useEffect(() => {
    let cancelled = false;
    if (!canSearch) {
      setRestaurants([]);
      setCuisines([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const result = await searchRestaurantsAndCuisines(
            trimmed,
            locationSource === "gps" ? effectiveCoords ?? undefined : undefined
          );
          if (!cancelled) {
            setRestaurants(result.restaurants.slice(0, 6));
            setCuisines(result.cuisines.slice(0, 6));
            setOpen(true);
          }
        } catch {
          if (!cancelled) {
            setRestaurants([]);
            setCuisines([]);
            setOpen(true);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 260);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [trimmed, canSearch, locationSource, effectiveCoords]);

  const hasResults = restaurants.length > 0 || cuisines.length > 0;
  const showDropdown = open && canSearch;

  const onRestaurantClick = (restaurant: SearchRestaurantHit) => {
    navigate(`/restaurant/${encodeURIComponent(restaurant.slug ?? restaurant.id)}`);
    setOpen(false);
  };

  const onCuisineClick = (cuisine: SearchCuisineHit) => {
    navigate(`/browse?c=${encodeURIComponent(cuisine.key)}`);
    setOpen(false);
  };

  const helperText = useMemo(() => {
    if (loading) return null;
    if (canSearch && !hasResults) return "No matches";
    return null;
  }, [loading, canSearch, hasResults]);

  return (
    <ClickAwayListener onClickAway={() => setOpen(false)}>
      <Box ref={containerRef} sx={{ position: "relative", width: "100%" }}>
        <TextField
          fullWidth
          placeholder={isMobile ? "Search…" : "Search restaurants and cuisines…"}
          size="small"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (canSearch) setOpen(true);
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start" sx={{ ml: isMobile ? 0.25 : 0 }}>
                <SearchIcon
                  sx={{
                    color: alpha(theme.palette.secondary.main, isMobile ? 0.75 : 0.9),
                    fontSize: isMobile ? "1.15rem" : "1.35rem",
                  }}
                />
              </InputAdornment>
            ),
            endAdornment: loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : undefined,
          }}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: 999,
              bgcolor: alpha(theme.palette.common.white, isMobile ? 0.06 : 0.08),
              color: theme.palette.text.primary,
              minHeight: isMobile ? 36 : undefined,
              py: isMobile ? 0.25 : undefined,
              transition: theme.transitions.create(["background-color", "box-shadow"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                bgcolor: alpha(theme.palette.common.white, isMobile ? 0.09 : 0.11),
              },
              "&.Mui-focused": {
                bgcolor: alpha(theme.palette.common.white, isMobile ? 0.1 : 0.12),
                boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.45)}`,
              },
              "& fieldset": {
                borderColor: alpha(theme.palette.common.white, isMobile ? 0.1 : 0.14),
              },
              "&:hover fieldset": {
                borderColor: alpha(theme.palette.primary.main, 0.35),
              },
              "&.Mui-focused fieldset": {
                borderColor: theme.palette.primary.main,
                borderWidth: 1,
              },
            },
            "& .MuiInputBase-input": {
              py: isMobile ? "6px" : undefined,
              fontSize: isMobile ? "0.8125rem" : undefined,
            },
            "& .MuiInputBase-input::placeholder": {
              color: alpha(theme.palette.text.secondary, 0.85),
              opacity: 1,
            },
          }}
        />

        {showDropdown && (
          <Paper
            elevation={8}
            sx={{
              position: "absolute",
              left: 0,
              right: 0,
              mt: 0.75,
              borderRadius: 2,
              border: `1px solid ${alpha(theme.palette.primary.main, 0.22)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.98),
              maxHeight: 420,
              overflowY: "auto",
              zIndex: 1400,
            }}
          >
            {restaurants.length > 0 && (
              <Box sx={{ px: 1, pt: 1 }}>
                <Typography variant="overline" color="text.secondary" sx={{ px: 1, fontWeight: 700 }}>
                  Restaurants
                </Typography>
                <List dense disablePadding>
                  {restaurants.map((restaurant) => {
                    const minOrder = parseMinOrder(restaurant.minimumOrderAmount);
                    return (
                      <ListItemButton
                        key={restaurant.id}
                        onClick={() => onRestaurantClick(restaurant)}
                        sx={{
                          borderRadius: 2,
                          mx: 0.5,
                          mb: 0.75,
                          border: `1px solid ${alpha(theme.palette.primary.main, 0.14)}`,
                          bgcolor: alpha(theme.palette.background.default, 0.3),
                          alignItems: "stretch",
                          p: 1,
                        }}
                      >
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 1.5,
                            overflow: "hidden",
                            mr: 1.2,
                            flexShrink: 0,
                            bgcolor: alpha(theme.palette.primary.main, 0.15),
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {restaurant.imageUrl ? (
                            <Box
                              component="img"
                              src={restaurant.imageUrl}
                              alt=""
                              sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          ) : (
                            <Typography variant="caption" fontWeight={800} color="text.secondary">
                              {restaurant.name.slice(0, 2).toUpperCase()}
                            </Typography>
                          )}
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <ListItemText
                            primary={restaurant.name}
                            secondary={restaurant.city ?? "Nearby"}
                            primaryTypographyProps={{ fontWeight: 700, noWrap: true }}
                            secondaryTypographyProps={{ noWrap: true }}
                          />
                          <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.5 }}>
                            {restaurant.categories.slice(0, 3).map((cat) => (
                              <Chip
                                key={`${restaurant.id}-${cat}`}
                                size="small"
                                label={toTitle(cat)}
                                variant="outlined"
                                sx={{ height: 20, fontSize: "0.68rem", textTransform: "capitalize" }}
                              />
                            ))}
                          </Box>
                          {minOrder != null && minOrder > 0 && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              Minimum order €{minOrder.toFixed(2)}
                            </Typography>
                          )}
                        </Box>
                      </ListItemButton>
                    );
                  })}
                </List>
              </Box>
            )}

            {cuisines.length > 0 && (
              <Box sx={{ px: 1, pb: 1, pt: restaurants.length ? 0.5 : 1 }}>
                <Typography variant="overline" color="text.secondary" sx={{ px: 1, fontWeight: 700 }}>
                  Cuisines
                </Typography>
                <List dense disablePadding>
                  {cuisines.map((cuisine) => (
                    <ListItemButton key={cuisine.key} onClick={() => onCuisineClick(cuisine)}>
                      <ListItemText primary={toTitle(cuisine.label || cuisine.key)} />
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            )}

            {!hasResults && helperText && (
              <Typography variant="body2" color="text.secondary" sx={{ px: 2, py: 1.5 }}>
                {helperText}
              </Typography>
            )}
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
}

