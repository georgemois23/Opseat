import React, { useMemo } from "react";
import {
  Box,
  Button,
  Container,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import SearchRounded from "@mui/icons-material/SearchRounded";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useRestaurants } from "@/features/restaurants/services/RestaurantContext";
import { GreekRestaurantCategory, Restaurant } from "@/features/restaurants/types/RestaurantData";
import { CategoryCarousel } from "../componentes/home/CategoryCarousel";
import { ActiveOrdersHomeSection } from "../componentes/home/ActiveOrdersHomeSection";
import { HomeHero } from "../componentes/home/HomeHero";
import { RestaurantNearYouRow } from "../componentes/home/RestaurantNearYouRow";

const ClientHome = () => {
  const { user } = useAuth();
  const { restaurants } = useRestaurants();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  document.title = "OpsEat • Home";

  const searchQuery = useMemo(
    () => (location.state as { query?: string })?.query ?? "",
    [location.state]
  );

  const categoryList = useMemo(
    () =>
      Object.values(GreekRestaurantCategory).filter((v) => typeof v === "string") as string[],
    []
  );

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    navigate(location.pathname, {
      state: { ...location.state, query: e.target.value },
      replace: true,
    });
  };

  const nearbyPreview = useMemo(() => {
    let list = [...restaurants];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(q));
    }
    return list.sort((a, b) => +b.isDelivering - +a.isDelivering);
  }, [searchQuery, restaurants]);

  const openRestaurant = (r: Restaurant) => {
    navigate(`/restaurant/${r.slug ?? r.id}`);
  };

  const goBrowseCategory = (cat: string) => {
    navigate(`/browse?c=${encodeURIComponent(cat)}`);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        // pb: 2,
        overflowX: "hidden",
        width: "100%",
      }}
    >
      <Container maxWidth="lg" sx={{ flexGrow: 1, py: { xs: 2, md: 3 }, overflowX: "hidden" }}>
        <HomeHero />

        <ActiveOrdersHomeSection />

        <TextField
          fullWidth
          placeholder="Search restaurants…"
          value={searchQuery}
          onChange={handleSearchChange}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRounded sx={{ color: alpha(theme.palette.secondary.main, 0.85) }} />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.paper, 0.45),
              backdropFilter: "blur(10px)",
              "& fieldset": {
                borderColor: alpha(theme.palette.primary.main, 0.12),
              },
              "&:hover fieldset": {
                borderColor: alpha(theme.palette.primary.main, 0.28),
              },
            },
          }}
        />

        <CategoryCarousel categories={categoryList} onSelectCategory={goBrowseCategory} />

        <RestaurantNearYouRow
          restaurants={nearbyPreview}
          onSelect={openRestaurant}
          maxPreview={8}
          onSeeAllNearby={() => navigate("/browse")}
        />

        {nearbyPreview.length === 0 && (
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            No nearby restaurants match your search. Try browse or widen your area.
          </Typography>
        )}

        <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em" sx={{ mb: 1 }}>
          Explore more
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Open browse to filter nearby restaurants by one or many cuisines.
        </Typography>
        <Button
          variant="contained"
          color="secondary"
          onClick={() => navigate("/browse")}
          sx={{ borderRadius: 2, textTransform: "none", fontWeight: 700, py: 1.25, mb: 3 }}
        >
          Browse restaurants
        </Button>

        <Typography variant="caption" color="text.secondary" display="block">
          Signed in as {user?.first_name ?? "guest"}. Prices and availability may vary.
        </Typography>
      </Container>

      <Box
        component="footer"
        sx={{
          textAlign: "center",
          py: 2.5,
          px: 2,
          mt: "auto",
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.35),
        }}
      >
        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} OpsEat · Food delivery · Developed by <Link to="https://moysiadis.dev/" target="_blank" rel="noopener noreferrer" style={{textDecoration:'none', color: alpha(theme.palette.secondary.main, 0.95), }}>George Moysiadis</Link>
        </Typography>
      </Box>
    </Box>
  );
};

export default ClientHome;
