import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  Checkbox,
  Divider,
  IconButton,
  Chip,
  TextField,
  useTheme,
  Alert,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import CloseIcon from "@mui/icons-material/Close";
import RestaurantRounded from "@mui/icons-material/RestaurantRounded";

interface Props {
  open: boolean;
  onClose: () => void;
  item: any;
  onAddToOrder: (orderItem: any) => void;
  /** When false, show details only (no add to cart). */
  orderingEnabled?: boolean;
  /** Replaces default “not accepting orders” copy (e.g. out of delivery range). */
  browseOnlyMessage?: string;
  /** Opening from basket: pre-select ingredients and comment text. */
  cartPrefill?: { ingredientIds: string[]; comments: string } | null;
  /** True when editing an existing basket line (e.g. different primary button label). */
  isEditingCartLine?: boolean;
  checkoutPreview?: boolean;
}

const ItemPreviewModal: React.FC<Props> = ({
  open,
  onClose,
  item,
  onAddToOrder,
  orderingEnabled = true,
  browseOnlyMessage,
  cartPrefill = null,
  isEditingCartLine = false,
  checkoutPreview = false,
}) => {
  const theme = useTheme();
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [comments, setComments] = useState("");

  useEffect(() => {
    if (!open || !item) return;
    if (cartPrefill) {
      setSelectedIngredients(cartPrefill.ingredientIds);
      setComments(cartPrefill.comments);
    } else if (item.ingredients?.length) {
      const allIds = item.ingredients.map((link: any) => link.ingredient.id);
      setSelectedIngredients(allIds);
      setComments("");
    } else {
      setSelectedIngredients([]);
      setComments("");
    }
  }, [item, open, cartPrefill]);

  if (!item) return null;

  const handleToggleIngredient = (id: string) => {
    setSelectedIngredients((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleAddClick = () => {
    if (!orderingEnabled || item.isSoldOut) return;
    const finalItem = {
      ...item,
      customizedIngredients: item.ingredients.filter((link: any) =>
        selectedIngredients.includes(link.ingredient.id)
      ),
      comments,
    };
    onAddToOrder(finalItem);
    onClose();
  };

  const priceNum = Number(item.price) || 0;
  const fieldSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: 2,
      bgcolor: alpha(theme.palette.common.white, 0.04),
      "&:hover .MuiOutlinedInput-notchedOutline": {
        borderColor: alpha(theme.palette.primary.main, 0.35),
      },
    },
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      scroll="paper"
      PaperProps={{
        elevation: 0,
        sx: {
          borderRadius: 3,
          bgcolor: "background.paper",
          backgroundImage: "none",
          border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
          boxShadow: `0 24px 48px ${alpha(theme.palette.common.black, 0.45)}`,
          overflow: "hidden",
        },
      }}
    >
      <DialogTitle sx={{ p: 2, pb: 1.5 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="overline"
              sx={{
                display: "block",
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: alpha(theme.palette.secondary.main, 0.9),
                lineHeight: 1.2,
              }}
            >
              {orderingEnabled ? "Menu item" : "Browse only"}
            </Typography>
            <Typography variant="h6" fontWeight={800} letterSpacing="-0.02em">
              {item.name}
            </Typography>
          </Box>
          <IconButton
            onClick={onClose}
            size="small"
            aria-label="Close"
            sx={{
              color: "text.secondary",
              bgcolor: alpha(theme.palette.background.paper, 0.55),
              border: `1px solid ${alpha(theme.palette.primary.main, 0.15)}`,
              "&:hover": { bgcolor: alpha(theme.palette.common.white, 0.08) },
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          p: 0,
          borderColor: alpha(theme.palette.primary.main, 0.12),
          "&::-webkit-scrollbar": { width: 6 },
          "&::-webkit-scrollbar-thumb": {
            borderRadius: 3,
            bgcolor: alpha(theme.palette.primary.main, 0.35),
          },
        }}
      >
        <Box
          sx={{
            width: "100%",
            height: 200,
            position: "relative",
            overflow: "hidden",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            background: item.imageUrl
              ? undefined
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.dark, 0.9)} 0%, ${alpha(theme.palette.secondary.main, 0.45)} 100%)`,
          }}
        >
          {item.imageUrl ? (
            <Box
              component="img"
              src={item.imageUrl}
              alt={item.name}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: alpha(theme.palette.common.white, 0.35),
              }}
            >
              <RestaurantRounded sx={{ fontSize: 72 }} />
            </Box>
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              background: item.imageUrl
                ? `linear-gradient(180deg, transparent 40%, ${alpha("#000", 0.55)} 100%)`
                : undefined,
            }}
          />
        </Box>

        <Box sx={{ p: 3 }}>
          {/* {!orderingEnabled && (
            <Alert
              severity={browseOnlyMessage ? "info" : "warning"}
              sx={{
                mb: 2,
                borderRadius: 2,
                bgcolor: browseOnlyMessage
                  ? alpha(theme.palette.info.main, 0.12)
                  : alpha(theme.palette.warning.main, 0.12),
                border: `1px solid ${browseOnlyMessage ? alpha(theme.palette.info.main, 0.35) : alpha(theme.palette.warning.main, 0.35)}`,
                color: "text.primary",
                "& .MuiAlert-icon": {
                  color: browseOnlyMessage ? theme.palette.info.light : theme.palette.warning.light,
                },
              }}
            >
              {browseOnlyMessage ??
                "This restaurant isn't accepting orders right now. You can still browse the menu."}
            </Alert>
          )} */}

          {item.description ? (
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
              {item.description}
            </Typography>
          ) : null}

          {item.ingredients?.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  color: alpha(theme.palette.secondary.main, 0.85),
                }}
              >
                {orderingEnabled ? "Customize" : "Ingredients"}
              </Typography>
              <Divider sx={{ my: 1.5, borderColor: alpha(theme.palette.primary.main, 0.15) }} />

              {!orderingEnabled ? (
                <Stack spacing={1} component="ul" sx={{ m: 0, pl: 2.5 }}>
                  {item.ingredients
                    ?.slice()
                    .sort((a: any, b: any) => Number(b.required) - Number(a.required))
                    .map((link: any) => {
                      const isAvailable = link?.ingredient?.available !== false;
                      return (
                        <Typography
                          key={link.ingredient.id}
                          component="li"
                          variant="body2"
                          sx={{ color: !isAvailable ? "text.disabled" : "text.primary", fontWeight: 500 }}
                        >
                          {link.ingredient.name}
                          {link.required ? " (included)" : ""}
                          {!isAvailable ? " — sold out" : ""}
                        </Typography>
                      );
                    })}
                </Stack>
              ) : (
                <Stack spacing={0.5}>
                  {item.ingredients
                    ?.slice()
                    .sort((a: any, b: any) => Number(b.required) - Number(a.required))
                    .map((link: any) => {
                      const isAvailable = link?.ingredient?.available !== false;
                      const isRequired = link.required;
                      const isChecked = selectedIngredients.includes(link.ingredient.id);

                      return (
                        <Stack
                          key={link.ingredient.id}
                          direction="row"
                          alignItems="center"
                          spacing={0.75}
                          sx={{
                            minHeight: 34,
                            py: 0.5,
                            px: 1,
                            mx: -1,
                            borderRadius: 1.5,
                            "&:hover": { bgcolor: alpha(theme.palette.primary.main, 0.06) },
                          }}
                        >
                          {isRequired ? (
                            <Box sx={{ width: 34, display: "flex", justifyContent: "center", alignItems: "center",  }}>
                              <Chip
                                // label="●"
                                size="small"
                                sx={{
                                  height: 18,
                                  minWidth: 18,
                                  px: 0,
                                  "& .MuiChip-label": { px: 0, fontSize: "0.6rem", lineHeight: 1 },
                                  color: alpha(theme.palette.primary.light, 1),
                                  bgcolor: alpha(theme.palette.primary.main, 0.22),
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                                }}
                              />
                            </Box>
                          ) : (
                            <Checkbox
                              size="small"
                              checked={isChecked}
                              onChange={() => handleToggleIngredient(link.ingredient.id)}
                              disabled={!isAvailable}
                              sx={{
                                p: 0.5,
                                color: alpha(theme.palette.primary.light, 0.8),
                                "&.Mui-checked": { color: "primary.main" },
                              }}
                            />
                          )}

                          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap sx={{ minWidth: 0 }}>
                            <Typography
                              variant="body2"
                              sx={{ color: !isAvailable ? "text.disabled" : "text.primary", fontWeight: 500 }}
                            >
                              {link.ingredient.name}
                            </Typography>
                            {isRequired && (
                              <Chip
                                label="Required"
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  color: alpha(theme.palette.primary.light, 1),
                                  bgcolor: alpha(theme.palette.primary.main, 0.2),
                                  border: `1px solid ${alpha(theme.palette.primary.main, 0.35)}`,
                                }}
                              />
                            )}
                            {!isAvailable && (
                              <Typography variant="caption" color="error.light" fontWeight={700}>
                                Sold out
                              </Typography>
                            )}
                          </Stack>
                        </Stack>
                      );
                    })}
                </Stack>
              )}
            </Box>
          )}

          {!orderingEnabled && comments.trim().length > 0 && (
            <Box sx={{ mt: 2.5 }}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  color: alpha(theme.palette.secondary.main, 0.85),
                }}
              >
                Comment
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mt: 0.75, lineHeight: 1.5, fontStyle: "italic" }}
              >
                {comments}
              </Typography>
            </Box>
          )}

          {orderingEnabled && (
            <Box sx={{ mt: 3 }}>
              <Typography
                variant="overline"
                sx={{
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  color: alpha(theme.palette.secondary.main, 0.85),
                }}
              >
                Special instructions
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={2}
                placeholder="e.g. No onions, extra napkins…"
                variant="outlined"
                size="small"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                sx={{ mt: 1, ...fieldSx }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block", opacity: 0.9 }}>
                Some changes may result in extra charges.
              </Typography>
            </Box>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
          px: 2.5,
          flexWrap: "wrap",
          gap: 1.5,
          justifyContent: "space-between",
          alignItems: "center",
          borderTop: `1px solid ${alpha(theme.palette.primary.main, 0.12)}`,
          bgcolor: alpha(theme.palette.background.paper, 0.6),
        }}
      >
        <Typography variant="h6" fontWeight={800} sx={{ color: alpha(theme.palette.primary.light, 1) }}>
          {priceNum.toFixed(2)}€
        </Typography>
        {!checkoutPreview && (
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={handleAddClick}
          disabled={!orderingEnabled || item.isSoldOut}
          sx={{
            borderRadius: 2,
            px: 3,
            py: 1.25,
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
          }}
        >
          {!orderingEnabled
            ? "Not accepting orders"
            : item.isSoldOut
              ? "Unavailable"
              : isEditingCartLine
                ? "Update basket"
                : "Add to order"}
        </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ItemPreviewModal;
