import { fireEvent, screen, waitFor } from "@testing-library/react";
import { render } from "../../../support/queryRender";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import EditionVolumeSelection from "@/features/public-catalog/pages/EditionVolumeSelection";
import { getCompleteCollectionEdition, syncCollectionEdition, syncReading, syncWishlist } from "@/features/personal-library";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicEditionDetails: vi.fn(),
}));
vi.mock("@/features/auth", () => ({
  useAuth: () => ({ user: { id: "test-user", active_profile: "Usuário Padrão" } }),
}));

vi.mock("@/features/personal-library", async (original) => ({
  ...(await original<typeof import("@/features/personal-library")>()),
  getCompleteCollectionEdition: vi.fn(), syncCollectionEdition: vi.fn(), syncReading: vi.fn(), syncWishlist: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { warning: vi.fn(), success: vi.fn(), error: vi.fn() } }));

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
    vi.resetAllMocks();
    vi.mocked(getPublicEditionDetails).mockResolvedValue(response);
    vi.mocked(getCompleteCollectionEdition).mockResolvedValue(personal());
    vi.mocked(syncCollectionEdition).mockResolvedValue({ editionId: 20, addedVolumeIds: [30], removedVolumeIds: [] });
    vi.mocked(syncWishlist).mockResolvedValue([]);
    vi.mocked(syncReading).mockResolvedValue({});
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
    await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.getByRole("dialog", { name: "Confirmar alterações na coleção?" })).toHaveTextContent("Os volumes 1 e 2 estão na sua lista de desejos.");
    expect(syncCollectionEdition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(syncCollectionEdition).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
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
    expect(screen.getByRole("button", { name: "Desmarcar Volume 1" }).querySelector("svg")).toHaveClass("lucide-book-open");
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText("Edição")).toBeInTheDocument();
    expect(syncReading).toHaveBeenCalledWith(20, { addVolumeIds: [30], removeVolumeIds: [] });
    expect(syncCollectionEdition).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Volumes lidos atualizados.");
  });
  it("não oferece volumes para leitura quando a coleção está vazia", async () => {
    renderPage("lidos");
    expect(await screen.findByText("Nenhum volume desta edição está na sua coleção.")).toBeInTheDocument();
    expect(screen.getByText("0 de 0 selecionados")).toBeInTheDocument();
  });
  it("reconcilia falha atômica e conflito de desejo com a seleção do servidor", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal()).mockResolvedValueOnce(personal());
    vi.mocked(syncWishlist).mockRejectedValueOnce({ isAxiosError: true, response: { status: 409, data: { error: "Volume já adquirido." } } });
    renderPage("desejos");
    await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText(/Volume já adquirido/)).toBeInTheDocument();
    expect(screen.getByText("0 de 2 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Selecionar Volume 1" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
  });
  it("descarta seleção após falha de confirmação e informa como proceder", async () => {
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce(personal()).mockRejectedValueOnce(new Error("rede"));
    renderPage(); await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Volume 1" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível confirmar a seleção salva. Recarregue antes de continuar. Tente novamente em instantes.", { id: "catalog-error-edition-volume-selection" }));
    expect(screen.queryByRole("button", { name: "OK" })).not.toBeInTheDocument();
    expect(vi.mocked(toast.error).mock.lastCall?.[1]).not.toHaveProperty("action");
  });
  it("reconsulta seleção também após falha da sincronização atômica", async () => {
    vi.mocked(syncCollectionEdition).mockRejectedValueOnce(new Error("rede"));
    renderPage(); await screen.findByText("0 de 2 selecionados");
    fireEvent.click(screen.getByRole("button", { name: "Selecionar Volume 1" }));
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(await screen.findByText(/Nenhuma alteração foi salva/)).toBeInTheDocument();
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
    await waitFor(() => expect(toast.error).toHaveBeenCalled());
    view.unmount();
    vi.mocked(getCompleteCollectionEdition).mockResolvedValueOnce({ ...personal(), volumes: [] });
    renderPage();
    expect(await screen.findByText("Nenhum volume público cadastrado nesta edição.")).toBeInTheDocument();
    await waitFor(() => expect(getPublicEditionDetails).toHaveBeenCalled());
  });
});
