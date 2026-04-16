import { useTheme, useMediaQuery } from "@mui/material";

export const useMobile = () => {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("md"));
};