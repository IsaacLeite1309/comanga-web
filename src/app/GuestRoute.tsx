import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/features/auth";

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" strokeWidth={2.5} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={user?.username ? `/perfil/${encodeURIComponent(user.username)}` : "/perfil"} replace />;
  }

  return <>{children}</>;
}
