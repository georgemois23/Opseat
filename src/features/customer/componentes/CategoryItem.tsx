import React, { memo } from "react";
import { Button, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";

export const CategoryItem = memo(
  ({
    category,
    isSelected,
    onClick,
  }: {
    category: string;
    isSelected: boolean;
    onClick: (cat: string) => void;
  }) => {
    const theme = useTheme();
    const label = String(category).replace(/_/g, " ");

    return (
      <Button
        variant={isSelected ? "contained" : "outlined"}
        color={isSelected ? "secondary" : "inherit"}
        onClick={() => onClick(category)}
        sx={{
          textTransform: "capitalize",
          borderRadius: 999,
          minWidth: "auto",
          px: 2,
          py: 0.85,
          fontWeight: 700,
          fontSize: "0.8125rem",
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
          borderColor: alpha(theme.palette.common.white, 0.14),
          color: isSelected ? undefined : alpha(theme.palette.text.primary, 0.88),
          bgcolor: isSelected ? undefined : alpha(theme.palette.background.paper, 0.35),
          backdropFilter: "blur(8px)",
          boxShadow: "none",
          "&:hover": {
            borderColor: alpha(theme.palette.secondary.main, 0.45),
            bgcolor: isSelected
              ? undefined
              : alpha(theme.palette.background.paper, 0.55),
          },
        }}
      >
        {label}
      </Button>
    );
  }
);
