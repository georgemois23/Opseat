import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { UserRole } from "@/types/roles";

export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (user?.role !== UserRole.ADMIN) {
    return <Navigate to="/home" replace />;
  }
  return <>{children}</>;
}
