import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { AxiosError } from "axios";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicVolumeDetails from "@/pages/PublicVolumeDetails";
import { getPublicVolumeDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicVolumeDetails: vi.fn(),
}));

const volume = {
  id: 30,
  number: 1,
  singleVolume: false,
  coverUrl: "https://cdn.comanga.test/monster-volume-1.jpg",
  pages: 416,
  price: 79.9,
  priceCurrency: "R$",
  releaseDatePrecision: "Completa",
  releaseYear: 2026,
  releaseMonth: 8,
  releaseDay: 20,
  isbn10: "1234567890",
  isbn13: "9781234567890",
  affiliateLink: "https://shop.example/volume-1",
  synopsis: "Uma sinopse pública.",
  edition: {
    id: 20,
    chronologicalNumber: 2,
    work: {
      id: 8,
      slug: "monster",
      title: "Monster",
      originalTitle: "MONSTER",
    },
  },
};

function renderPage(entry = "/volumes/30") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/volumes/:volumeId" element={<PublicVolumeDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicVolumeDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicVolumeDetails).mockResolvedValue(volume);
  });

  it("exibe capa, publicação, dados físicos, comerciais e sinopse", async () => {
    renderPage();

    expect(screen.getByText("Carregando Volume...")).toBeInTheDocument();
    expect(await screen.findByRole("heading", { name: "Monster — Volume 1", level: 1 })).toBeInTheDocument();
    expect(getPublicVolumeDetails).toHaveBeenCalledWith(30);
    expect(screen.getByText("MONSTER")).toBeInTheDocument();
    expect(screen.getByText("2ª Edição")).toBeInTheDocument();
    expect(screen.getByText("20/08/2026")).toBeInTheDocument();
    expect(screen.getByText("416 páginas")).toBeInTheDocument();
    expect(screen.getByText("R$ 79,90")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("9781234567890")).toBeInTheDocument();
    expect(screen.getByText("Uma sinopse pública.")).toBeInTheDocument();

    const cover = screen.getByAltText("Capa do Volume 1 de Monster");
    expect(cover).toHaveAttribute("src", volume.coverUrl);
    expect(cover.parentElement).toHaveClass("aspect-[2/3]");

    const affiliate = screen.getByRole("link", { name: "Comprar em loja parceira" });
    expect(affiliate).toHaveAttribute("href", volume.affiliateLink);
    expect(affiliate).toHaveAttribute("target", "_blank");
    expect(affiliate).toHaveAttribute("rel", "noreferrer noopener");
  });

  it("oferece retorno contextual para a Edição e para a Obra", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Monster — Volume 1" });

    expect(screen.getByRole("link", { name: "Voltar para 2ª Edição" })).toHaveAttribute("href", "/edicoes/20");
    expect(screen.getByRole("link", { name: "Ver detalhes de Monster" })).toHaveAttribute("href", "/obras/monster");
  });

  it("não inventa valores nem ações ainda inaplicáveis quando campos opcionais estão ausentes", async () => {
    vi.mocked(getPublicVolumeDetails).mockResolvedValue({
      ...volume,
      singleVolume: true,
      coverUrl: null,
      pages: null,
      price: null,
      releaseDatePrecision: "Desconhecida",
      releaseYear: null,
      releaseMonth: null,
      releaseDay: null,
      isbn10: null,
      isbn13: null,
      affiliateLink: null,
      synopsis: null,
      edition: {
        ...volume.edition,
        work: { ...volume.edition.work, originalTitle: null },
      },
    });
    renderPage();

    expect(await screen.findByRole("heading", { name: "Monster — Volume único" })).toBeInTheDocument();
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
    expect(screen.queryByText("Páginas")).not.toBeInTheDocument();
    expect(screen.queryByText("Preço")).not.toBeInTheDocument();
    expect(screen.queryByText("Lançamento")).not.toBeInTheDocument();
    expect(screen.queryByText("ISBN-10")).not.toBeInTheDocument();
    expect(screen.queryByText("ISBN-13")).not.toBeInTheDocument();
    expect(screen.queryByText("Sinopse")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Comprar em loja parceira" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /estante/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /desejos/i })).not.toBeInTheDocument();
  });

  it.each([
    ["Mes e ano", 2026, 8, null, "08/2026"],
    ["Ano", 2026, null, null, "2026"],
  ])("formata a precisão parcial %s", async (precision, year, month, day, expected) => {
    vi.mocked(getPublicVolumeDetails).mockResolvedValue({
      ...volume,
      releaseDatePrecision: precision,
      releaseYear: year,
      releaseMonth: month,
      releaseDay: day,
    });
    renderPage();

    expect(await screen.findByText(expected)).toBeInTheDocument();
  });

  it("exibe erro seguro, permite tentar novamente e trata ID inválido localmente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Volume não encontrado." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: {} },
    });
    vi.mocked(getPublicVolumeDetails)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(volume);
    const { unmount } = renderPage();

    expect(await screen.findByText("Volume não encontrado.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(getPublicVolumeDetails).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "Monster — Volume 1" })).toBeInTheDocument();

    unmount();
    vi.clearAllMocks();
    renderPage("/volumes/invalido");
    expect(await screen.findByText("Volume não encontrado.")).toBeInTheDocument();
    expect(getPublicVolumeDetails).not.toHaveBeenCalled();
  });
});
