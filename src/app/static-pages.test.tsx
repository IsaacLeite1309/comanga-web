import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ChecklistPage, CollectionPage } from "@/features/collection";
import { WishlistPage } from "@/features/wishlist";
import { AuthPage } from "@/features/auth";
import { PublicCatalogPage } from "@/features/public-catalog";
import NotFound from "./NotFound";

vi.mock("@/features/auth/AuthCard", () => ({
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
    render(<ChecklistPage />);

    expect(screen.getByRole("heading", { name: "Seus Checklists" })).toBeInTheDocument();
  });

  it("renderiza a pagina de colecao", () => {
    render(<CollectionPage />);

    expect(screen.getByRole("heading", { name: "Sua Coleção" })).toBeInTheDocument();
  });

  it("renderiza a pagina de desejos", () => {
    render(<WishlistPage />);

    expect(screen.getByRole("heading", { name: "Lista de Desejos" })).toBeInTheDocument();
  });

  it("renderiza a pagina de pesquisa", () => {
    render(
      <MemoryRouter>
        <PublicCatalogPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("searchbox", { name: "Pesquisar no catálogo" })).toBeInTheDocument();
  });

  it("renderiza a pagina inicial com o card de autenticacao", () => {
    render(<AuthPage />);

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
