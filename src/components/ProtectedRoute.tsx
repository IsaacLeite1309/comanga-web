import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();
  const sessionToastFired = useRef(false);
  const forbiddenToastFired = useRef(false);

  useEffect(() => {
    if (!loading && !isAuthenticated && !sessionToastFired.current) {
      toast.error("Sua sessão é inválida ou foi encerrada. Por favor, faça login novamente.");
      sessionToastFired.current = true;
    }

    if (!loading && isAuthenticated && requiredRole && user?.role !== requiredRole && !forbiddenToastFired.current) {
      toast.error("Acesso negado: Você não tem permissão para acessar esta área.");
      forbiddenToastFired.current = true;
    }
  }, [loading, isAuthenticated, requiredRole, user?.role]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" strokeWidth={2.5} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to={user?.username ? `/perfil/${user.username}` : "/entrar"} replace />;
  }

  return <>{children}</>;
}
