import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Pesquisa from "./Pesquisa";
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
  workTypes: [
    { id: 1, label: "Mangá", countryIds: [10], countries: ["Japão"] },
    { id: 2, label: "Manhwa", countryIds: [11], countries: ["Coreia do Sul"] },
  ],
  countries: ["Japão", "Coreia do Sul"],
  demographics: ["Shonen", "Seinen"],
  genres: [{ id: 7, label: "Ação" }],
  originalPublishers: [{ id: 8, label: "Shueisha" }],
  serializationMagazines: [{ id: 9, label: "Weekly Shonen Jump" }],
  originalPublicationStatuses: ["Completa", "Em andamento", "Em hiato", "Cancelada"],
  brazilianPublishers: [{ id: 11, label: "Panini" }],
  brazilPublicationStatuses: ["Completa", "Em andamento", "Em hiato", "Cancelada"],
  formats: [{ id: 12, label: "13,7 × 20 cm" }],
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
      format: { id: 12, label: "13,7 × 20 cm" },
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

    expect(screen.queryByRole("heading", { name: "Pesquisar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Explore o catálogo completo de obras e edições")).not.toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
    expect(screen.queryByText("Naoki Urasawa")).not.toBeInTheDocument();
    expect(screen.getByText("Mangá · Japão")).toBeInTheDocument();
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

  it("atualiza os Tipos de Obra ao trocar o país de origem", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByLabelText("Tipo de Obra"));
    expect(screen.getByRole("button", { name: "Mangá" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manhwa" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });

    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));
    fireEvent.click(screen.getByLabelText("País de Origem"));
    fireEvent.click(screen.getByRole("button", { name: "Coreia do Sul" }));

    await waitFor(() => expect(currentParams().get("country")).toBe("Coreia do Sul"));
    fireEvent.click(screen.getByLabelText("Tipo de Obra"));
    expect(screen.getByRole("button", { name: "Manhwa" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mangá" })).not.toBeInTheDocument();
  });

  it("limpa o tipo incompatível na URL e na consulta ao mudar o país", async () => {
    renderCatalog("/pesquisa?tab=works&typeId=1&country=Japão&page=3");
    await screen.findByRole("heading", { name: "Monster" });
    vi.mocked(listPublicWorks).mockClear();

    fireEvent.click(screen.getByLabelText("País de Origem"));
    fireEvent.click(screen.getByRole("button", { name: "Coreia do Sul" }));

    await waitFor(() => expect(currentParams().get("country")).toBe("Coreia do Sul"));
    expect(currentParams().has("typeId")).toBe(false);
    expect(currentParams().get("page")).toBe("1");
    expect(screen.getByLabelText("Tipo de Obra")).toHaveTextContent("Todos");
    await waitFor(() => expect(listPublicWorks).toHaveBeenCalled());
    for (const [query] of vi.mocked(listPublicWorks).mock.calls) {
      expect(query).toMatchObject({ country: "Coreia do Sul", page: 1 });
      expect(query.typeId).toBeUndefined();
    }
  });

  it("preserva um tipo compatível ao trocar ou remover o país", async () => {
    vi.mocked(getPublicCatalogOptions).mockResolvedValue({ ...options, workTypes: [
      ...options.workTypes, { id: 3, label: "Novel", countries: ["Japão", "Coreia do Sul"], countryIds: [10, 11] },
    ] });
    renderCatalog("/pesquisa?tab=works&typeId=3&country=Japão");
    await screen.findByRole("heading", { name: "Monster" });
    fireEvent.click(screen.getByLabelText("País de Origem"));
    fireEvent.click(screen.getByRole("button", { name: "Coreia do Sul" }));
    await waitFor(() => expect(listPublicWorks).toHaveBeenLastCalledWith(
      expect.objectContaining({ typeId: 3, country: "Coreia do Sul", page: 1 }),
    ));
    expect(currentParams().get("typeId")).toBe("3");
    expect(screen.getByLabelText("Tipo de Obra")).toHaveTextContent("Novel");

    fireEvent.click(screen.getByRole("button", { name: "Limpar País de Origem" }));
    await waitFor(() => expect(currentParams().has("country")).toBe(false));
    expect(currentParams().get("typeId")).toBe("3");
    expect(vi.mocked(listPublicWorks).mock.lastCall?.[0].typeId).toBe(3);
    expect(vi.mocked(listPublicWorks).mock.lastCall?.[0].country).toBeUndefined();
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

  it("não repete a consulta em rerenders locais antes do debounce", async () => {
    renderCatalog("/pesquisa?tab=works&sortBy=title&order=ASC&page=1");
    await screen.findByRole("heading", { name: "Monster" });
    expect(listPublicWorks).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));
    expect(screen.getByRole("region", { name: "Filtros avançados" })).toBeInTheDocument();
    expect(listPublicWorks).toHaveBeenCalledTimes(1);

    fireEvent.change(screen.getByRole("searchbox", { name: /pesquisar no catálogo/i }), {
      target: { value: "Urasawa" },
    });
    expect(listPublicWorks).toHaveBeenCalledTimes(1);

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledTimes(2));
    expect(listPublicWorks).toHaveBeenLastCalledWith(expect.objectContaining({ term: "Urasawa" }));
  });

  it("oferece um botão branco para limpar a busca", async () => {
    renderCatalog("/pesquisa?term=Monster");
    await screen.findByRole("heading", { name: "Monster" });

    const clearButton = screen.getByRole("button", { name: "Limpar pesquisa" });
    expect(clearButton).toHaveClass("text-foreground");
    fireEvent.click(clearButton);

    await waitFor(() => expect(currentParams().has("term")).toBe(false));
  });

  it("restringe os Tipos de Obra ao país selecionado", async () => {
    renderCatalog("/pesquisa?tab=works&country=Coreia+do+Sul");
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByLabelText("Tipo de Obra"));

    expect(screen.getByRole("button", { name: "Manhwa" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Mangá" })).not.toBeInTheDocument();
  });

  it("oferece todos os Tipos de Obra quando nenhum país está selecionado", async () => {
    renderCatalog("/pesquisa?tab=works");
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByLabelText("Tipo de Obra"));

    expect(screen.getByRole("button", { name: "Mangá" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Manhwa" })).toBeInTheDocument();
  });

  it("apresenta gêneros e tipos de Edição na ordem recebida da API", async () => {
    vi.mocked(getPublicCatalogOptions).mockResolvedValue({
      ...options,
      genres: [
        { id: 30, label: "Aventura" },
        { id: 31, label: "Ação" },
        { id: 32, label: "Boys’ Love" },
      ],
    });
    renderCatalog("/pesquisa?tab=works");
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));
    fireEvent.click(screen.getByLabelText("Selecionar Gêneros"));

    const genreButtons = ["Aventura", "Ação", "Boys’ Love"].map(
      (label) => screen.getByRole("button", { name: label })
    );
    expect(genreButtons[0].compareDocumentPosition(genreButtons[1]))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(genreButtons[1].compareDocumentPosition(genreButtons[2]))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  it("combina filtros de Obra e os persiste na URL", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    expect(screen.getAllByText("Todos").length).toBeGreaterThanOrEqual(2);

    fireEvent.click(screen.getByLabelText("Tipo de Obra"));
    expect(screen.queryByPlaceholderText("Digite para buscar...")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Todos" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Mangá" }));
    expect(screen.getByRole("button", { name: "Limpar Tipo de Obra" })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("Status Original"));
    expect(screen.getByRole("button", { name: "Completo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelado" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Em andamento" }));
    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));
    fireEvent.click(screen.getByLabelText("País de Origem"));
    fireEvent.click(screen.getByRole("button", { name: "Japão" }));
    fireEvent.click(screen.getByLabelText("Editora original"));
    fireEvent.click(screen.getByRole("button", { name: "Shueisha" }));
    fireEvent.click(screen.getByLabelText("Pré-publicação"));
    fireEvent.click(screen.getByRole("button", { name: "Weekly Shonen Jump" }));
    fireEvent.click(screen.getByLabelText("Início da publicação original"));
    fireEvent.click(screen.getByRole("button", { name: "1999" }));
    fireEvent.click(screen.getByLabelText("Fim da publicação original"));
    fireEvent.click(screen.getByRole("button", { name: "2014" }));
    fireEvent.click(screen.getByLabelText("Selecionar Demografia"));
    fireEvent.click(screen.getByRole("button", { name: "Seinen" }));
    fireEvent.click(screen.getByLabelText("Selecionar Gêneros"));
    fireEvent.click(screen.getByRole("button", { name: "Ação" }));

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledWith(expect.objectContaining({
      typeId: 1,
      country: "Japão",
      demographics: ["Seinen"],
      genreIds: [7],
      originalPublisherId: 8,
      serializationMagazineId: 9,
      originalPublicationStatus: "Em andamento",
      originalPublicationStartYear: 1999,
      originalPublicationEndYear: 2014,
      page: 1,
    })));

    const params = currentParams();
    expect(params.get("typeId")).toBe("1");
    expect(params.get("country")).toBe("Japão");
    expect(params.get("demographics")).toBe("Seinen");
    expect(params.get("genreIds")).toBe("7");
    expect(params.get("originalPublisherId")).toBe("8");
    expect(params.get("serializationMagazineId")).toBe("9");
    expect(params.get("originalPublicationStatus")).toBe("Em andamento");
    expect(params.get("originalPublicationStartYear")).toBe("1999");
    expect(params.get("originalPublicationEndYear")).toBe("2014");
  });

  it("limpa filtros simples e múltiplos pelo botão X sem afetar a ordenação", async () => {
    renderCatalog("/pesquisa?tab=works&typeId=1&demographics=Seinen&sortBy=title&order=ASC&page=1");
    await screen.findByRole("heading", { name: "Monster" });

    expect(screen.queryByRole("button", { name: "Limpar Título" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Limpar Tipo de Obra" }));
    fireEvent.click(screen.getByRole("button", { name: "Limpar Demografia" }));

    await waitFor(() => {
      const params = currentParams();
      expect(params.has("typeId")).toBe(false);
      expect(params.has("demographics")).toBe(false);
      expect(params.get("sortBy")).toBe("title");
      expect(params.get("order")).toBe("ASC");
    });
  });

  it("desmarca um filtro simples ao selecionar novamente a opção ativa", async () => {
    renderCatalog("/pesquisa?tab=works&typeId=1&sortBy=title&order=ASC&page=1");
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByRole("button", { name: "Tipo de Obra" }));
    fireEvent.click(screen.getByRole("button", { name: "Mangá" }));

    await waitFor(() => {
      expect(currentParams().has("typeId")).toBe(false);
    });
    expect(screen.getAllByText("Todos").length).toBeGreaterThan(0);
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

  it("fecha os filtros avançados ao clicar fora do painel", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));
    expect(screen.getByRole("region", { name: "Filtros avançados" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByLabelText("País de Origem"));
    expect(screen.getByRole("region", { name: "Filtros avançados" })).toBeInTheDocument();

    fireEvent.pointerDown(screen.getByRole("searchbox", { name: /pesquisar no catálogo/i }));
    expect(screen.queryByRole("region", { name: "Filtros avançados" })).not.toBeInTheDocument();
  });

  it("fecha os filtros avançados ao clicar novamente no botão", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    const filtersButton = screen.getByRole("button", { name: /filtros avançados/i });
    fireEvent.click(filtersButton);
    expect(screen.getByRole("region", { name: "Filtros avançados" })).toBeInTheDocument();

    fireEvent.pointerDown(filtersButton);
    fireEvent.click(filtersButton);
    expect(screen.queryByRole("region", { name: "Filtros avançados" })).not.toBeInTheDocument();
  });

  it("mostra metadados editoriais e substitui capa inválida pelo fallback", async () => {
    renderCatalog("/pesquisa?tab=editions&term=monster&sortBy=title&order=ASC&page=1");

    expect(await screen.findByText("2ª edição · Panini")).toBeInTheDocument();
    expect(screen.queryByText("3 Volumes")).not.toBeInTheDocument();
    expect(screen.queryByText("13,7 × 20 cm · Brochura")).not.toBeInTheDocument();
    expect(screen.getByText("1 edição encontrada")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes da 2ª edição de Monster" })).toHaveAttribute("href", "/obras/monster/edicao/20");

    fireEvent.error(screen.getByAltText("Capa da 2ª edição de Monster"));
    // A capa da Edição vem do Volume 1: quando falta, o estado vazio é explícito.
    expect(screen.getByText("Capa indisponível")).toBeInTheDocument();
  });

  it("aplica os filtros próprios da vitrine de Edições", async () => {
    renderCatalog("/pesquisa?tab=editions");
    await screen.findByText("2ª edição · Panini");

    fireEvent.click(screen.getByLabelText("Editora brasileira"));
    fireEvent.click(screen.getByRole("button", { name: "Panini" }));
    fireEvent.click(screen.getByLabelText("Status no Brasil"));
    expect(screen.getByRole("button", { name: "Completo" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancelado" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Em hiato" }));
    fireEvent.click(screen.getByRole("button", { name: /filtros avançados/i }));
    fireEvent.click(screen.getByLabelText("Número da edição"));
    fireEvent.click(screen.getByRole("button", { name: "2ª edição" }));
    fireEvent.click(screen.getByLabelText("Acabamento"));
    fireEvent.click(screen.getByRole("button", { name: "Brochura" }));
    fireEvent.click(screen.getByLabelText("Formato"));
    fireEvent.click(screen.getByRole("button", { name: "13,7 × 20 cm" }));
    fireEvent.click(screen.getByLabelText("Início da publicação no Brasil"));
    fireEvent.click(screen.getByRole("button", { name: "2020" }));
    fireEvent.click(screen.getByLabelText("Fim da publicação no Brasil"));
    fireEvent.click(screen.getByRole("button", { name: "2024" }));
    await waitFor(() => expect(listPublicEditions).toHaveBeenCalledWith(expect.objectContaining({
      brazilianPublisherId: 11,
      formatId: 12,
      coverTypeId: 13,
      chronologicalNumber: 2,
      brazilPublicationStatus: "Em hiato",
      brazilPublicationStartYear: 2020,
      brazilPublicationEndYear: 2024,
      page: 1,
    })));

    const params = currentParams();
    expect(params.get("brazilianPublisherId")).toBe("11");
    expect(params.get("formatId")).toBe("12");
    expect(params.get("coverTypeId")).toBe("13");
    expect(params.get("chronologicalNumber")).toBe("2");
    expect(params.get("brazilPublicationStatus")).toBe("Em hiato");
    expect(params.get("brazilPublicationStartYear")).toBe("2020");
    expect(params.get("brazilPublicationEndYear")).toBe("2024");
  });

  it("preserva a ordenação escolhida na URL", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    fireEvent.click(screen.getByRole("button", { name: "Ordenar por título de Z a A" }));

    await waitFor(() => expect(listPublicWorks).toHaveBeenCalledWith(expect.objectContaining({
      sortBy: "title",
      order: "DESC",
      page: 1,
    })));
    expect(currentParams().get("sortBy")).toBe("title");
    expect(currentParams().get("order")).toBe("DESC");
  });

  it("mantém resultados e barra visíveis enquanto altera somente a ordenação", async () => {
    renderCatalog();
    await screen.findByRole("heading", { name: "Monster" });

    let resolveSort!: (value: typeof worksResponse) => void;
    vi.mocked(listPublicWorks).mockImplementationOnce(() => new Promise((resolve) => {
      resolveSort = resolve;
    }));

    fireEvent.click(screen.getByRole("button", { name: "Ordenar por título de Z a A" }));

    expect(screen.getByText("1 obra encontrada")).toBeInTheDocument();
    expect(screen.getByText("Título")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Monster" })).toBeInTheDocument();
    expect(screen.queryByText("Carregando Obras...")).not.toBeInTheDocument();

    await act(async () => resolveSort(worksResponse));
  });

  it("exibe loading, erro recuperável e tenta carregar novamente", async () => {
    let rejectRequest!: (reason?: unknown) => void;
    vi.mocked(listPublicWorks).mockImplementationOnce(() => new Promise((_resolve, reject) => {
      rejectRequest = reject;
    }));

    renderCatalog();
    expect(screen.getByText("Carregando Obras...")).toBeInTheDocument();
    expect(screen.getByTestId("results-divider")).toBeInTheDocument();
    expect(screen.queryByText("1 obra encontrada")).not.toBeInTheDocument();
    expect(screen.queryByText("Título")).not.toBeInTheDocument();

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
