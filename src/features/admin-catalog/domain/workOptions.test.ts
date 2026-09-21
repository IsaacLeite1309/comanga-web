import { describe, expect, it } from "vitest";
import {
  isAuthorRoleDisabled,
  NATIVE_AUTHOR_ROLE_OPTIONS,
  NATIVE_COUNTRY_OPTIONS,
  NATIVE_DEMOGRAPHY_OPTIONS,
  NATIVE_ORIGINAL_STATUS_OPTIONS,
} from "@/features/admin-catalog/domain/workOptions";

const values = (options: Array<{ value?: string }>) => options.map((option) => option.value);

describe("opções nativas de Obra", () => {
  it("impede papéis de autoria redundantes, sem restringir os demais", () => {
    expect(isAuthorRoleDisabled(["História e Arte"], "História")).toBe(true);
    expect(isAuthorRoleDisabled(["História"], "História e Arte")).toBe(true);
    expect(isAuthorRoleDisabled(["História"], "Arte")).toBe(true);
    expect(isAuthorRoleDisabled(["Arte"], "História")).toBe(true);
    expect(isAuthorRoleDisabled(["Criador Original"], "Ilustrador")).toBe(false);
  });

  it("preserva a prioridade dos papéis de autoria definida pelo domínio", () => {
    expect(values(NATIVE_AUTHOR_ROLE_OPTIONS)).toEqual([
      "História e Arte",
      "História",
      "Arte",
      "Criador Original",
      "História Original",
      "Ilustrador",
    ]);
  });

  it("preserva a ordem e a grafia oficial dos demais valores nativos", () => {
    expect(values(NATIVE_COUNTRY_OPTIONS)).toEqual(["Japão", "Coreia do Sul", "China", "Taiwan"]);
    expect(values(NATIVE_ORIGINAL_STATUS_OPTIONS)).toEqual([
      "Completa",
      "Em andamento",
      "Em hiato",
      "Cancelada",
    ]);
    expect(values(NATIVE_DEMOGRAPHY_OPTIONS)).toEqual(["Shonen", "Shoujo", "Seinen", "Josei", "Kodomo"]);
  });
});
