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
import PlaceOutlined from "@mui/icons-material/PlaceOutlined";
import { Restaurant } from "@/features/restaurants/types/RestaurantData";

const ACCENTS = [
  alpha("#14B8A6", 0.35),
  alpha("#F97316", 0.3),
  alpha("#38BDF8", 0.28),
  alpha("#A78BFA", 0.3),
];

function accentFor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return ACCENTS[Math.abs(h) % ACCENTS.length];
}

type Props = {
  restaurant: Restaurant;
  onSelect: () => void;
};

export function RestaurantGridCard({ restaurant, onSelect }: Props) {
  const theme = useTheme();
  const open = restaurant.isDelivering;
  const accent = accentFor(restaurant.name);
  const firstCat = restaurant.categories?.[0];

  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 2.5,
        overflow: "hidden",
        bgcolor: alpha(theme.palette.background.paper, 0.55),
        border: `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
        opacity: open ? 1 : 0.72,
        transition: "border-color 0.2s ease, transform 0.2s ease",
        "&:hover": {
          borderColor: alpha(theme.palette.primary.main, 0.35),
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardActionArea onClick={onSelect} sx={{ height: "100%", alignItems: "stretch" }}>
        <Stack sx={{ height: "100%" }}>
          <Box
            sx={{
              height: 8,
              width: "100%",
              background: `linear-gradient(90deg, ${accent}, ${alpha(theme.palette.primary.main, 0.15)})`,
            }}
          />
          <Stack spacing={1.25} sx={{ p: 2, flex: 1 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
              <Typography variant="subtitle1" fontWeight={800} letterSpacing="-0.02em" sx={{ lineHeight: 1.25 }}>
                {restaurant.name}
              </Typography>
              <Chip
                label={open ? "Open" : "Closed"}
                size="small"
                sx={{
                  height: 22,
                  fontSize: "0.65rem",
                  fontWeight: 700,
                  bgcolor: open ? alpha(theme.palette.success.main, 0.2) : alpha(theme.palette.error.main, 0.15),
                  color: open ? theme.palette.success.light : theme.palette.error.light,
                }}
              />
            </Stack>
            <Stack direction="row" spacing={0.5} alignItems="center" color="text.secondary">
              <PlaceOutlined sx={{ fontSize: 18 }} />
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }} noWrap>
                {restaurant.city}
                {restaurant.postalCode ? ` · ${restaurant.postalCode}` : ""}
              </Typography>
            </Stack>
            {firstCat && (
              <Chip
                label={String(firstCat).replace(/_/g, " ")}
                size="small"
                variant="outlined"
                sx={{
                  alignSelf: "flex-start",
                  textTransform: "capitalize",
                  borderColor: alpha(theme.palette.secondary.main, 0.4),
                  color: alpha(theme.palette.secondary.main, 0.95),
                  fontWeight: 600,
                  fontSize: "0.7rem",
                }}
              />
            )}
          </Stack>
        </Stack>
      </CardActionArea>
    </Card>
  );
}
