import { useMemo } from "react";
import { useAuth } from "@/features/auth";

// As respostas públicas podem incluir dados pessoais e variar com a preferência +18.
export function usePublicCatalogScope() {
  const { user } = useAuth();
  const userId = user?.id ?? "guest";
  const adultContent = Boolean(user?.conteudo_adulto);
  const activeProfile = user?.active_profile ?? "";
  return useMemo(() => [userId, adultContent, activeProfile] as const, [userId, adultContent, activeProfile]);
}
