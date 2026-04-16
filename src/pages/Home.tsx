import { Box, Typography } from "@mui/material";
import AdminHome from "../features/admin/pages/AdminHome";
import ClientHome from "../features/customer/pages/ClientHome";
import { UserRole } from "@/types/roles";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { User } from "@/features/auth/types/auth.types";

export function WhatToRender({ user }: { user: User }) {
  if (user.role === UserRole.ADMIN) {
    return <AdminHome />;
  }

  if (user.role === UserRole.USER) {
    return <ClientHome />;
  }

  return null;
}

function HomePage() {
  const { user, isLoading } = useAuth();

  if (isLoading && !user) {
    return <Typography>Loading session...</Typography>;
  }

  if (!user) {
    return <h1>Uno</h1>;
  }

  return (
    <Box sx={{ width: "100%", minHeight: "100%" }}>
      <WhatToRender user={user} />
    </Box>
  );
}

export default HomePage;
