import { describe, expect, it } from "vitest";
import {
  NATIVE_AUTHOR_ROLE_OPTIONS,
  NATIVE_COUNTRY_OPTIONS,
  NATIVE_DEMOGRAPHY_OPTIONS,
  NATIVE_ORIGINAL_STATUS_OPTIONS,
} from "@/features/admin-catalog/domain/workOptions";

const values = (options: Array<{ value?: string }>) => options.map((option) => option.value);

describe("opções nativas de Obra", () => {
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
      "Completo",
      "Em andamento",
      "Em hiato",
      "Cancelado",
    ]);
    expect(values(NATIVE_DEMOGRAPHY_OPTIONS)).toEqual(["Shonen", "Shoujo", "Seinen", "Josei", "Kodomo"]);
  });
});
