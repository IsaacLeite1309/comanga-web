// Paginação das listas administrativas hierárquicas (Edições de uma Obra e Volumes de uma Edição).
// O tamanho de página vive aqui para não espalhar limites fixos pelos hooks e componentes.
// A API aceita no máximo 50 itens por página nesses endpoints.
export const EDITIONS_PAGE_SIZE = 8;
export const VOLUMES_PAGE_SIZE = 8;

// Ordens fixadas pelo requisito: Edições em ordem decrescente e Volumes em ordem crescente.
export const EDITIONS_LIST_ORDER = "DESC";
export const VOLUMES_LIST_ORDER = "ASC";

export interface CatalogPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function emptyCatalogPagination(limit: number): CatalogPagination {
  return { page: 1, limit, total: 0, totalPages: 0 };
}

// A API devolve `totalPages = 0` quando não há registros; a navegação sempre exibe ao menos uma página.
export function navigablePages(totalPages: number) {
  return Math.max(totalPages, 1);
}

// Protege a interface de respostas sem os metadados esperados, sem inventar registros.
export function normalizeCatalogPagination(
  received: Partial<CatalogPagination> | undefined | null,
  requestedPage: number,
  limit: number,
  receivedCount: number,
): CatalogPagination {
  const total = Number.isFinite(received?.total) ? Number(received?.total) : receivedCount;
  const totalPages = Number.isFinite(received?.totalPages)
    ? Number(received?.totalPages)
    : Math.ceil(total / limit);

  return {
    page: Number.isFinite(received?.page) ? Number(received?.page) : requestedPage,
    limit: Number.isFinite(received?.limit) ? Number(received?.limit) : limit,
    total,
    totalPages,
  };
}

// Página que continua existindo depois de excluir um registro da página atual.
export function pageAfterRemoval(currentPage: number, total: number, limit: number) {
  const remaining = Math.max(total - 1, 0);
  return Math.min(currentPage, navigablePages(Math.ceil(remaining / limit)));
}

// Guarda somente a página, sem dados do catálogo, durante a navegação nesta aba.
const rememberedPages = new Map<string, number>();

export function readCatalogPage(key: string) {
  return rememberedPages.get(key) ?? 1;
}

export function rememberCatalogPage(key: string, page: number) {
  rememberedPages.set(key, page);
}

export function resetCatalogPagesForTests() {
  rememberedPages.clear();
}
