import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Grid,
  IconButton,
  Skeleton,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import { useNavigate, useSearchParams } from "react-router-dom";
import { GreekRestaurantCategory, Restaurant } from "@/features/restaurants/types/RestaurantData";
import {
  fetchNearbyRestaurantsByCategories,
} from "../lib/fetchRestaurantsByCategory";
import { RestaurantNearYouCard } from "../componentes/home/RestaurantNearYouCard";
import { BrowseCategoryStrip } from "../componentes/browse/BrowseCategoryStrip";
import { useLocationContext } from "@/features/location/services/LocationContext";

const VALID = new Set(
  Object.values(GreekRestaurantCategory).filter((v) => typeof v === "string") as string[]
);

function formatLabel(key: string) {
  const spaced = key.replace(/_/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function parseCategories(searchParams: URLSearchParams): string[] {
  const raw = searchParams.getAll("c");
  const out: string[] = [];
  const seen = new Set<string>();
  for (const r of raw) {
    const k = decodeURIComponent(r).toLowerCase();
    if (VALID.has(k) && !seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

export default function BrowsePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { locationSource, effectiveCoords } = useLocationContext();

  const selectedCats = useMemo(() => parseCategories(searchParams), [searchParams]);

  const categoryList = useMemo(
    () => Object.values(GreekRestaurantCategory).filter((v) => typeof v === "string") as string[],
    []
  );

  const [baseList, setBaseList] = useState<Restaurant[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(false);
    void (async () => {
      try {
        const data = await fetchNearbyRestaurantsByCategories({
          categories: selectedCats,
          gpsCoords: locationSource === "gps" ? effectiveCoords : undefined,
        });
        if (!cancelled) {
          setBaseList(data.sort((a, b) => +b.isDelivering - +a.isDelivering));
        }
      } catch {
        if (!cancelled) {
          setBaseList([]);
          setLoadError(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCats, locationSource, effectiveCoords]);

  const displayList = baseList;

  const toggleCategory = (cat: string) => {
    const key = cat.toLowerCase();
    const p = new URLSearchParams(searchParams);
    const current = p.getAll("c").map((x) => decodeURIComponent(x).toLowerCase());
    p.delete("c");
    const next = new Set(current);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    next.forEach((c) => p.append("c", c));
    setSearchParams(p, { replace: true });
  };

  const clearCategories = () => {
    const p = new URLSearchParams(searchParams);
    p.delete("c");
    setSearchParams(p, { replace: true });
  };

  const headline = useMemo(() => {
    if (selectedCats.length === 0) {
      return "Near you";
    }
    if (selectedCats.length === 1) {
      return formatLabel(selectedCats[0]);
    }
    return selectedCats.map(formatLabel).join(" · ");
  }, [selectedCats]);

  const subtitle = useMemo(() => {
    if (selectedCats.length === 0) {
      return "Restaurants around your delivery address. Add cuisines below to narrow the list.";
    }
    return "Showing nearby places tagged with any of your selected cuisines.";
  }, [selectedCats]);

  document.title = `OpsEat • ${headline}`;

  const openRestaurant = (r: Restaurant) => {
    navigate(`/restaurant/${r.slug ?? r.id}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        overflowX: "hidden",
        width: "100%",
      }}
    >
      <Container maxWidth="lg" sx={{ flex: 1, py: { xs: 2, md: 3 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
          <IconButton
            onClick={() => navigate("/home")}
            aria-label="Back to home"
            sx={{
              color: "text.primary",
              bgcolor: alpha(theme.palette.background.paper, 0.5),
              "&:hover": { bgcolor: alpha(theme.palette.background.paper, 0.75) },
            }}
          >
            <ArrowBackRounded />
          </IconButton>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: alpha(theme.palette.secondary.main, 0.95),
              }}
            >
              Browse
            </Typography>
            <Typography variant="h4" fontWeight={800} letterSpacing="-0.03em" sx={{ lineHeight: 1.2 }}>
              {headline}
            </Typography>
          </Box>
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            mb: 1,
            maxWidth: 640,
            mx: "auto",
            textAlign: "center",
            px: 1,
          }}
        >
          {subtitle}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ display: "block", mb: 3, textAlign: "center" }}
        >
          {displayList.length} place{displayList.length === 1 ? "" : "s"}
          {selectedCats.length > 0 ? " · filtered" : ""}
        </Typography>

        <BrowseCategoryStrip
          categories={categoryList}
          selected={selectedCats}
          onToggleCategory={toggleCategory}
          onClearCategories={clearCategories}
        />

        {loading ? (
          <Grid container spacing={2}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4 }}>
                <Skeleton variant="rounded" height={260} sx={{ borderRadius: 3 }} />
              </Grid>
            ))}
          </Grid>
        ) : loadError && baseList.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.25),
            }}
          >
            <Typography fontWeight={700} gutterBottom>
              Could not load restaurants
            </Typography>
            <Button variant="outlined" onClick={() => window.location.reload()} sx={{ mr: 1 }}>
              Retry
            </Button>
            <Button variant="contained" color="secondary" onClick={() => navigate("/home")}>
              Home
            </Button>
          </Box>
        ) : displayList.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
              borderRadius: 3,
              border: `1px dashed ${alpha(theme.palette.primary.main, 0.25)}`,
              bgcolor: alpha(theme.palette.background.paper, 0.25),
            }}
          >
            <Typography fontWeight={700} gutterBottom>
              No matches
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {selectedCats.length > 0
                ? "Try removing a cuisine — there may be no nearby spots with that tag."
                : "Nothing nearby yet."}
            </Typography>
            <Button variant="contained" color="secondary" onClick={() => navigate("/home")}>
              Back to home
            </Button>
          </Box>
        ) : (
          <Grid container spacing={2}>
            {displayList.map((restaurant) => (
              <Grid key={restaurant.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <RestaurantNearYouCard
                  layout="grid"
                  restaurant={restaurant}
                  onSelect={() => openRestaurant(restaurant)}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Container>
    </Box>
  );
}
