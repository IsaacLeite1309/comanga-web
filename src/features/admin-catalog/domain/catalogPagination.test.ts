import { afterEach, describe, expect, it, vi } from "vitest";
import {
  EDITIONS_PAGE_SIZE,
  VOLUMES_PAGE_SIZE,
  emptyCatalogPagination,
  navigablePages,
  normalizeCatalogPagination,
  pageAfterRemoval,
} from "./catalogPagination";

describe("catalogPagination", () => {
  afterEach(() => { sessionStorage.clear(); vi.restoreAllMocks(); });

  it("restaura a página após recarregar o módulo sem misturar Obras e Edições", async () => {
    const beforeReload = await import("./catalogPagination");
    beforeReload.rememberCatalogPage("work:40:editions", 3);
    vi.resetModules();
    const afterReload = await import("./catalogPagination");
    expect(afterReload.readCatalogPage("work:40:editions")).toBe(3);
    expect(afterReload.readCatalogPage("edition:40:volumes")).toBe(1);
  });

  it("continua navegável se o armazenamento da aba estiver bloqueado", async () => {
    const pages = await import("./catalogPagination");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("Bloqueado"); });
    pages.rememberCatalogPage("work:50:editions", 2);
    expect(pages.readCatalogPage("work:50:editions")).toBe(2);
  });
  it("usa tamanhos de página explícitos e dentro do limite aceito pela API", () => {
    expect(EDITIONS_PAGE_SIZE).toBeGreaterThan(0);
    expect(VOLUMES_PAGE_SIZE).toBeGreaterThan(0);
    expect(EDITIONS_PAGE_SIZE).toBeLessThanOrEqual(50);
    expect(VOLUMES_PAGE_SIZE).toBeLessThanOrEqual(50);
  });

  it("começa vazio sem páginas navegáveis calculadas pela API", () => {
    expect(emptyCatalogPagination(8)).toEqual({ page: 1, limit: 8, total: 0, totalPages: 0 });
  });

  it("apresenta ao menos uma página quando a API devolve totalPages igual a zero", () => {
    expect(navigablePages(0)).toBe(1);
    expect(navigablePages(3)).toBe(3);
  });

  it("preserva os metadados devolvidos pela API", () => {
    const pagination = normalizeCatalogPagination(
      { page: 2, limit: 8, total: 9, totalPages: 2 },
      2,
      8,
      1,
    );

    expect(pagination).toEqual({ page: 2, limit: 8, total: 9, totalPages: 2 });
  });

  it("reconstrói metadados ausentes a partir da requisição e dos itens recebidos", () => {
    expect(normalizeCatalogPagination(undefined, 3, 8, 5)).toEqual({
      page: 3,
      limit: 8,
      total: 5,
      totalPages: 1,
    });
  });

  it("recalcula totalPages quando a API omite apenas esse metadado", () => {
    expect(normalizeCatalogPagination({ page: 1, limit: 8, total: 17 }, 1, 8, 8)).toEqual({
      page: 1,
      limit: 8,
      total: 17,
      totalPages: 3,
    });
  });

  it("mantém a página atual quando ela continua válida após remover um registro", () => {
    expect(pageAfterRemoval(2, 12, 8)).toBe(2);
  });

  it("volta para a última página válida ao remover o único registro da página final", () => {
    expect(pageAfterRemoval(2, 9, 8)).toBe(1);
  });

  it("nunca devolve uma página menor que a primeira quando a lista fica vazia", () => {
    expect(pageAfterRemoval(1, 1, 8)).toBe(1);
    expect(pageAfterRemoval(1, 0, 8)).toBe(1);
  });
});
