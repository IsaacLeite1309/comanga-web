import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import Desejos from "@/features/wishlist/pages/Desejos";
import { getPublicCatalogOptions } from "@/features/public-catalog/publicCatalogService";
import { addCollectionVolume, listWishlist, removeWishlistVolume, type WishlistResponse } from "@/features/personal-library";
vi.mock("@/features/public-catalog/publicCatalogService", () => ({ getPublicCatalogOptions: vi.fn() }));
vi.mock("@/features/personal-library", async (original) => ({ ...(await original<typeof import("@/features/personal-library")>()), addCollectionVolume: vi.fn(), listWishlist: vi.fn(), removeWishlistVolume: vi.fn() }));
vi.mock("@/features/auth", async (original) => ({ ...(await original<typeof import("@/features/auth")>()), useAuth: () => ({ user: { id: "test-user", conteudo_adulto: false, active_profile: "Usuário Padrão" } }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), warning: vi.fn(), error: vi.fn() } }));
const full: WishlistResponse = { volumes: [{ id: 30, number: 1, singleVolume: false, coverUrl: null, affiliateLink: "https://amazon.example.test/monster", work: { id: 8, slug: "monster", title: "Monster" }, edition: { id: 20, chronologicalNumber: 1, brazilPublicationStatus: "Completa", brazilianPublisher: { id: 1, label: "Panini" } } }], totals: { volumes: 1 }, pagination: { page: 1, limit: 24, total: 1, totalPages: 1 } };
const empty: WishlistResponse = { volumes: [], totals: { volumes: 0 }, pagination: { page: 1, limit: 24, total: 0, totalPages: 0 } };
function mount() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><Desejos isAuthenticated /></MemoryRouter></QueryClientProvider>);
}
describe("Lista de Desejos conectada", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(listWishlist).mockResolvedValue(full); vi.mocked(addCollectionVolume).mockResolvedValue({ volumeId: 30, owned: true, read: false, wished: false }); vi.mocked(getPublicCatalogOptions).mockResolvedValue({ brazilianPublishers: [{ id: 1, label: "Panini" }] } as Awaited<ReturnType<typeof getPublicCatalogOptions>>); });
  it("remove e recarrega lista persistida", async () => {
    vi.mocked(listWishlist).mockResolvedValueOnce(full).mockResolvedValueOnce(empty);
    mount(); expect(screen.getByRole("heading", { name: "Lista de desejos" })).toHaveClass("sr-only"); expect(screen.getByRole("status")).toHaveTextContent("Carregando");
    expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Pesquisar na lista de desejos" })).toBeEnabled();
    const amazon = screen.getByRole("link", { name: "Comprar na Amazon" });
    expect(amazon).toHaveAttribute("href", "https://amazon.example.test/monster");
    const add = screen.getByRole("button", { name: "Adicionar Volume 1 de Monster à coleção" });
    const remove = screen.getByRole("button", { name: "Remover Volume 1 de Monster dos desejos" });
    expect(add).toHaveClass("bg-sidebar");
    expect(remove).toHaveClass("bg-primary");
    expect(add.parentElement).toContainElement(remove);
    expect(add.parentElement?.nextElementSibling).toBe(amazon);
    fireEvent.click(screen.getByRole("button", { name: "Remover Volume 1 de Monster dos desejos" }));
    const emptyNotice = await screen.findByText("Você ainda não adicionou nenhum volume à sua lista de desejos!");
    expect(emptyNotice.parentElement).toHaveClass("max-w-xs", "bg-sidebar", "text-center");
    expect(screen.getByRole("link", { name: "Explorar catálogo" })).toHaveClass("bg-primary", "text-white");
    expect(removeWishlistVolume).toHaveBeenCalledWith(30);
    expect(toast.success).toHaveBeenCalledWith("Volume removido da lista de desejos.");
  });
  it("converte um desejo em volume adquirido e recarrega a lista", async () => {
    vi.mocked(listWishlist).mockResolvedValueOnce(full).mockResolvedValueOnce(empty);
    mount();
    fireEvent.click(await screen.findByRole("button", { name: "Adicionar Volume 1 de Monster à coleção" }));
    const dialog = screen.getByRole("dialog", { name: "Confirmar alteração na lista de desejos?" });
    expect(dialog).toHaveTextContent("Ao adicionar este volume à coleção, ele será removido da lista.");
    expect(dialog).toHaveClass("text-center");
    expect(dialog.querySelector("svg")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Confirmar alteração na lista de desejos?" })).toHaveClass("text-base");
    expect(screen.getByRole("button", { name: "Adicionar" })).toHaveClass("text-base");
    expect(addCollectionVolume).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(addCollectionVolume).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Adicionar Volume 1 de Monster à coleção" }));
    fireEvent.click(screen.getByRole("button", { name: "Adicionar" }));
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Volume adicionado à coleção."));
    expect(addCollectionVolume).toHaveBeenCalledWith(30);
    expect(listWishlist).toHaveBeenCalledTimes(2);
  });
  it("mostra Amazon indisponível sem link e busca por título e editora", async () => {
    vi.mocked(listWishlist).mockResolvedValue({ ...full, volumes: [{ ...full.volumes[0], affiliateLink: null }] });
    mount();
    await screen.findByRole("heading", { name: "Monster" });
    expect(screen.getByRole("button", { name: "Comprar na Amazon" })).toBeDisabled();
    fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar na lista de desejos" }), { target: { value: "Naoki" } });
    await waitFor(() => expect(listWishlist).toHaveBeenCalledWith(1, { term: "Naoki", order: "ASC" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Editora brasileira" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Editora brasileira" }));
    fireEvent.click(screen.getByRole("button", { name: "Panini" }));
    await waitFor(() => expect(listWishlist).toHaveBeenCalledWith(1, { term: "Naoki", brazilianPublisherId: 1, order: "ASC" }));
  });
  it("mostra a contagem total e alterna a ordem alfabética", async () => {
    mount();
    await screen.findByRole("heading", { name: "Monster" });
    expect(screen.getByRole("region", { name: "Total da lista de desejos" })).toHaveTextContent(/1\s*volume/);
    expect(screen.getByRole("status")).not.toHaveTextContent("volume encontrado");
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por título de Z a A" }));
    await waitFor(() => expect(listWishlist).toHaveBeenCalledWith(1, { order: "DESC" }));
    expect(await screen.findByRole("button", { name: "Ordenar por título de A a Z" })).toBeInTheDocument();
  });
  it("apresenta erro inicial sem ação de repetição manual", async () => {
    vi.mocked(listWishlist).mockRejectedValueOnce(new Error("offline"));
    mount();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar seu acervo. Tente novamente em instantes.", { id: "personal-library-load-error" }));
  });
  it("retorna à primeira página após remover o último item da página2", async () => {
    vi.mocked(listWishlist).mockResolvedValueOnce({ ...full, pagination: { page: 1, limit: 24, total: 25, totalPages: 2 } }).mockResolvedValueOnce({ ...full, pagination: { page: 2, limit: 24, total: 25, totalPages: 2 } }).mockResolvedValueOnce({ ...empty, pagination: { page: 2, limit: 24, total: 24, totalPages: 1 } }).mockResolvedValueOnce(full);
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await screen.findByText("Página 2 de 2");
    fireEvent.click(screen.getByRole("button", { name: "Remover Volume 1 de Monster dos desejos" }));
    await waitFor(() => expect(listWishlist).toHaveBeenNthCalledWith(4, 1, { order: "ASC" }));
    expect(await screen.findByRole("heading", { name: "Monster" })).toBeInTheDocument();
  });
});
