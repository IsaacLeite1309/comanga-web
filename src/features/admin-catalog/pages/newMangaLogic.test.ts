import { describe, expect, it } from "vitest";
import {
  filterOptionsByDependency,
  filterWorkTypesByCountry,
  getDefaultCountryAndType,
  isHentaiGenre,
} from "./newMangaLogic";
import type { OptionValue, WorkFormOptions } from "./newMangaTypes";

const countryCategory = { slug: "paises-origem", name: "País de origem" };

function workType(id: number, label: string, countries: string[]): OptionValue {
  return {
    id,
    label,
    depends_on: countries.map((country, index) => ({
      id: 100 + index,
      label: country,
      category: countryCategory,
    })),
  };
}

const officialTypes: OptionValue[] = [
  workType(1, "Mangá", ["Japão"]),
  workType(2, "Manhwa", ["Coreia do Sul"]),
  workType(3, "Manhua", ["China", "Taiwan"]),
  workType(4, "Novel", ["China", "Coreia do Sul", "Japão", "Taiwan"]),
  { id: 5, label: "Tipo legado sem dependência" },
];

describe("tipos de Obra restritos pelo país", () => {
  it("oferece apenas os tipos declarados para o país escolhido", () => {
    expect(filterWorkTypesByCountry(officialTypes, "Japão").map((type) => type.label))
      .toEqual(["Mangá", "Novel"]);
    expect(filterWorkTypesByCountry(officialTypes, "Coreia do Sul").map((type) => type.label))
      .toEqual(["Manhwa", "Novel"]);
    expect(filterWorkTypesByCountry(officialTypes, "Taiwan").map((type) => type.label))
      .toEqual(["Manhua", "Novel"]);
  });

  it("nunca oferece tipo sem dependência de país, ao contrário das demais listas", () => {
    expect(filterWorkTypesByCountry(officialTypes, "Japão").some((type) => type.id === 5)).toBe(false);
    // Autores, editoras e revistas mantêm a regra antiga: sem dependência, valem para todos.
    expect(filterOptionsByDependency([{ id: 9, label: "Autor livre" }], "Japão")).toEqual([
      { id: 9, label: "Autor livre" },
    ]);
  });

  it("sem país escolhido não oferece nenhum tipo", () => {
    expect(filterWorkTypesByCountry(officialTypes, "")).toEqual([]);
  });

  it("propõe Mangá como padrão para o Japão", () => {
    const options: WorkFormOptions = {
      authors: [],
      workTypes: officialTypes,
      genres: [],
      magazines: [],
      originalPublishers: [],
    };

    expect(getDefaultCountryAndType(options)).toEqual({ country: "Japão", typeId: "1" });
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
