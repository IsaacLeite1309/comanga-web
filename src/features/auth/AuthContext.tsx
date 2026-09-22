import { useEffect, useState, type ReactNode } from "react";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ADMIN_PROFILE,
  AuthContext,
  readActiveProfile,
  readProfiles,
  type AuthUser,
} from "./authContextState";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (isSessionEnding && pathname === "/entrar") setIsSessionEnding(false);
  }, [isSessionEnding, pathname]);

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
    setIsSessionEnding(false);
    setUser(userData);
  }

  // Mantém o contexto sincronizado após alterações do próprio perfil, sem recarregar a página.
  function updateUser(changes: Partial<AuthUser>) {
    setUser((current) => (current ? { ...current, ...changes } : current));
  }

  function clearSession() {
    setIsSessionEnding(true);
    navigate("/entrar");
    setUser(null);
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

  const profiles = readProfiles(user);

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!user,
        user,
        profiles,
        activeProfile: readActiveProfile(user),
        hasAdminProfile: profiles.includes(ADMIN_PROFILE),
        loading,
        isSessionEnding,
        login,
        updateUser,
        logout,
        clearSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
