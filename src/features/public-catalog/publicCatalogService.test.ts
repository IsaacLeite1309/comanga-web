import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";
import {
  getPublicCatalogOptions,
  getPublicEditionDetails,
  getPublicWorkDetails,
  listPublicEditions,
  listPublicWorks,
} from "@/features/public-catalog/publicCatalogService";

vi.mock("@/services/api", () => ({
  api: { get: vi.fn() },
}));

describe("publicCatalogService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializa os filtros combináveis da vitrine de Obras", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { works: [], pagination: {} } });

    await listPublicWorks({
      term: "monster",
      typeId: 2,
      country: "Japão",
      demographics: ["Seinen", "Josei"],
      genreIds: [7, 9],
      sortBy: "title",
      order: "ASC",
      page: 2,
      limit: 24,
    });

    expect(api.get).toHaveBeenCalledWith("/public/works", {
      params: {
        term: "monster",
        typeId: 2,
        country: "Japão",
        demographics: "Seinen,Josei",
        genreIds: "7,9",
        sortBy: "title",
        order: "ASC",
        page: 2,
        limit: 24,
      },
    });
  });

  it("envia somente filtros editoriais ativos na vitrine de Edições", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { editions: [], pagination: {} } });

    await listPublicEditions({
      term: "Urasawa",
      brazilianPublisherId: 3,
      formatId: 4,
      coverTypeId: 5,
      sortBy: "chronologicalNumber",
      order: "DESC",
      page: 1,
      limit: 24,
    });

    expect(api.get).toHaveBeenCalledWith("/public/editions", {
      params: {
        term: "Urasawa",
        brazilianPublisherId: 3,
        formatId: 4,
        coverTypeId: 5,
        sortBy: "chronologicalNumber",
        order: "DESC",
        page: 1,
        limit: 24,
      },
    });
  });

  it("carrega as opções públicas sem depender das rotas administrativas", async () => {
    const options = { workTypes: [], countries: [], demographics: [], genres: [] };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { options } });

    await expect(getPublicCatalogOptions()).resolves.toEqual(options);
    expect(api.get).toHaveBeenCalledWith("/public/catalog-options");
  });

  it("carrega os detalhes públicos de uma Obra pelo slug estável", async () => {
    const work = { id: 1, slug: "monster", title: "Monster", editions: [] };
    vi.mocked(api.get).mockResolvedValueOnce({ data: { work } });

    await expect(getPublicWorkDetails("monster deluxe")).resolves.toEqual(work);
    expect(api.get).toHaveBeenCalledWith("/public/works/monster%20deluxe");
  });

  it("carrega a ficha da Edição e a página solicitada de Volumes", async () => {
    const data = {
      edition: { id: 20, chronologicalNumber: 1 },
      volumes: [],
      pagination: { page: 2, limit: 24, total: 25, totalPages: 2 },
    };
    vi.mocked(api.get).mockResolvedValueOnce({ data });

    await expect(getPublicEditionDetails(20, { page: 2, limit: 24 })).resolves.toEqual(data);
    expect(api.get).toHaveBeenCalledWith("/public/editions/20", {
      params: { page: 2, limit: 24 },
    });
  });
});
