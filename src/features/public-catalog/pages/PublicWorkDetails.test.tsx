import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError, AxiosHeaders } from "axios";
import PublicWorkDetails from "./PublicWorkDetails";
import { getPublicWorkDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/auth", () => ({ useAuth: () => ({ user: null, loading: false }) }));

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicWorkDetails: vi.fn(),
}));

const work = {
  id: 1,
  slug: "monster",
  title: "Monster",
  originalTitle: "MONSTER",
  romanizedTitle: "Monsutā",
  coverUrl: "https://cdn.comanga.test/monster.jpg",
  type: { id: 2, label: "Mangá" },
  country: "Japão",
  originalPublicationStartYear: 1994,
  originalPublicationEndYear: 2001,
  directRelease: false,
  originalPublicationStatus: "Finalizada",
  synopsis: "A sinopse canônica da Obra.",
  authors: [{ id: 3, label: "Naoki Urasawa", slug: "naoki-urasawa", roles: ["Roteiro", "Arte"] }],
  genres: [{ id: 4, label: "Suspense" }],
  demographics: ["Seinen"],
  serializationMagazines: [{ id: 5, label: "Big Comic Original" }],
  originalPublishers: [{ id: 6, label: "Shogakukan" }],
  editions: [
    {
      id: 20,
      chronologicalNumber: 1,
      coverUrl: "https://cdn.comanga.test/monster-edition.jpg",
      brazilianPublisher: { id: 7, label: "Panini" },
      format: { id: 9, label: "Tankobon" },
      coverType: { id: 10, label: "Brochura" },
      brazilPublicationStatus: "Em publicação",
      volumesCount: 9,
      volumes: [
        {
          id: 30,
          number: 1,
          singleVolume: false,
          coverUrl: "https://cdn.comanga.test/monster-volume-1.jpg",
          releaseDatePrecision: "Completa",
          releaseYear: 2024,
          releaseMonth: 5,
          releaseDay: 15,
        },
      ],
    },
  ],
};

it("não exibe contadores pessoais nem etiquetas de leitura na Obra", async () => {
  vi.mocked(getPublicWorkDetails).mockResolvedValue({
    ...work,
    personal: { ownedCount: 1, readCount: 1, wishedCount: 0 },
    editions: work.editions.map(edition => ({
      ...edition,
      personal: { ownedCount: 1, readCount: 1, wishedCount: 0 },
      volumes: edition.volumes.map(volume => ({ ...volume, personal: { owned: true, read: true, wished: false } })),
    })),
  });
  renderPage();
  expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
  expect(screen.queryByText("Na coleção · Lido")).not.toBeInTheDocument();
  expect(screen.queryByText(/Sua coleção:|Lidos:|Desejados:/)).not.toBeInTheDocument();
  const preview = screen.getByRole("link", { name: "Ver detalhes do Volume 1 (na coleção)" });
  const ownedBadge = within(preview).getByTitle("Na coleção");
  const readBadge = within(preview).getByTitle("Lido");
  expect(ownedBadge.parentElement).toBe(readBadge.parentElement);
  expect(ownedBadge.parentElement).toHaveClass("flex", "gap-1", "-left-1");
  expect(ownedBadge).toHaveClass("h-6", "w-6");
  expect(readBadge).toHaveClass("h-6", "w-6");
  expect(readBadge.querySelector("svg")).toHaveClass("lucide-eye");
});

it("marca a capa desejada na prévia da Obra", async () => {
  vi.mocked(getPublicWorkDetails).mockResolvedValue({
    ...work,
    editions: work.editions.map(edition => ({
      ...edition,
      volumes: edition.volumes.map(volume => ({ ...volume, personal: { owned: false, read: null, wished: true } })),
    })),
  });
  renderPage();
  const preview = await screen.findByRole("link", { name: "Ver detalhes do Volume 1 (na lista de desejos)" });
  expect(within(preview).getByTitle("Na lista de desejos")).toHaveClass("-left-1", "h-6", "w-6");
  expect(screen.queryByTitle("Na coleção")).not.toBeInTheDocument();
});

