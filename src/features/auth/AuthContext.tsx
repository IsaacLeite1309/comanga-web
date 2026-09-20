import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AuthContext, type AuthUser } from "./authContextState";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function validateSession() {
      try {
        const response = await api.get("/auth/me");
        setUser(response.data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    validateSession();
  }, []);

  function login(userData: AuthUser) {
    setUser(userData);
  }

  function clearSession() {
    setUser(null);
    navigate("/entrar");
  }

  async function logout() {
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao invalidar sessão no back-end", error);
    } finally {
      toast.success("Sessão encerrada com segurança.");
      clearSession();
    }
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated: !!user, user, loading, login, logout, clearSession }}>
      {children}
    </AuthContext.Provider>
  );
}
