import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import EditionVolumeSelection from "@/features/public-catalog/pages/EditionVolumeSelection";
import { getCompleteCollectionEdition, syncCollectionEdition, syncWishlist, updateVolumeReading } from "@/features/personal-library";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicEditionDetails: vi.fn(),
}));

vi.mock("@/features/personal-library", async (original) => ({
  ...(await original<typeof import("@/features/personal-library")>()),
  getCompleteCollectionEdition: vi.fn(), syncCollectionEdition: vi.fn(), syncWishlist: vi.fn(), updateVolumeReading: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { warning: vi.fn(), success: vi.fn() } }));

const response = {
  edition: {
    id: 20,
    chronologicalNumber: 1,
    coverUrl: null,
    brazilianPublisher: { id: 1, label: "Panini" },
    format: { id: 3, label: "Tankobon" },
    coverType: { id: 4, label: "Brochura" },
    brazilPublicationStatus: "Em publicação",
    volumesCount: 2,
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
      pages: 200,
      releaseDatePrecision: "Ano",
      releaseYear: 2026,
      releaseMonth: null,
      releaseDay: null,
    },
    {
      id: 31,
      number: 2,
      singleVolume: false,
      coverUrl: null,
      pages: 210,
      releaseDatePrecision: "Ano",
      releaseYear: 2026,
      releaseMonth: null,
      releaseDay: null,
    },
  ],
  pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
};

