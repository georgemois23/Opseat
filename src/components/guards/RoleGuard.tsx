import { Navigate } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "../../features/auth/hooks/useAuth";
import { UserRole } from "@/types/roles";

interface RoleGuardProps {
  roles: UserRole[];
  children: ReactNode;
}

export default function RoleGuard({ roles, children }: RoleGuardProps) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  // role not allowed
  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" />;
  }

  return <>{children}</>;
}