import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicAuthorWorks from "@/pages/PublicAuthorWorks";
import { getPublicAuthorWorks } from "@/features/public-catalog/publicCatalogService";

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
    },
  ],
  pagination: { page: 1, limit: 24, total: 25, totalPages: 2 },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderPage(entry = "/autores/5?page=1") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/autores/:authorId" element={<><PublicAuthorWorks /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicAuthorWorks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicAuthorWorks).mockResolvedValue(response);
  });

  it("exibe o Autor e reutiliza a grade pública de Obras", async () => {
    renderPage();

    expect(screen.getByText("Carregando Obras do Autor...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Mangás de Naoki Urasawa", level: 1 })).toBeInTheDocument();
    expect(getPublicAuthorWorks).toHaveBeenCalledWith(5, {
      page: 1,
      limit: 24,
      sortBy: "title",
      order: "ASC",
    });
    expect(screen.getByText("25 obras públicas")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes de Monster" })).toHaveAttribute("href", "/obras/monster");
    expect(screen.getByRole("link", { name: "Ver detalhes de Pluto" })).toHaveAttribute("href", "/obras/pluto");
    expect(screen.getByAltText("Capa de Monster")).toHaveAttribute("src", response.works[0].coverUrl);
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
  });

  it("pagina as Obras e preserva a página na URL", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Mangás de Naoki Urasawa" });

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(getPublicAuthorWorks).toHaveBeenLastCalledWith(5, {
      page: 2,
      limit: 24,
      sortBy: "title",
      order: "ASC",
    }));
    expect(new URLSearchParams(screen.getByTestId("location-search").textContent || "").get("page")).toBe("2");
  });

  it("exibe estado vazio com retorno ao catálogo", async () => {
    vi.mocked(getPublicAuthorWorks).mockResolvedValue({
      ...response,
      works: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
    });
    renderPage();

    expect(await screen.findByText("Nenhuma Obra pública disponível para este Autor.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Voltar ao catálogo" })).toHaveAttribute("href", "/pesquisa?tab=works&sortBy=title&order=ASC&page=1");
  });

  it("exibe erro seguro, permite tentar novamente e rejeita ID inválido localmente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Autor não encontrado." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: {} },
    });
    vi.mocked(getPublicAuthorWorks)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(response);
    const { unmount } = renderPage();

    expect(await screen.findByText("Autor não encontrado.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(getPublicAuthorWorks).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Mangás de Naoki Urasawa" })).toBeInTheDocument();

    unmount();
    vi.clearAllMocks();
    renderPage("/autores/invalido");
    expect(await screen.findByText("Autor não encontrado.")).toBeInTheDocument();
    expect(getPublicAuthorWorks).not.toHaveBeenCalled();
  });
});
