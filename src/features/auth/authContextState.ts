import { createContext } from "react";

export const ADMIN_PROFILE = "Administrador";
export const DEFAULT_PROFILE = "Usuário Padrão";

export interface AuthUser {
  id: string;
  username: string;
  email?: string;
  profiles?: string[];
  active_profile?: string;
  conteudo_adulto?: boolean;
}

export interface AuthContextValue {
  isAuthenticated: boolean;
  user: AuthUser | null;
  /** Perfis que a conta possui. */
  profiles: string[];
  /** Perfil ativo da sessão atual; o backend continua sendo a autoridade. */
  activeProfile: string;
  /** A conta possui a atribuição Administrador, mesmo que ela não esteja ativa. */
  hasAdminProfile: boolean;
  loading: boolean;
  isSessionEnding: boolean;
  login: (userData: AuthUser) => void;
  updateUser: (changes: Partial<AuthUser>) => void;
  logout: () => void;
  clearSession: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function readProfiles(user: AuthUser | null | undefined): string[] {
  return user?.profiles ?? [];
}

export function hasProfile(user: AuthUser | null | undefined, profile: string): boolean {
  return readProfiles(user).includes(profile);
}

// O perfil ativo é a única fonte do contexto operacional; possuir o perfil não basta.
export function readActiveProfile(user: AuthUser | null | undefined): string {
  const active = user?.active_profile;
  return active && hasProfile(user, active) ? active : DEFAULT_PROFILE;
}

export function isActingAsAdmin(user: AuthUser | null | undefined): boolean {
  return readActiveProfile(user) === ADMIN_PROFILE;
}
