import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Colecao from "./Colecao";
import { getCompleteCollectionEdition, listCollection, removeCollectionVolume, updateVolumeReading, type CollectionResponse } from "@/features/personal-library";
vi.mock("@/features/personal-library", async (original) => ({ ...(await original<typeof import("@/features/personal-library")>()), listCollection: vi.fn(), getCompleteCollectionEdition: vi.fn(), updateVolumeReading: vi.fn(), removeCollectionVolume: vi.fn() }));
function response(read = false, total = 1): CollectionResponse {
  return { works: [{ work: { id: 8, slug: "monster", title: "Monster" }, editions: [{ edition: { id: 20, chronologicalNumber: 1, brazilianPublisher: { id: 1, label: "Panini" } }, progress: { owned: total, total: 60, read: read ? 1 : 0 }, volumes: [{ id: 30, number: 1, singleVolume: false, read }], volumesPagination: { page: 1, limit: 50, total, totalPages: Math.ceil(total / 50) } }] }], pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } };
}
function mount() { return render(<MemoryRouter><Colecao /></MemoryRouter>); }
describe("Estante conectada à API", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(listCollection).mockResolvedValue(response()); });
  it("mostra agrupamento, progresso e atualiza leitura com nova consulta", async () => {
    vi.mocked(listCollection).mockResolvedValueOnce(response()).mockResolvedValueOnce(response(true));
    mount();
    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua coleção");
    expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
    expect(screen.getByText("1 de 60 Volumes na coleção · 0 lidos")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("value", "1");
    fireEvent.click(screen.getByRole("button", { name: "Marcar Volume 1 de Monster como lido" }));
    expect(await screen.findByText("Lido")).toBeInTheDocument();
    expect(updateVolumeReading).toHaveBeenCalledWith(30, true);
    expect(screen.getByRole("status")).toHaveTextContent("Estado de leitura atualizado.");
  });
  it("reconsulta também quando remover falha e preserva o estado persistido", async () => {
    vi.mocked(removeCollectionVolume).mockRejectedValueOnce({ isAxiosError: true, response: { data: { error: "Alteração recusada." } } });
    mount(); await screen.findByText("Não lido");
    fireEvent.click(screen.getByRole("button", { name: "Remover Volume 1 de Monster da coleção" }));
    expect(await screen.findByText("Alteração recusada.")).toBeInTheDocument();
    expect(screen.getByText("Não lido")).toBeInTheDocument();
    expect(listCollection).toHaveBeenCalledTimes(2);
  });
  it("expande além dos50 possuídos e filtra os não adquiridos", async () => {
    vi.mocked(listCollection).mockResolvedValue(response(false, 53));
    vi.mocked(getCompleteCollectionEdition).mockResolvedValue({ edition: { ...response().works[0].editions[0].edition, work: response().works[0].work }, progress: { owned: 53, read: 0, total: 60 }, pagination: { page: 1, limit: 50, total: 60, totalPages: 2 }, volumes: [{ id: 53, number: 53, singleVolume: false, owned: true, wished: false, read: false }, { id: 60, number: 60, singleVolume: false, owned: false, wished: false, read: null }] });
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Mostrar todos os Volumes adquiridos" }));
    expect(await screen.findByText("Volume 53")).toBeInTheDocument();
    expect(screen.queryByText("Volume 60")).not.toBeInTheDocument();
    expect(getCompleteCollectionEdition).toHaveBeenCalledWith(20);
  });
  it("trata falha inicial, retry e coleção vazia", async () => {
    vi.mocked(listCollection).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ works: [], pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    mount(); expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível carregar seu acervo.");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Sua coleção ainda não tem Volumes públicos.")).toBeInTheDocument();
  });
  it("volta à página válida ao remover o último Volume na página2", async () => {
    const first = response(); first.pagination = { page: 1, limit: 12, total: 13, totalPages: 2 };
    const second = response(); second.pagination = { page: 2, limit: 12, total: 13, totalPages: 2 };
    vi.mocked(listCollection).mockResolvedValueOnce(first).mockResolvedValueOnce(second).mockResolvedValueOnce({ works: [], pagination: { page: 2, limit: 12, total: 12, totalPages: 1 } }).mockResolvedValueOnce(response());
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await screen.findByText("Página 2 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Remover Volume 1 de Monster da coleção" }));
    await waitFor(() => expect(listCollection).toHaveBeenNthCalledWith(4, 1));
    expect(await screen.findByText("Volume removido da coleção.")).toBeInTheDocument();
    expect(screen.getByText("Volume 1")).toBeInTheDocument();
  });
});
