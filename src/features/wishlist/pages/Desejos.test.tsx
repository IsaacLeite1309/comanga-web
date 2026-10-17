import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Desejos from "./Desejos";
import { listWishlist, removeWishlistVolume, type WishlistResponse } from "@/features/personal-library";
vi.mock("@/features/personal-library", async (original) => ({ ...(await original<typeof import("@/features/personal-library")>()), listWishlist: vi.fn(), removeWishlistVolume: vi.fn() }));
const full: WishlistResponse = { volumes: [{ id: 30, number: 1, singleVolume: false, coverUrl: null, work: { id: 8, slug: "monster", title: "Monster" }, edition: { id: 20, chronologicalNumber: 1, brazilianPublisher: { id: 1, label: "Panini" } } }], pagination: { page: 1, limit: 24, total: 1, totalPages: 1 } };
const empty: WishlistResponse = { volumes: [], pagination: { page: 1, limit: 24, total: 0, totalPages: 0 } };
function mount() { return render(<MemoryRouter><Desejos /></MemoryRouter>); }
describe("Lista de Desejos conectada", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(listWishlist).mockResolvedValue(full); });
  it("remove e recarrega lista persistida", async () => {
    vi.mocked(listWishlist).mockResolvedValueOnce(full).mockResolvedValueOnce(empty);
    mount(); expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    expect(await screen.findByRole("heading", { name: "Monster · Volume 1" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Remover Volume 1 de Monster dos desejos" }));
    expect(await screen.findByText("Sua Lista de Desejos ainda não tem Volumes públicos.")).toBeInTheDocument();
    expect(removeWishlistVolume).toHaveBeenCalledWith(30);
    expect(screen.getByRole("status")).toHaveTextContent("Volume removido da Lista de Desejos.");
  });
  it("apresenta erro inicial e permite recarregar", async () => {
    vi.mocked(listWishlist).mockRejectedValueOnce(new Error("offline"));
    mount(); await screen.findByRole("alert");
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByRole("heading", { name: "Monster · Volume 1" })).toBeInTheDocument();
  });
  it("retorna à primeira página após remover o último item da página2", async () => {
    vi.mocked(listWishlist).mockResolvedValueOnce({ ...full, pagination: { page: 1, limit: 24, total: 25, totalPages: 2 } }).mockResolvedValueOnce({ ...full, pagination: { page: 2, limit: 24, total: 25, totalPages: 2 } }).mockResolvedValueOnce({ ...empty, pagination: { page: 2, limit: 24, total: 24, totalPages: 1 } }).mockResolvedValueOnce(full);
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await screen.findByText("Página 2 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Remover Volume 1 de Monster dos desejos" }));
    await waitFor(() => expect(listWishlist).toHaveBeenNthCalledWith(4, 1));
    expect(await screen.findByRole("heading", { name: "Monster · Volume 1" })).toBeInTheDocument();
  });
});
