import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "../../../support/queryRender";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import PublicAuthorWorks from "@/features/public-catalog/pages/PublicAuthorWorks";
import { getPublicAuthorWorks } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/auth", () => ({ useAuth: () => ({ user: null, loading: false }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicAuthorWorks: vi.fn(),
}));

const response = {
  author: { id: 5, label: "Naoki Urasawa" },
  works: [
    {
      id: 8,
      slug: "monster",
      title: "Monster",
      originalTitle: "MONSTER",
      coverUrl: "https://cdn.comanga.test/monster.jpg",
      type: { id: 2, label: "Mangá" },
      country: "Japão",
      authors: [{ id: 5, label: "Naoki Urasawa" }],
      authorRoles: ["História e Arte"],
    },
    {
      id: 9,
      slug: "pluto",
      title: "Pluto",
      originalTitle: null,
      coverUrl: null,
      type: { id: 2, label: "Mangá" },
      country: "Japão",
      authors: [{ id: 5, label: "Naoki Urasawa" }],
      authorRoles: ["Arte"],
    },
  ],
  pagination: { page: 1, limit: 24, total: 25, totalPages: 2 },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderPage(entry: string | { pathname: string; state: unknown } = "/autor/naoki-urasawa?page=1") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/autor/:authorSlug" element={<><PublicAuthorWorks /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicAuthorWorks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicAuthorWorks).mockResolvedValue(response);
  });

  it("exibe o Autor, a quantidade de obras publicadas no Brasil e seus papéis", async () => {
    renderPage();

    expect(screen.getByText("Carregando Obras do Autor...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Naoki Urasawa", level: 1 })).toBeInTheDocument();
    expect(getPublicAuthorWorks).toHaveBeenCalledWith("naoki-urasawa", {
      page: 1,
      limit: 24,
      sortBy: "title",
      order: "ASC",
    });
    expect(screen.getByText("25 obras publicadas no Brasil")).toBeInTheDocument();
    expect(screen.getByText("História e Arte")).toHaveClass("mt-1");
    expect(screen.getByText("Arte")).toBeInTheDocument();
    expect(screen.queryByText("Mangá · Japão")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes de Monster" })).toHaveAttribute("href", "/obra/monster");
    expect(screen.getByRole("link", { name: "Ver detalhes de Pluto" })).toHaveAttribute("href", "/obra/pluto");
    expect(screen.getByAltText("Capa de Monster")).toHaveAttribute("src", response.works[0].coverUrl);
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
  });

  it("pagina as Obras e preserva a página na URL", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Naoki Urasawa" });

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(getPublicAuthorWorks).toHaveBeenLastCalledWith("naoki-urasawa", {
      page: 2,
      limit: 24,
      sortBy: "title",
      order: "ASC",
    }));
    expect(new URLSearchParams(screen.getByTestId("location-search").textContent || "").get("page")).toBe("2");
  });

  it("mostra Coleção > Obra > Autor quando a navegação começou na coleção", async () => {
    renderPage({ pathname: "/autor/naoki-urasawa", state: { catalogOrigin: "collection", fromWork: { slug: "monster", title: "Monster" } } });
    await screen.findByRole("heading", { name: "Naoki Urasawa" });

    const path = screen.getByRole("navigation", { name: "Caminho de navegação" });
    expect(path).toHaveTextContent("ColeçãoMonsterNaoki Urasawa");
    expect(screen.getByRole("link", { name: "Coleção" })).toHaveAttribute("href", "/colecao");
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/obra/monster");
  });

  it("exibe estado vazio com retorno ao catálogo", async () => {
    vi.mocked(getPublicAuthorWorks).mockResolvedValue({
      ...response,
      works: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
    });
    renderPage();

    expect(await screen.findByText("Nenhuma obra pública disponível para este autor.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar" })).toHaveAttribute("href", "/pesquisa?tab=works&sortBy=title&order=ASC&page=1");
  });

  it("exibe erro seguro, permite tentar novamente e rejeita ID inválido localmente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Autor não encontrado." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(getPublicAuthorWorks)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(response);
    const { unmount } = renderPage();

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Autor não encontrado.", expect.any(Object)));
    const retry = vi.mocked(toast.error).mock.lastCall?.[1] as unknown as { action: { onClick: () => void } };
    retry.action.onClick();
    await waitFor(() => expect(getPublicAuthorWorks).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Naoki Urasawa" })).toBeInTheDocument();

    unmount();
    vi.clearAllMocks();
    renderPage("/autor/autor invalido");
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Autor não encontrado.", expect.any(Object)));
    expect(getPublicAuthorWorks).not.toHaveBeenCalled();
  });
});
