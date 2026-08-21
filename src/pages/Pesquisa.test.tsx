import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pesquisa from "@/pages/Pesquisa";
import {
  getPublicCatalogOptions,
  listPublicEditions,
  listPublicWorks,
} from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicCatalogOptions: vi.fn(),
  listPublicWorks: vi.fn(),
  listPublicEditions: vi.fn(),
}));

const options = {
  workTypes: [{ id: 1, label: "Mangá" }],
  countries: ["Japão", "Coreia do Sul"],
  demographics: ["Shonen", "Seinen"],
  genres: [{ id: 7, label: "Ação" }],
  brazilianPublishers: [{ id: 11, label: "Panini" }],
  formats: [{ id: 12, label: "Tankobon" }],
  coverTypes: [{ id: 13, label: "Brochura" }],
};

const worksResponse = {
  works: [
    {
      id: 1,
      slug: "monster",
      title: "Monster",
      originalTitle: "MONSTER",
      coverUrl: "https://cdn.comanga.test/monster.jpg",
      type: { id: 1, label: "Mangá" },
      country: "Japão",
      authors: [{ id: 4, label: "Naoki Urasawa" }],
    },
  ],
  pagination: { page: 1, limit: 24, total: 1, totalPages: 1 },
};

const editionsResponse = {
  editions: [
    {
      id: 20,
      chronologicalNumber: 2,
      coverUrl: "https://cdn.comanga.test/monster-edition.jpg",
      work: {
        id: 1,
        slug: "monster",
        title: "Monster",
        originalTitle: "MONSTER",
        authors: [{ id: 4, label: "Naoki Urasawa" }],
      },
      brazilianPublisher: { id: 11, label: "Panini" },
      format: { id: 12, label: "Tankobon" },
      coverType: { id: 13, label: "Brochura" },
      volumesCount: 3,
    },
  ],
  pagination: { page: 1, limit: 24, total: 1, totalPages: 1 },
};

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderCatalog(entry = "/pesquisa") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/pesquisa"
          element={
            <>
              <Pesquisa />
              <LocationProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function currentParams() {
  return new URLSearchParams(screen.getByTestId("location-search").textContent || "");
}

describe("Pesquisa", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicCatalogOptions).mockResolvedValue(options);
    vi.mocked(listPublicWorks).mockResolvedValue(worksResponse);
    vi.mocked(listPublicEditions).mockResolvedValue(editionsResponse);
  });

  it("registra aba, ordenação e página padrão na URL", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" }, { timeout: 5000 });

    await waitFor(() => {
      const params = currentParams();
      expect(params.get("tab")).toBe("works");
      expect(params.get("sortBy")).toBe("title");
      expect(params.get("order")).toBe("ASC");
      expect(params.get("page")).toBe("1");
    });
  });

  it("abre a vitrine pública de Obras a partir da URL e renderiza capas 2:3", async () => {
    renderCatalog("/pesquisa?tab=works&term=monster&sortBy=title&order=ASC&page=1");

    expect(screen.getByRole("heading", { name: "Pesquisar" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
    expect(screen.getByText("Naoki Urasawa")).toBeInTheDocument();
    expect(screen.getByText("1 obra encontrada")).toBeInTheDocument();

    const cover = screen.getByAltText("Capa de Monster");
    expect(cover).toHaveAttribute("src", worksResponse.works[0].coverUrl);
    expect(cover).toHaveAttribute("loading", "lazy");
    expect(cover.parentElement).toHaveClass("aspect-[2/3]");
    expect(screen.getByRole("link", { name: "Ver detalhes de Monster" })).toHaveAttribute(
      "href",
      "/obras/monster",
    );
    expect(listPublicWorks).toHaveBeenCalledWith(expect.objectContaining({
      term: "monster",
      sortBy: "title",
      order: "ASC",
      page: 1,
      limit: 24,
    }));
  });

  it("aplica debounce à busca e reflete o termo na URL", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });
    vi.mocked(listPublicWorks).mockClear();

    fireEvent.change(screen.getByRole("searchbox", { name: /pesquisar no catálogo/i }), {
      target: { value: "Urasawa" },
    });

    expect(listPublicWorks).not.toHaveBeenCalled();

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledWith(
      expect.objectContaining({ term: "Urasawa", page: 1 }),
    ));
    expect(currentParams().get("term")).toBe("Urasawa");
  });

  it("combina filtros de Obra e os persiste na URL", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });
    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));

    fireEvent.click(screen.getByLabelText("Tipo"));
    fireEvent.click(screen.getByRole("button", { name: "Mangá" }));
    fireEvent.click(screen.getByLabelText("País"));
    fireEvent.click(screen.getByRole("button", { name: "Japão" }));
    fireEvent.click(screen.getByLabelText("Selecionar Demografias"));
    fireEvent.click(screen.getByRole("button", { name: "Seinen" }));
    fireEvent.click(screen.getByLabelText("Selecionar Gêneros"));
    fireEvent.click(screen.getByRole("button", { name: "Ação" }));

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledWith(expect.objectContaining({
      typeId: 1,
      country: "Japão",
      demographics: ["Seinen"],
      genreIds: [7],
      page: 1,
    })));

    const params = currentParams();
    expect(params.get("typeId")).toBe("1");
    expect(params.get("country")).toBe("Japão");
    expect(params.get("demographics")).toBe("Seinen");
    expect(params.get("genreIds")).toBe("7");
  });

  it("preserva o termo e a ordenação compatível ao alternar para Edições", async () => {
    renderCatalog(
      "/pesquisa?tab=works&term=monster&typeId=1&country=Jap%C3%A3o&demographics=Seinen&genreIds=7&sortBy=title&order=DESC&page=3",
    );
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByRole("tab", { name: "Edições" }));

    await waitFor(() => expect(listPublicEditions).toHaveBeenCalledWith(expect.objectContaining({
      term: "monster",
      sortBy: "title",
      order: "DESC",
      page: 1,
    })));

    const params = currentParams();
    expect(params.get("tab")).toBe("editions");
    expect(params.get("term")).toBe("monster");
    expect(params.get("sortBy")).toBe("title");
    expect(params.get("order")).toBe("DESC");
    expect(params.get("page")).toBe("1");
    ["typeId", "country", "demographics", "genreIds"].forEach((key) => {
      expect(params.has(key)).toBe(false);
    });
  });

  it("mostra metadados editoriais e substitui capa inválida pelo fallback", async () => {
    renderCatalog("/pesquisa?tab=editions&term=monster&sortBy=title&order=ASC&page=1");

    expect(await screen.findByText("2ª Edição")).toBeInTheDocument();
    expect(screen.getByText("Panini")).toBeInTheDocument();
    expect(screen.getByText("3 Volumes")).toBeInTheDocument();
    expect(screen.getByText("1 edição encontrada")).toBeInTheDocument();

    fireEvent.error(screen.getByAltText("Capa da 2ª Edição de Monster"));
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
  });

  it("aplica os filtros próprios da vitrine de Edições", async () => {
    renderCatalog("/pesquisa?tab=editions");
    await screen.findByText("2ª Edição");
    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));

    fireEvent.click(screen.getByLabelText("Editora brasileira"));
    fireEvent.click(screen.getByRole("button", { name: "Panini" }));
    fireEvent.click(screen.getByLabelText("Formato"));
    fireEvent.click(screen.getByRole("button", { name: "Tankobon" }));
    fireEvent.click(screen.getByLabelText("Acabamento"));
    fireEvent.click(screen.getByRole("button", { name: "Brochura" }));

    await waitFor(() => expect(listPublicEditions).toHaveBeenCalledWith(expect.objectContaining({
      brazilianPublisherId: 11,
      formatId: 12,
      coverTypeId: 13,
      page: 1,
    })));

    const params = currentParams();
    expect(params.get("brazilianPublisherId")).toBe("11");
    expect(params.get("formatId")).toBe("12");
    expect(params.get("coverTypeId")).toBe("13");
  });

  it("preserva a ordenação escolhida na URL", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.change(screen.getByLabelText("Ordenar resultados"), {
      target: { value: "createdAt:DESC" },
    });

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledWith(expect.objectContaining({
      sortBy: "createdAt",
      order: "DESC",
      page: 1,
    })));
    expect(currentParams().get("sortBy")).toBe("createdAt");
    expect(currentParams().get("order")).toBe("DESC");
  });

  it("exibe loading, erro recuperável e tenta carregar novamente", async () => {
    let rejectRequest!: (reason?: unknown) => void;
    vi.mocked(listPublicWorks).mockImplementationOnce(() => new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }));

    renderCatalog();
    expect(screen.getByText("Carregando Obras...")).toBeInTheDocument();

    await act(async () => rejectRequest(new Error("indisponível")));
    expect(await screen.findByText("Não foi possível carregar as Obras.")).toBeInTheDocument();

    vi.mocked(listPublicWorks).mockResolvedValueOnce(worksResponse);
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
  });

  it("oferece limpar filtros no estado vazio", async () => {
    vi.mocked(listPublicWorks).mockResolvedValue({
      works: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 1 },
    });
    renderCatalog("/pesquisa?tab=works&term=inexistente&typeId=1&page=1");

    expect(await screen.findByText("Nenhuma Obra encontrada.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));

    await waitFor(() => {
      expect(currentParams().has("term")).toBe(false);
      expect(currentParams().has("typeId")).toBe(false);
    });
    expect(screen.getByRole("searchbox", { name: /pesquisar no catálogo/i })).toHaveValue("");
  });

  it("pagina resultados e mantém a página ativa na URL", async () => {
    vi.mocked(listPublicWorks).mockResolvedValue({
      ...worksResponse,
      pagination: { page: 1, limit: 24, total: 25, totalPages: 2 },
    });
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2 }),
    ));
    expect(currentParams().get("page")).toBe("2");
  });
});
