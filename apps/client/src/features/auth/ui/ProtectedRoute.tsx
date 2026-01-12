import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "@/entities/user/model/auth.store";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  roles?: ("ADMIN" | "MANAGER" | "SALESPERSON")[];
};

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
