import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VolumeDetails from "@/pages/VolumeDetails";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: { get: vi.fn() },
}));

const completeVolume = {
  id: 30,
  editionId: 20,
  number: 2,
  singleVolume: false,
  coverUrl: "https://cdn.comanga.test/volume.jpg",
  pages: 208,
  price: 39.9,
  priceCurrency: "R$",
  releaseDatePrecision: "Completa",
  releaseYear: 2026,
  releaseMonth: 3,
  releaseDay: 5,
  isbn10: "1234567890",
  isbn13: "9781234567890",
  affiliateLink: "https://loja.test/volume",
  synopsis: "Sinopse do volume.",
  visibility: "Publico",
};

function renderPage(state = true) {
  return render(
    <MemoryRouter initialEntries={[
      state
        ? { pathname: "/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/30", state: { workId: 10, editionId: 20, volumeId: 30 } }
        : "/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/30",
    ]}>
      <Routes>
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId" element={<VolumeDetails />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("VolumeDetails", () => {
  beforeEach(() => vi.clearAllMocks());

  it("exibe todos os dados de um volume publico com data completa", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { volume: completeVolume } });

    renderPage();

    expect(await screen.findByRole("heading", { name: "Volume 2" })).toBeInTheDocument();
    expect(screen.getByAltText("Capa do Volume 2")).toHaveAttribute("src", completeVolume.coverUrl);
    expect(screen.getByText("R$ 39,90")).toBeInTheDocument();
    expect(screen.getByText("05/03/2026")).toBeInTheDocument();
    expect(screen.getByText("Sinopse do volume.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /editar volume/i })).toHaveAttribute(
      "href",
      "/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/30/editar",
    );
    expect(screen.getByRole("link", { name: /voltar/i })).toHaveAttribute(
      "href",
      "/admin/editar-mangas/obras/Naruto/edicoes/20",
    );
  });

  it("formata volume unico, mes e ano e dados opcionais ausentes", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        volume: {
          ...completeVolume,
          singleVolume: true,
          coverUrl: null,
          pages: null,
          price: null,
          releaseDatePrecision: "Mes e ano",
          releaseMonth: 7,
          releaseDay: null,
          isbn10: null,
          isbn13: null,
          synopsis: null,
          visibility: "Privado",
        },
      },
    });

    renderPage(false);

    expect(await screen.findByRole("heading", { name: /volume .nico/i })).toBeInTheDocument();
    expect(screen.getByText("07/2026")).toBeInTheDocument();
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
    expect(screen.queryByText("Sinopse do volume.")).not.toBeInTheDocument();
  });

  it("formata precisao anual", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { volume: { ...completeVolume, releaseDatePrecision: "Ano", releaseMonth: null, releaseDay: null } },
    });

    renderPage();

    expect(await screen.findByText("2026")).toBeInTheDocument();
  });

  it("mostra a mensagem retornada pela API quando o carregamento falha", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Volume indisponivel." } },
    });

    renderPage();

    expect(await screen.findByText("Volume indisponivel.")).toBeInTheDocument();
  });

  it("usa mensagem padrao quando ocorre erro sem resposta da API", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("falha"));

    renderPage();

    expect(await screen.findByText("Erro ao carregar dados do Volume.")).toBeInTheDocument();
  });
});
