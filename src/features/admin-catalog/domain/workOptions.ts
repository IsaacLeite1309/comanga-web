import type { OptionValue } from "./catalogTypes";

export const NATIVE_AUTHOR_ROLE_OPTIONS: OptionValue[] = [
  { id: "História e Arte", value: "História e Arte", label: "História e Arte" },
  { id: "História", value: "História", label: "História" },
  { id: "Arte", value: "Arte", label: "Arte" },
  { id: "Criador Original", value: "Criador Original", label: "Criador Original" },
  { id: "História Original", value: "História Original", label: "História Original" },
  { id: "Ilustrador", value: "Ilustrador", label: "Ilustrador" },
  { id: "Design de Personagens", value: "Design de Personagens", label: "Design de Personagens" },
];

const COMBINED_AUTHOR_ROLE = "História e Arte";
const SEPARATE_AUTHOR_ROLES = ["História", "Arte"];

export function isAuthorRoleDisabled(selectedRoles: string[], role: string) {
  const hasCombinedRole = selectedRoles.includes(COMBINED_AUTHOR_ROLE);
  const hasHistoryRole = selectedRoles.includes("História");
  const hasArtRole = selectedRoles.includes("Arte");

  if (hasCombinedRole) return SEPARATE_AUTHOR_ROLES.includes(role);
  if (hasHistoryRole) return role === COMBINED_AUTHOR_ROLE || role === "Arte";
  if (hasArtRole) return role === COMBINED_AUTHOR_ROLE || role === "História";
  return false;
}

export const NATIVE_COUNTRY_OPTIONS: OptionValue[] = [
  { id: "Japão", value: "Japão", label: "Japão" },
  { id: "Coreia do Sul", value: "Coreia do Sul", label: "Coreia do Sul" },
  { id: "China", value: "China", label: "China" },
  { id: "Taiwan", value: "Taiwan", label: "Taiwan" },
];

export const NATIVE_ORIGINAL_STATUS_OPTIONS: OptionValue[] = [
  { id: "Completa", value: "Completa", label: "Completa" },
  { id: "Em andamento", value: "Em andamento", label: "Em andamento" },
  { id: "Em hiato", value: "Em hiato", label: "Em hiato" },
  { id: "Cancelada", value: "Cancelada", label: "Cancelada" },
];

export const NATIVE_DEMOGRAPHY_OPTIONS: OptionValue[] = [
  { id: "Shonen", value: "Shonen", label: "Shonen" },
  { id: "Shoujo", value: "Shoujo", label: "Shoujo" },
  { id: "Seinen", value: "Seinen", label: "Seinen" },
  { id: "Josei", value: "Josei", label: "Josei" },
  { id: "Kodomo", value: "Kodomo", label: "Kodomo" },
];