function renderPage(slug = "monster") {
  return render(
    <MemoryRouter initialEntries={[`/obra/${slug}`]}>
      <Routes>
        <Route path="/obra/:slug" element={<PublicWorkDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

function AuthorContextProbe() {
  const { state } = useLocation();
  return <output data-testid="author-context">{JSON.stringify(state)}</output>;
}

describe("PublicWorkDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicWorkDetails).mockResolvedValue(work);
  });

  it("leva a origem da coleção e a Obra ao abrir o Autor", async () => {
    render(
      <MemoryRouter initialEntries={[{ pathname: "/obra/monster", state: { catalogOrigin: "collection" } }]}>
        <Routes>
          <Route path="/obra/:slug" element={<PublicWorkDetails />} />
          <Route path="/autor/:authorSlug" element={<AuthorContextProbe />} />
        </Routes>
      </MemoryRouter>,
    );
    await screen.findByRole("heading", { name: "Monster", level: 1 });
    expect(screen.getByRole("navigation", { name: "Caminho de navegação" })).toHaveTextContent("ColeçãoMonster");
    fireEvent.click(screen.getByRole("link", { name: "Ver Obras de Naoki Urasawa" }));
    expect(screen.getByTestId("author-context")).toHaveTextContent('"catalogOrigin":"collection"');
    expect(screen.getByTestId("author-context")).toHaveTextContent('"fromWork":{"slug":"monster","title":"Monster"}');
  });

  it("exibe os metadados públicos completos da Obra e a capa 2:3", async () => {
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando Obra");
    expect(await screen.findByRole("heading", { name: "Monster", level: 1 })).toBeInTheDocument();
    expect(getPublicWorkDetails).toHaveBeenCalledWith("monster");
    expect(screen.getByText("Título original")).toBeInTheDocument();
    expect(screen.getByText("MONSTER")).toBeInTheDocument();
    expect(screen.getByText("Título romanizado")).toBeInTheDocument();
    expect(screen.getByText("Monsutā")).toBeInTheDocument();
    expect(screen.getByText("Monsutā")).not.toBe(screen.getByText("MONSTER"));
    expect(screen.getByText("Tipo de obra")).toBeInTheDocument();
    expect(screen.getByText("País de Origem")).toBeInTheDocument();
    expect(screen.getByText("Mangá").tagName).toBe("DD");
    expect(screen.getByText("Japão").tagName).toBe("DD");
    expect(screen.getByText("Naoki Urasawa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver Obras de Naoki Urasawa" })).toHaveAttribute("href", "/autor/naoki-urasawa");
    expect(screen.getByText("Roteiro · Arte")).toBeInTheDocument();
    expect(screen.getByText("Suspense")).toBeInTheDocument();
    expect(screen.getByText("Seinen")).toBeInTheDocument();
    expect(screen.getByText("Suspense").closest("dd")).toBeInTheDocument();
    expect(screen.getByText("Seinen").closest("dd")).toBeInTheDocument();
    expect(screen.getByText("Gêneros")).toBeInTheDocument();
    expect(screen.getByText("Demografia")).toBeInTheDocument();
    expect(screen.getByText("Shogakukan")).toBeInTheDocument();
    expect(screen.getByText("Big Comic Original")).toBeInTheDocument();
    expect(screen.getByText("1994–2001")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Sinopse" })).toBeInTheDocument();
    expect(screen.getByText("A sinopse canônica da Obra.")).toHaveClass("font-normal");
    expect(getPublicWorkDetails).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Lançamento")).not.toBeInTheDocument();

    const cover = screen.getByAltText("Capa de Monster");
    expect(cover).toHaveAttribute("src", work.coverUrl);
    expect(cover.parentElement).toHaveClass("aspect-[2/3]");
    const workInfo = screen.getByRole("complementary", { name: "Informações da obra" });
    expect(cover.parentElement?.parentElement).toBe(workInfo.parentElement);
    expect(workInfo).toHaveClass("mt-7");
  });

  it.each([
    [1994, 1994, "1994"],
    [1994, null, "1994-??"],
    [null, 2001, "2001"],
    [null, null, "Não informado"],
  ])(
    "representa corretamente os limites parciais da publicação original",
    async (startYear, endYear, expected) => {
      vi.mocked(getPublicWorkDetails).mockResolvedValue({
        ...work,
        originalPublicationStartYear: startYear,
        originalPublicationEndYear: endYear,
      });
      renderPage();

      expect(await screen.findByText(expected)).toBeInTheDocument();
    },
  );

  it("omite metadados opcionais ausentes sem inventar valores", async () => {
    vi.mocked(getPublicWorkDetails).mockResolvedValue({
      ...work,
      originalTitle: null,
      synopsis: null,
      authors: [],
      genres: [],
      demographics: [],
      serializationMagazines: [],
      originalPublishers: [],
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Monster", level: 1 })).toBeInTheDocument();
    expect(screen.queryByText("MONSTER")).not.toBeInTheDocument();
    expect(screen.queryByText("Volumes originais")).not.toBeInTheDocument();
    expect(screen.queryByText("Editora Original")).not.toBeInTheDocument();
    expect(screen.queryByText("Pré-publicação")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Sinopse" })).not.toBeInTheDocument();
  });

  it("lista somente os dados recebidos das Edições e as prévias de Volumes", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Edições brasileiras" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /1ª edição\s*Panini/ })).toBeInTheDocument();
    expect(screen.queryByText("Regular")).not.toBeInTheDocument();
    expect(screen.getByText("Panini")).toBeInTheDocument();
    expect(screen.getByText((_, element) => (
      element?.tagName === "SPAN" && element.textContent === "Em publicação com 9 volumes"
    ))).toBeInTheDocument();
    expect(screen.getByText("Volume 1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes do Volume 1" })).toHaveAttribute(
      "href",
      "/obra/monster/edicao/1/volume/1",
    );
    expect(screen.queryByText("15/05/2024")).not.toBeInTheDocument();
    expect(screen.queryByAltText("Capa da 1ª edição de Monster")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /1ª edição\s*Panini Em publicação com 9 volumes/ })).toHaveAttribute(
      "href",
      "/obra/monster/edicao/1",
    );
  });

  it("mostra a Edição mais recente primeiro e no máximo cinco Volumes por Edição", async () => {
    const firstEdition = work.editions[0];
    vi.mocked(getPublicWorkDetails).mockResolvedValue({
      ...work,
      editions: [
        {
          ...firstEdition,
          volumesCount: 6,
          volumes: Array.from({ length: 6 }, (_, index) => ({
            ...firstEdition.volumes[0],
            id: 30 + index,
            number: index + 1,
          })),
        },
        { ...firstEdition, id: 21, chronologicalNumber: 2, volumesCount: 0, volumes: [] },
      ],
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: /2ª edição/ })).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { name: /ª edição/ }).map((heading) => heading.textContent)).toEqual([
      "2ª edição·Panini",
      "1ª edição·Panini",
    ]);
    const preview = within(screen.getByRole("region", { name: "Prévia de volumes da 1ª edição" }));
    expect(preview.getAllByRole("link", { name: /Ver detalhes do Volume/ })).toHaveLength(5);
    expect(preview.getByRole("link", { name: "Ver detalhes do Volume 5" })).toHaveAttribute(
      "href", "/obra/monster/edicao/1/volume/5",
    );
    expect(preview.queryByRole("link", { name: "Ver detalhes do Volume 6" })).not.toBeInTheDocument();
  });

  it("exibe estado vazio quando a Obra não possui Edições públicas", async () => {
    vi.mocked(getPublicWorkDetails).mockResolvedValue({ ...work, editions: [] });
    renderPage();

    expect(await screen.findByText("Nenhuma edição pública cadastrada para esta obra.")).toBeInTheDocument();
  });

  it("exibe erro genérico sem revelar se a Obra é privada ou adulta e permite tentar novamente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Obra não encontrada." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(getPublicWorkDetails)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(work);
    renderPage("obra-restrita");

    expect(await screen.findByText("Obra não encontrada.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(getPublicWorkDetails).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Monster", level: 1 })).toBeInTheDocument();
  });

  it("usa fallback quando a capa não pode ser carregada", async () => {
    renderPage();
    const cover = await screen.findByAltText("Capa de Monster");

    fireEvent.error(cover);

    expect(screen.getByText("Sem capa")).toBeInTheDocument();
  });
});
