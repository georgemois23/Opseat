import React, { useCallback, useEffect, useState } from "react";
import { Button, CircularProgress, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { fetchAdminUsers, type AdminUserRow } from "@/features/admin/services/admin.api";

export default function AdminUsersPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<AdminUserRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchAdminUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  document.title = "Admin • Users • OpsEat";

  if (loading) {
    return (
      <Stack alignItems="center" py={6}>
        <CircularProgress size={36} />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="subtitle1" fontWeight={800}>
        Users
      </Typography>
      <TableContainer
        sx={{
          borderRadius: 2,
          border: `1px solid ${alpha(theme.palette.divider, 0.9)}`,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Restaurant user</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="right"> </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">No users loaded.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              users.map((u) => (
                <TableRow
                  key={u.id}
                  hover
                  sx={{ cursor: "pointer" }}
                  onClick={() => navigate(`/admin/user/${encodeURIComponent(u.id)}`)}
                >
                  <TableCell>{u.email}</TableCell>
                  <TableCell>{u.role ?? "—"}</TableCell>
                  <TableCell>{u.isRestaurantUser ? "Yes" : "No"}</TableCell>
                  <TableCell sx={{ fontFamily: "monospace", fontSize: "0.75rem" }}>{u.id}</TableCell>
                  <TableCell align="right">
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/admin/user/${encodeURIComponent(u.id)}`);
                      }}
                      sx={{ textTransform: "none", fontWeight: 700 }}
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Button variant="outlined" onClick={() => void load()} sx={{ alignSelf: "flex-start", borderRadius: 2 }}>
        Refresh
      </Button>
    </Stack>
  );
}