function renderPage(mode: "colecao" | "desejos" | "lidos" = "colecao", editionNumber = "1") {
  return render(
    <MemoryRouter initialEntries={[`/obra/monster/edicao/${editionNumber}/selecionar/${mode}`]}>
      <Routes>
        <Route path="/obra/:slug/edicao/:editionNumber/selecionar/colecao" element={<EditionVolumeSelection mode="colecao" />} />
        <Route path="/obra/:slug/edicao/:editionNumber/selecionar/desejos" element={<EditionVolumeSelection mode="desejos" />} />
        <Route path="/obra/:slug/edicao/:editionNumber/selecionar/lidos" element={<EditionVolumeSelection mode="lidos" />} />
        <Route path="/obra/:slug/edicao/:editionNumber" element={<div>Edição</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function personal(owned: number[] = [], wished: number[] = [], read: number[] = []) {
  return { ...response, progress: { owned: owned.length, read: read.length, wished: wished.length, total: 2 },
    volumes: response.volumes.map((volume) => ({ ...volume, owned: owned.includes(volume.id), read: owned.includes(volume.id) ? read.includes(volume.id) : null, wished: wished.includes(volume.id) })) };
}
describe("EditionVolumeSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicEditionDetails).mockResolvedValue(response);
    vi.mocked(getCompleteCollectionEdition).mockResolvedValue(personal());
    vi.mocked(syncCollectionEdition).mockResolvedValue({ editionId: 20, addedVolumeIds: [30], removedVolumeIds: [] });
    vi.mocked(syncWishlist).mockResolvedValue([]);
    vi.mocked(updateVolumeReading).mockResolvedValue({ volumeId: 30, owned: true, read: true, wished: false });
  });
  it("carrega seleção persistida, modifica e salva um delta atômico antes de voltar", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal([30])).mockResolvedValueOnce(personal([31]));
    renderPage();
    expect(await screen.findByText("1 de 2 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Desmarcar Volume 1" }));
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Volume 2" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText("Edição")).toBeInTheDocument();
    expect(syncCollectionEdition).toHaveBeenCalledWith(20, { addVolumeIds: [31], removeVolumeIds: [30] });
    expect(getCompleteCollectionEdition).toHaveBeenCalledTimes(2);
    expect(toast.success).toHaveBeenCalledWith("Coleção atualizada.");
  });
  it("confirma a remoção de desejos antes de adicionar volumes à coleção", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal([], [30, 31])).mockResolvedValueOnce(personal([30, 31]));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Selecionar todos" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.getByRole("dialog", { name: "Adicionar à coleção?" })).toHaveTextContent("2 volumes selecionados estão na sua lista de desejos");
    expect(syncCollectionEdition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(syncCollectionEdition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    expect(await screen.findByText("Edição")).toBeInTheDocument();
    expect(syncCollectionEdition).toHaveBeenCalledWith(20, { addVolumeIds: [30, 31], removeVolumeIds: [] });
  });
  it("seleciona/desmarca todos e mostra apenas volumes faltantes nos desejos", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValue(personal([30]));
    renderPage("desejos");
    expect(await screen.findByText("0 de 1 selecionados")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Selecionar Volume 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    expect(screen.getByText("1 de 1 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionar todos" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Desmarcar todos" }));
    expect(screen.getByRole("button", { name: "Desmarcar todos" })).toBeDisabled();
  });
  it("avisa ao salvar a lista de desejos", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal()).mockResolvedValueOnce(personal([], [30]));
    renderPage("desejos");
    fireEvent.click(await screen.findByRole("button", { name: "Selecionar Volume 1" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText("Edição")).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Lista de desejos atualizada.");
  });
  it("seleciona apenas volumes da coleção como lidos e salva o estado de leitura", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal([30])).mockResolvedValueOnce(personal([30], [], [30]));
    renderPage("lidos");
    expect(await screen.findByText("0 de 1 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionar Volume 1" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Selecionar Volume 2" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Volume 1" }));
    expect(screen.getByRole("button", { name: "Desmarcar Volume 1" }).querySelector("svg")).toHaveClass("lucide-eye");
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText("Edição")).toBeInTheDocument();
    expect(updateVolumeReading).toHaveBeenCalledWith(30, true);
    expect(syncCollectionEdition).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Volumes lidos atualizados.");
  });
  it("não oferece volumes para leitura quando a coleção está vazia", async () => {
    renderPage("lidos");
    expect(await screen.findByText("Nenhum volume desta edição está na sua coleção.")).toBeInTheDocument();
    expect(screen.getByText("0 de 0 selecionados")).toBeInTheDocument();
  });
  it("reconcilia falha parcial e conflito de desejo com a seleção do servidor", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal()).mockResolvedValueOnce(personal([], [31]));
    vi.mocked(syncWishlist).mockResolvedValueOnce([{ isAxiosError: true, response: { status: 409, data: { error: "Volume já adquirido." } } }]);
    renderPage("desejos");
    await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText("Volume já adquirido.")).toBeInTheDocument();
    expect(screen.getByText("1 de 2 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionar Volume 1" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
  });
  it("descarta seleção após falha de confirmação e permite recarregar", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal()).mockRejectedValueOnce(new Error("rede"));
    renderPage(); await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Volume 1" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível confirmar a seleção salva");
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("0 de 2 selecionados")).toBeInTheDocument();
  });
  it("reconsulta seleção também após falha da sincronização atômica", async () => {
    vi.mocked(syncCollectionEdition).mockRejectedValueOnce(new Error("rede"));
    renderPage(); await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Volume 1" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText(/Algumas alterações não foram salvas/)).toBeInTheDocument();
    expect(screen.getByText("0 de 2 selecionados")).toBeInTheDocument();
  });
  it("não divide uma seleção com mais de 100 mudanças", async () => {
    const many = personal(); many.volumes = Array.from({ length: 101 }, (_, index) => ({ ...many.volumes[0], id: index + 1, number: index + 1 }));
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(many);
    renderPage(); await screen.findByText("0 de 101 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText(/Altere até 100 Volumes/)).toBeInTheDocument();
    expect(syncCollectionEdition).not.toHaveBeenCalled();
  });
  it("trata carregamento inválido, vazio e falha inicial", async () => {
    const view = renderPage("colecao", "0");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    view.unmount();
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce({ ...personal(), volumes: [] });
    renderPage();
    expect(await screen.findByText("Nenhum volume público cadastrado nesta edição.")).toBeInTheDocument();
    await waitFor(() => expect(getPublicEditionDetails).toHaveBeenCalled());
  });
});
