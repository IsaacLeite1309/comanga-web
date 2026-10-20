import { Fragment } from "react";
import { useAuth } from "@/features/auth";
import { ProtectedRoute } from "./ProtectedRoute";

export function PersonalRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  return <ProtectedRoute><Fragment key={user?.id || "anonymous"}>{children}</Fragment></ProtectedRoute>;
}
