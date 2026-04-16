import { useState } from "react";
import {
  Box,
  Card,
  CardActionArea,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import AccessTimeRounded from "@mui/icons-material/AccessTimeRounded";
import { Restaurant } from "@/features/restaurants/types/RestaurantData";

const GRADIENTS = [
  ["#0D9488", "#14B8A6"],
  ["#C2410C", "#F97316"],
  ["#0369A1", "#0EA5E9"],
  ["#6D28D9", "#A78BFA"],
  ["#B45309", "#FBBF24"],
];

function hashGradient(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return GRADIENTS[Math.abs(h) % GRADIENTS.length];
}

type Props = {
  restaurant: Restaurant;
  onSelect: () => void;
  /** Full-width card for browse grid; fixed width for home carousel */
  layout?: "carousel" | "grid";
};

export function RestaurantNearYouCard({ restaurant, onSelect, layout = "carousel" }: Props) {
  const theme = useTheme();
  const [imgFailed, setImgFailed] = useState(false);
  const [c0, c1] = hashGradient(restaurant.name);
  const open = restaurant.isDelivering;
  const cats = restaurant.categories?.slice(0, 2) ?? [];
  const img = restaurant.imageUrl?.trim();
  const showImage = Boolean(img) && !imgFailed;
  const isGrid = layout === "grid";

  return (
    <Card
      elevation={0}
      sx={{
        width: isGrid ? "100%" : { xs: 260, sm: 280 },
        maxWidth: "100%",
        flexShrink: 0,
        borderRadius: 3,
        overflow: "hidden",
        bgcolor: alpha(theme.palette.background.paper, 0.65),
        border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
        backdropFilter: "blur(10px)",
        transition: "transform 0.2s ease, border-color 0.2s ease",
        "&:hover": {
          transform: "translateY(-3px)",
          borderColor: alpha(theme.palette.primary.main, 0.35),
        },
      }}
    >
      <CardActionArea onClick={onSelect} sx={{ alignItems: "stretch" }}>
        <Box
          sx={{
            height: 120,
            position: "relative",
            display: "flex",
            alignItems: "flex-end",
            p: 1.5,
            background: showImage
              ? alpha("#000", 0.2)
              : `linear-gradient(135deg, ${c0} 0%, ${c1} 100%)`,
            overflow: "hidden",
            "&::after": {
              content: '""',
              position: "absolute",
              inset: 0,
              zIndex: 0,
              background: showImage
                ? `linear-gradient(180deg, ${alpha("#000", 0.1)} 0%, ${alpha("#000", 0.7)} 100%)`
                : `linear-gradient(180deg, transparent 40%, ${alpha("#000", 0.55)} 100%)`,
            },
          }}
        >
          {showImage && (
            <Box
              component="img"
              src={img}
              alt=""
              onError={() => setImgFailed(true)}
              sx={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                zIndex: 0,
              }}
            />
          )}
          <Typography
            variant="h6"
            sx={{
              position: "relative",
              zIndex: 1,
              pointerEvents: "none",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "#fff",
              textShadow: `0 1px 8px ${alpha("#000", 0.5)}`,
              lineHeight: 1.2,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {restaurant.name}
          </Typography>
          <Chip
            size="small"
            label={open ? "Open" : "Closed"}
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              zIndex: 2,
              fontWeight: 700,
              fontSize: "0.65rem",
              height: 24,
              bgcolor: open ? alpha("#fff", 0.95) : alpha("#000", 0.45),
              color: open ? "#0f172a" : "#fff",
              border: open ? "none" : `1px solid ${alpha("#fff", 0.2)}`,
            }}
          />
        </Box>
        <Stack spacing={1} sx={{ p: 1.75 }}>
          <Typography variant="body2" color="text.secondary" noWrap>
            {[restaurant.street, restaurant.city].filter(Boolean).join(" · ")}
          </Typography>
          <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
            {cats.map((c) => (
              <Chip
                key={c}
                label={String(c).replace(/_/g, " ")}
                size="small"
                variant="outlined"
                sx={{
                  textTransform: "capitalize",
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                  color: alpha(theme.palette.text.primary, 0.85),
                  fontSize: "0.7rem",
                  height: 22,
                }}
              />
            ))}
          </Stack>
          <Stack direction="row" alignItems="center" spacing={0.5} color="text.secondary">
            <AccessTimeRounded sx={{ fontSize: 16 }} />
            <Typography variant="caption">Delivery nearby</Typography>
            {restaurant.minimumOrderAmount > 0 && <Typography variant="caption">• Minimum {Number(Number(restaurant.minimumOrderAmount).toFixed(1))}€</Typography>}
          </Stack>
          
        </Stack>
      </CardActionArea>
    </Card>
  );
}
