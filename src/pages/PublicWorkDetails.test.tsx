import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AxiosError } from "axios";
import PublicWorkDetails from "@/pages/PublicWorkDetails";
import { getPublicWorkDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicWorkDetails: vi.fn(),
}));

const work = {
  id: 1,
  slug: "monster",
  title: "Monster",
  originalTitle: "MONSTER",
  coverUrl: "https://cdn.comanga.test/monster.jpg",
  type: { id: 2, label: "Mangá" },
  country: "Japão",
  originalPublicationStartYear: 1994,
  originalPublicationEndYear: 2001,
  originalVolumeCount: 18,
  directRelease: false,
  originalPublicationStatus: "Finalizada",
  authors: [{ id: 3, label: "Naoki Urasawa", roles: ["Roteiro", "Arte"] }],
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
      editionType: { id: 8, label: "Regular" },
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

function renderPage(slug = "monster") {
  return render(
    <MemoryRouter initialEntries={[`/obras/${slug}`]}>
      <Routes>
        <Route path="/obras/:slug" element={<PublicWorkDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicWorkDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicWorkDetails).mockResolvedValue(work);
  });

  it("exibe os metadados públicos completos da Obra e a capa 2:3", async () => {
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("Carregando Obra");
    expect(await screen.findByRole("heading", { name: "Monster", level: 1 })).toBeInTheDocument();
    expect(getPublicWorkDetails).toHaveBeenCalledWith("monster");
    expect(screen.getByText("MONSTER")).toBeInTheDocument();
    expect(screen.getByText("Naoki Urasawa")).toBeInTheDocument();
    expect(screen.getByText("Roteiro · Arte")).toBeInTheDocument();
    expect(screen.getByText("Suspense")).toBeInTheDocument();
    expect(screen.getByText("Seinen")).toBeInTheDocument();
    expect(screen.getByText("Shogakukan")).toBeInTheDocument();
    expect(screen.getByText("Big Comic Original")).toBeInTheDocument();
    expect(screen.getByText("1994–2001")).toBeInTheDocument();

    const cover = screen.getByAltText("Capa de Monster");
    expect(cover).toHaveAttribute("src", work.coverUrl);
    expect(cover.parentElement).toHaveClass("aspect-[2/3]");
  });

  it("lista somente os dados recebidos das Edições e as prévias de Volumes", async () => {
    renderPage();

    expect(await screen.findByRole("heading", { name: "Edições brasileiras" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "1ª Edição" })).toBeInTheDocument();
    expect(screen.getByText("Panini")).toBeInTheDocument();
    expect(screen.getByText("9 Volumes")).toBeInTheDocument();
    expect(screen.getByText("Volume 1")).toBeInTheDocument();
    expect(screen.getByText("15/05/2024")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes da 1ª Edição" })).toHaveAttribute(
      "href",
      "/edicoes/20",
    );
  });

  it("exibe estado vazio quando a Obra não possui Edições públicas", async () => {
    vi.mocked(getPublicWorkDetails).mockResolvedValue({ ...work, editions: [] });
    renderPage();

    expect(await screen.findByText("Nenhuma Edição pública cadastrada para esta Obra.")).toBeInTheDocument();
  });

  it("exibe erro genérico sem revelar se a Obra é privada ou adulta e permite tentar novamente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Obra não encontrada." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: {} },
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
