import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { ADMIN_PROFILE, useAuth } from "@/features/auth";

export function PublicProfileRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, user, activeProfile } = useAuth();
  const warningFired = useRef(false);
  const blocked = isAuthenticated && activeProfile === ADMIN_PROFILE;

  useEffect(() => {
    if (!loading && blocked && !warningFired.current) {
      toast.warning("Mude o perfil para usuário padrão para acessar essa página.");
      warningFired.current = true;
    }
  }, [blocked, loading]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-1 flex-col items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" strokeWidth={2.5} />
      </div>
    );
  }

  if (blocked) {
    return <Navigate to={user?.username ? `/perfil/${encodeURIComponent(user.username)}` : "/perfil"} replace />;
  }

  return <>{children}</>;
}
