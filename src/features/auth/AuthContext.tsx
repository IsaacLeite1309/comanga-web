import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { isAxiosError } from "axios";
import { api } from "@/services/api";
import { toast } from "sonner";
import { useLocation, useNavigate } from "react-router-dom";
import { ADMIN_QUERY_ROOT, PERSONAL_LIBRARY_QUERY_ROOT, PUBLIC_CATALOG_QUERY_ROOT, queryClient } from "@/lib/queryClient";
import { clearAdminDraftStorage } from "@/lib/adminDraftStorage";
import {
  ADMIN_PROFILE,
  AuthContext,
  readActiveProfile,
  readProfiles,
  type AuthUser,
} from "./authContextState";

const SESSION_CHANGE_KEY = "comanga:session-changed";

function notifyOtherTabs() {
  try {
    localStorage.setItem(SESSION_CHANGE_KEY, `${Date.now()}:${Math.random()}`);
  } catch {
    // A aba atual continua sincronizada mesmo se o armazenamento estiver indisponível.
  }
}

function syncAdminSessionCache(previous: string | null, user: AuthUser | null) {
  if (!user) {
    queryClient.removeQueries({ queryKey: ADMIN_QUERY_ROOT });
    clearAdminDraftStorage();
    return null;
  }
  const next = `${user.id}:${user.active_profile ?? ""}`;
  if (previous && previous !== next) {
    queryClient.removeQueries({ queryKey: ADMIN_QUERY_ROOT });
    if (!previous.startsWith(`${user.id}:`)) clearAdminDraftStorage();
  }
  return next;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialSessionUnavailable, setInitialSessionUnavailable] = useState(false);
  const [sessionRetryAttempt, setSessionRetryAttempt] = useState(0);
  const [isSessionEnding, setIsSessionEnding] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const sessionRevision = useRef(0);
  const lastSessionKey = useRef<string | null>(null);

  const validateSession = useCallback(async (initial = false) => {
    const revision = ++sessionRevision.current;
    let retryInitialValidation = false;
    if (initial) setLoading(true);
    try {
      const response = await api.get("/auth/me");
      if (revision === sessionRevision.current) {
        lastSessionKey.current = syncAdminSessionCache(lastSessionKey.current, response.data.user);
        setInitialSessionUnavailable(false);
        setIsSessionEnding(false);
        setUser(response.data.user);
      }
    } catch (error) {
      if (revision === sessionRevision.current) {
        if (isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
          setInitialSessionUnavailable(false);
          queryClient.removeQueries({ queryKey: PUBLIC_CATALOG_QUERY_ROOT });
          queryClient.removeQueries({ queryKey: PERSONAL_LIBRARY_QUERY_ROOT });
          queryClient.removeQueries({ queryKey: ADMIN_QUERY_ROOT });
          clearAdminDraftStorage();
          lastSessionKey.current = null;
          setUser(null);
        } else {
          if (initial) {
            retryInitialValidation = true;
            setInitialSessionUnavailable(true);
            setSessionRetryAttempt((attempt) => attempt + 1);
          }
          toast.error("Não foi possível verificar sua sessão. Tente novamente em instantes.", { id: "session-unavailable" });
        }
      }
    } finally {
      if (revision === sessionRevision.current && !retryInitialValidation) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!initialSessionUnavailable) return;
    const timer = window.setTimeout(() => { void validateSession(true); }, 3000);
    return () => window.clearTimeout(timer);
  }, [initialSessionUnavailable, sessionRetryAttempt, validateSession]);

  useEffect(() => {
    if (isSessionEnding && pathname === "/entrar") setIsSessionEnding(false);
  }, [isSessionEnding, pathname]);

  useEffect(() => {
    void validateSession(true);
    const onStorage = (event: StorageEvent) => {
      if (event.key === SESSION_CHANGE_KEY) void validateSession();
    };
    const onFocus = () => { void validateSession(); };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      sessionRevision.current += 1;
    };
  }, [validateSession]);

  function login(userData: AuthUser) {
    sessionRevision.current += 1;
    lastSessionKey.current = `${userData.id}:${userData.active_profile ?? ""}`;
    setInitialSessionUnavailable(false);
    queryClient.removeQueries({ queryKey: PUBLIC_CATALOG_QUERY_ROOT });
    queryClient.removeQueries({ queryKey: PERSONAL_LIBRARY_QUERY_ROOT });
    queryClient.removeQueries({ queryKey: ADMIN_QUERY_ROOT });
    clearAdminDraftStorage();
    setIsSessionEnding(false);
    setLoading(false);
    setUser(userData);
    notifyOtherTabs();
  }

  // Mantém o contexto sincronizado após alterações do próprio perfil, sem recarregar a página.
  function updateUser(changes: Partial<AuthUser>) {
    sessionRevision.current += 1;
    lastSessionKey.current = null;
    queryClient.removeQueries({ queryKey: ADMIN_QUERY_ROOT });
    setLoading(false);
    setUser((current) => (current ? { ...current, ...changes } : current));
    notifyOtherTabs();
  }

  function clearSession() {
    sessionRevision.current += 1;
    lastSessionKey.current = null;
    setInitialSessionUnavailable(false);
    queryClient.removeQueries({ queryKey: PUBLIC_CATALOG_QUERY_ROOT });
    queryClient.removeQueries({ queryKey: PERSONAL_LIBRARY_QUERY_ROOT });
    queryClient.removeQueries({ queryKey: ADMIN_QUERY_ROOT });
    clearAdminDraftStorage();
    setIsSessionEnding(true);
    setLoading(false);
    navigate("/entrar");
    setUser(null);
    notifyOtherTabs();
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
