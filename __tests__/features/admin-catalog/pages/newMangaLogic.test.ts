import { describe, expect, it } from "vitest";
import {
  getDefaultWorkType,
  isHentaiGenre,
  isGenreWithoutDemography,
} from "@/features/admin-catalog/pages/newMangaLogic";
import type { WorkFormOptions } from "@/features/admin-catalog/pages/newMangaTypes";

describe("tipo padrão sem país", () => {
  it("seleciona Mangá entre os tipos disponíveis sem exigir país ou dependências", () => {
    const options: WorkFormOptions = { authors: [], workTypes: [{ id: 1, label: "Mangá" }, { id: 4, label: "Novel" }], genres: [], magazines: [], originalPublishers: [] };
    expect(getDefaultWorkType(options)).toEqual({ typeId: "1" });
  });
});

describe("identidade estável do gênero adulto", () => {
  it("reconhece o gênero pelo código, independentemente do rótulo", () => {
    expect(isHentaiGenre({ id: 11, label: "Outro nome qualquer", code: "hentai" })).toBe(true);
    expect(isHentaiGenre({ id: 12, label: "Hentai", code: "ecchi" })).toBe(false);
  });

  it("recorre ao rótulo apenas quando a API não envia o código", () => {
    expect(isHentaiGenre({ id: 13, label: "Hentai" })).toBe(true);
    expect(isHentaiGenre({ id: 14, label: "Romance" })).toBe(false);
  });
});

describe("gêneros sem demografia", () => {
  it("reconhece BL e GL pelo código, sem depender do rótulo", () => {
    expect(isGenreWithoutDemography({ id: 1, label: "Outro nome", code: "boys-love" })).toBe(true);
    expect(isGenreWithoutDemography({ id: 2, label: "Outro nome", code: "girls-love" })).toBe(true);
    expect(isGenreWithoutDemography({ id: 3, label: "Boys’ Love", code: "romance" })).toBe(false);
  });

  it("recorre ao rótulo quando o código está ausente", () => {
    expect(isGenreWithoutDemography({ id: 4, label: "Boys’ Love" })).toBe(true);
    expect(isGenreWithoutDemography({ id: 5, label: "Girls' Love" })).toBe(true);
    expect(isGenreWithoutDemography({ id: 6, label: "Romance" })).toBe(false);
  });
});
