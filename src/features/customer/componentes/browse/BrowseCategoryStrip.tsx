import { useEffect, useMemo, useRef } from "react";
import { Box, Button, IconButton, Typography, useMediaQuery, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import ChevronLeftRounded from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRounded from "@mui/icons-material/ChevronRightRounded";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Mousewheel, Navigation, Scrollbar } from "swiper/modules";
import type { Swiper as SwiperClass } from "swiper";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/scrollbar";
import { CategoryItem } from "../CategoryItem";

type Props = {
  categories: string[];
  selected: string[];
  onToggleCategory: (category: string) => void;
  onClearCategories: () => void;
};

/** Selected cuisines first (stable order within each group), so picks at the end jump to the start; deselect restores catalog order. */
function orderCategoriesForDisplay(all: string[], selected: string[]): string[] {
  const sel = new Set(selected.map((s) => s.toLowerCase()));
  const first: string[] = [];
  const second: string[] = [];
  for (const c of all) {
    if (sel.has(c.toLowerCase())) {
      first.push(c);
    } else {
      second.push(c);
    }
  }
  return [...first, ...second];
}

function isCategorySelected(cat: string, selected: string[]) {
  const k = cat.toLowerCase();
  return selected.some((s) => s.toLowerCase() === k);
}

export function BrowseCategoryStrip({
  categories,
  selected,
  onToggleCategory,
  onClearCategories,
}: Props) {
  const theme = useTheme();
  const isMdUp = useMediaQuery(theme.breakpoints.up("md"));
  const swiperRef = useRef<SwiperClass | null>(null);

  const orderedCategories = useMemo(
    () => orderCategoriesForDisplay(categories, selected),
    [categories, selected]
  );

  const selectionKey = useMemo(() => [...selected].sort().join("|"), [selected]);

  useEffect(() => {
    swiperRef.current?.slideTo(0, 0);
  }, [selectionKey]);

  return (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1, mb: 1.5 }}>
        <Typography
          variant="overline"
          sx={{
            letterSpacing: "0.12em",
            fontWeight: 700,
            color: alpha(theme.palette.secondary.main, 0.95),
          }}
        >
          Cuisines
        </Typography>
        {selected.length > 0 && (
          <Button size="small" onClick={onClearCategories} sx={{ textTransform: "none", fontWeight: 600 }}>
            Clear cuisines
          </Button>
        )}
      </Box>
      <Box
        sx={{
          display: "flex",
          alignItems: "stretch",
          gap: { xs: 0, md: 0.5 },
          width: "100%",
          maxWidth: "100%",
          mx: { xs: -2, sm: 0 },
          px: { xs: 2, sm: 0 },
          boxSizing: "border-box",
        }}
      >
        <IconButton
          className="opseat-browse-cat-prev"
          aria-label="Scroll cuisines left"
          sx={{
            display: { xs: "none", md: "flex" },
            alignSelf: "center",
            flexShrink: 0,
            color: "text.primary",
            bgcolor: alpha(theme.palette.background.paper, 0.55),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            "&:hover": { bgcolor: alpha(theme.palette.background.paper, 0.85) },
            "&.swiper-button-disabled": { opacity: 0.25, pointerEvents: "none" },
          }}
        >
          <ChevronLeftRounded />
        </IconButton>

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            overflow: "hidden",
            borderRadius: 2,
            "& .swiper": {
              overflow: "hidden",
              maxWidth: "100%",
              pb: isMdUp ? 2.25 : 0,
            },
            "& .swiper-scrollbar": {
              bgcolor: alpha(theme.palette.common.white, 0.06),
              borderRadius: 4,
            },
            "& .swiper-scrollbar-drag": {
              bgcolor: alpha(theme.palette.common.white, 0.35),
              borderRadius: 4,
            },
          }}
        >
          <Swiper
            modules={[FreeMode, Navigation, Mousewheel, Scrollbar]}
            freeMode={{
              enabled: true,
              momentum: true,
              momentumRatio: 1.05,
              momentumVelocityRatio: 0.85,
              sticky: false,
            }}
            mousewheel={{
              forceToAxis: true,
              releaseOnEdges: true,
              sensitivity: 1.2,
            }}
            navigation={{
              prevEl: ".opseat-browse-cat-prev",
              nextEl: ".opseat-browse-cat-next",
            }}
            scrollbar={
              isMdUp ? { draggable: true, hide: false } : false
            }
            slidesPerView="auto"
            spaceBetween={10}
            slidesOffsetAfter={isMdUp ? 120 : 48}
            watchOverflow
            onSwiper={(instance: SwiperClass) => {
              swiperRef.current = instance;
            }}
          >
            {orderedCategories.map((cat) => (
              <SwiperSlide key={cat} style={{ width: "auto" }}>
                <CategoryItem
                  category={cat}
                  isSelected={isCategorySelected(cat, selected)}
                  onClick={onToggleCategory}
                />
              </SwiperSlide>
            ))}
          </Swiper>
        </Box>

        <IconButton
          className="opseat-browse-cat-next"
          aria-label="Scroll cuisines right"
          sx={{
            display: { xs: "none", md: "flex" },
            alignSelf: "center",
            flexShrink: 0,
            color: "text.primary",
            bgcolor: alpha(theme.palette.background.paper, 0.55),
            border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
            "&:hover": { bgcolor: alpha(theme.palette.background.paper, 0.85) },
            "&.swiper-button-disabled": { opacity: 0.25, pointerEvents: "none" },
          }}
        >
          <ChevronRightRounded />
        </IconButton>
      </Box>
    </Box>
  );
}
