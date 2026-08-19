import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Checklist from "@/pages/Checklist";
import Colecao from "@/pages/Colecao";
import Desejos from "@/pages/Desejos";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import Pesquisa from "@/pages/Pesquisa";

vi.mock("@/components/AuthCard", () => ({
  AuthCard: () => <div>Cartão de autenticação</div>,
}));

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicCatalogOptions: vi.fn().mockResolvedValue({}),
  listPublicWorks: vi.fn().mockResolvedValue({
    works: [],
    pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
  }),
  listPublicEditions: vi.fn().mockResolvedValue({
    editions: [],
    pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
  }),
}));

describe("paginas estaticas", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renderiza a pagina de checklist", () => {
    render(<Checklist />);

    expect(screen.getByRole("heading", { name: "Seus Checklists" })).toBeInTheDocument();
  });

  it("renderiza a pagina de colecao", () => {
    render(<Colecao />);

    expect(screen.getByRole("heading", { name: "Sua Coleção" })).toBeInTheDocument();
  });

  it("renderiza a pagina de desejos", () => {
    render(<Desejos />);

    expect(screen.getByRole("heading", { name: "Lista de Desejos" })).toBeInTheDocument();
  });

  it("renderiza a pagina de pesquisa", () => {
    render(
      <MemoryRouter>
        <Pesquisa />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Pesquisar" })).toBeInTheDocument();
  });

  it("renderiza a pagina inicial com o card de autenticacao", () => {
    render(<Index />);

    expect(screen.getByText("Cartão de autenticação")).toBeInTheDocument();
  });

  it("renderiza a pagina 404 e registra a rota nao encontrada", () => {
    render(
      <MemoryRouter initialEntries={["/rota-inexistente"]}>
        <NotFound />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Return to Home" })).toHaveAttribute("href", "/");
    expect(console.error).toHaveBeenCalledWith(
      "404 Error: User attempted to access non-existent route:",
      "/rota-inexistente"
    );
  });
});
