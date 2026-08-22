import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicEditionDetails from "@/pages/PublicEditionDetails";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicEditionDetails: vi.fn(),
}));

const response = {
  edition: {
    id: 20,
    chronologicalNumber: 2,
    coverUrl: "https://cdn.comanga.test/monster-edition.jpg",
    brazilianPublisher: { id: 1, label: "Panini" },
    editionType: { id: 2, label: "Deluxe" },
    format: { id: 3, label: "Kanzenban" },
    coverType: { id: 4, label: "Capa dura" },
    brazilPublicationStatus: "Em publicação",
    volumesCount: 25,
    work: {
      id: 8,
      slug: "monster",
      title: "Monster",
      originalTitle: "MONSTER",
      authors: [{ id: 5, label: "Naoki Urasawa" }],
    },
  },
  volumes: [
    {
      id: 30,
      number: 1,
      singleVolume: false,
      coverUrl: "https://cdn.comanga.test/monster-volume-1.jpg",
      pages: 416,
      releaseDatePrecision: "Completa",
      releaseYear: 2026,
      releaseMonth: 8,
      releaseDay: 20,
    },
    {
      id: 31,
      number: 2,
      singleVolume: false,
      coverUrl: null,
      pages: null,
      releaseDatePrecision: "Ano",
      releaseYear: 2027,
      releaseMonth: null,
      releaseDay: null,
    },
  ],
  pagination: { page: 1, limit: 24, total: 25, totalPages: 2 },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderPage(entry = "/edicoes/20?page=1") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/edicoes/:editionId" element={<><PublicEditionDetails /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicEditionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicEditionDetails).mockResolvedValue(response);
  });

  it("exibe a ficha editorial, a capa 2:3 e o vínculo contextual com a Obra", async () => {
    renderPage();

    expect(screen.getByText("Carregando Edição...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Monster — 2ª Edição", level: 1 })).toBeInTheDocument();
    expect(getPublicEditionDetails).toHaveBeenCalledWith(20, { page: 1, limit: 24 });
    expect(screen.getByText("MONSTER")).toBeInTheDocument();
    expect(screen.getByText("Naoki Urasawa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver Obras de Naoki Urasawa" })).toHaveAttribute("href", "/autores/5");
    expect(screen.getByText("Panini")).toBeInTheDocument();
    expect(screen.getByText("Deluxe")).toBeInTheDocument();
    expect(screen.getByText("Kanzenban")).toBeInTheDocument();
    expect(screen.getByText("Capa dura")).toBeInTheDocument();
    expect(screen.getByText("Em publicação")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes de Monster" })).toHaveAttribute("href", "/obras/monster");

    const cover = screen.getByAltText("Capa da 2ª Edição de Monster");
    expect(cover).toHaveAttribute("src", response.edition.coverUrl);
    expect(cover.parentElement).toHaveClass("aspect-[2/3]");
  });

  it("lista os Volumes em ordem recebida com data, páginas, fallback e acesso ao detalhe", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Volumes" });

    const headings = screen.getAllByRole("heading", { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["Volume 1", "Volume 2"]);
    expect(screen.getByText("20/08/2026")).toBeInTheDocument();
    expect(screen.getByText("416 páginas")).toBeInTheDocument();
    expect(screen.getByText("2027")).toBeInTheDocument();
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes do Volume 1" })).toHaveAttribute("href", "/volumes/30");
    expect(screen.getByRole("link", { name: "Ver detalhes do Volume 2" })).toHaveAttribute("href", "/volumes/31");
  });

  it("pagina os Volumes e preserva a página na URL", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Volumes" });

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(getPublicEditionDetails).toHaveBeenLastCalledWith(20, {
      page: 2,
      limit: 24,
    }));
    expect(new URLSearchParams(screen.getByTestId("location-search").textContent || "").get("page")).toBe("2");
  });

  it("exibe estado vazio quando não existem Volumes públicos", async () => {
    vi.mocked(getPublicEditionDetails).mockResolvedValue({
      ...response,
      volumes: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
      edition: { ...response.edition, volumesCount: 0 },
    });
    renderPage();

    expect(await screen.findByText("Nenhum Volume público cadastrado nesta Edição.")).toBeInTheDocument();
  });

  it("exibe erro seguro e permite tentar novamente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Edição não encontrada." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: {} },
    });
    vi.mocked(getPublicEditionDetails)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(response);
    renderPage();

    expect(await screen.findByText("Edição não encontrada.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(getPublicEditionDetails).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Monster — 2ª Edição" })).toBeInTheDocument();
  });
});
