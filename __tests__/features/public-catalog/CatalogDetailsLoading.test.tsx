import { screen } from "@testing-library/react";
import { render } from "../../support/queryRender";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { CatalogDetailsLoading } from "@/features/public-catalog/CatalogDetailsLoading";
import { PersonalCatalogSession } from "@/features/public-catalog/PersonalCatalogSession";

vi.mock("@/features/auth", () => ({ useAuth: () => ({ loading: true }) }));

describe("placeholders das páginas de detalhes", () => {
  it("mantém os placeholders enquanto a sessão ainda está carregando", () => {
    render(<MemoryRouter><PersonalCatalogSession fallback={<CatalogDetailsLoading kind="work" />}><h1>Obra carregada</h1></PersonalCatalogSession></MemoryRouter>);

    expect(screen.getByRole("status", { name: "Carregando Obra..." })).toBeInTheDocument();
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
    expect(screen.queryByText("Carregando catálogo...")).not.toBeInTheDocument();
  });

  it.each([
    ["work", "Carregando Obra..."],
    ["edition", "Carregando edição..."],
    ["volume", "Carregando volume..."],
  ] as const)("anuncia o carregamento de %s mantendo Voltar disponível", (kind, label) => {
    const { container } = render(<MemoryRouter><CatalogDetailsLoading kind={kind} /></MemoryRouter>);

    expect(screen.getByRole("status", { name: label })).toHaveAttribute("aria-busy", "true");
    expect(screen.getByText(label)).toHaveClass("sr-only");
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toBeInTheDocument();
  });

  it.each([
    ["work", "/obra/monster", undefined, "/pesquisa"],
    ["edition", "/obra/monster/edicao/2", undefined, "/obra/monster"],
    ["volume", "/obra/monster/edicao/2/volume/1", undefined, "/obra/monster/edicao/2"],
    ["edition", "/colecao/monster/edicao/2", undefined, "/colecao"],
    ["volume", "/obra/monster/edicao/2/volume/1", { catalogOrigin: "checklist", returnTo: "/lancamentos?month=10&year=2026" }, "/lancamentos?month=10&year=2026"],
    ["volume", "/obra/monster/edicao/2/volume/1", { catalogOrigin: "wishlist", returnTo: "/desejos" }, "/desejos"],
  ] as const)("define o retorno de %s em %s antes dos dados", (kind, pathname, state, expected) => {
    render(<MemoryRouter initialEntries={[{ pathname, state }]}><Routes>
      <Route path="/:root/:slug/:section?/:editionNumber?/:volumeSection?/:volumeNumber?" element={<CatalogDetailsLoading kind={kind} />} />
    </Routes></MemoryRouter>);

    expect(screen.getByRole("link", { name: "Voltar" }).getAttribute("href")).toMatch(expected);
  });
});
