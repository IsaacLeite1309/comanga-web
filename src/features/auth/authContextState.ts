import { createContext } from "react";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  role?: string;
  conteudo_adulto?: boolean;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  loading: boolean;
  isSessionEnding: boolean;
  login: (userData: AuthUser) => void;
  logout: () => void;
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
