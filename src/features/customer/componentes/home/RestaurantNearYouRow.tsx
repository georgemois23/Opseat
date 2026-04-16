import { Box, Button, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import { Restaurant } from "@/features/restaurants/types/RestaurantData";
import { RestaurantNearYouCard } from "./RestaurantNearYouCard";

const DEFAULT_MAX = 8;

type Props = {
  restaurants: Restaurant[];
  onSelect: (r: Restaurant) => void;
  maxPreview?: number;
  onSeeAllNearby?: () => void;
};

export function RestaurantNearYouRow({
  restaurants,
  onSelect,
  maxPreview = DEFAULT_MAX,
  onSeeAllNearby,
}: Props) {
  const theme = useTheme();

  const offsetBefore = theme.spacing(2); // 16px (matches your old xs: 2)
  const offsetAfter = theme.spacing(2);

  if (restaurants.length === 0) return null;

  const preview = restaurants.slice(0, maxPreview);
  const hasMore = restaurants.length > preview.length;

  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "baseline", justifyContent: "space-between", gap: 1, mb: 2 }}>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.03em",
              mb: 0.25,
            }}
          >
            Near you
          </Typography>
          <Typography variant="body2" color="text.secondary">
            A quick preview — {restaurants.length} in your area
          </Typography>
        </Box>
        {hasMore && onSeeAllNearby && (
          <Button
            size="small"
            color="secondary"
            onClick={onSeeAllNearby}
            sx={{ textTransform: "none", fontWeight: 700 }}
          >
            See all nearby
          </Button>
        )}
      </Box>
      <Box
        sx={{
          width: "100%",
          maxWidth: "100%",
          overflowX: "hidden",
          mx: { xs: -2, sm: -1 },
          pl: { xs: 2, sm: 1 },
          boxSizing: "border-box",
          "& .swiper": { overflow: "hidden", maxWidth: "100%" },
          "& .swiper-wrapper": { boxSizing: "border-box" },
        }}
      >
        <Swiper
          modules={[FreeMode]}
          freeMode={{ enabled: true, momentum: true }}
          slidesPerView="auto"
          spaceBetween={16}
          // slidesOffsetBefore={Number(offsetBefore)} 
          // slidesOffsetAfter={Number(offsetAfter)}
          className="home-near-swiper"
        >
          {preview.map((r) => (
            <SwiperSlide key={r.id} style={{ width: "auto" }}>
              <RestaurantNearYouCard restaurant={r} onSelect={() => onSelect(r)} />
            </SwiperSlide>
          ))}
        </Swiper>
      </Box>
      <Box
        sx={{
          mt: 1.5,
          height: 3,
          borderRadius: 2,
          background: `linear-gradient(90deg, ${alpha(theme.palette.primary.main, 0.5)}, ${alpha(theme.palette.secondary.main, 0.4)}, transparent)`,
          maxWidth: 200,
        }}
      />
    </Box>
  );
}
