const lastCatalogPaths = {
  search: "/pesquisa?tab=works&sortBy=title&order=ASC&page=1",
  checklist: "/lancamentos",
};

export function lastCatalogPath(pathname: "/pesquisa" | "/lancamentos") {
  return pathname === "/pesquisa" ? lastCatalogPaths.search : lastCatalogPaths.checklist;
}

export function rememberCatalogPath(pathname: string, search: string) {
  if (pathname === "/pesquisa") lastCatalogPaths.search = `${pathname}${search}`;
  if (pathname === "/lancamentos") lastCatalogPaths.checklist = `${pathname}${search}`;
}
