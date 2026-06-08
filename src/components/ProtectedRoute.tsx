import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useEffect, useRef } from "react";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();
  const toastFired = useRef(false);

  useEffect(() => {
    // Dispara o toast apenas uma vez caso o usuário seja bloqueado
    if (!loading && !isAuthenticated && !toastFired.current) {
      toast.error("Sua sessão é inválida ou foi encerrada. Por favor, faça login novamente.");
      toastFired.current = true;
    }
  }, [loading, isAuthenticated]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redireciona mantendo um state de pra onde o usuário queria ir (opcional para UX futura)
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
