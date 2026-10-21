import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Colecao from "@/features/collection/pages/Colecao";
import { getPublicCatalogOptions } from "@/features/public-catalog/publicCatalogService";
import { getCompleteCollectionEdition, listCollection, type CollectionResponse } from "@/features/personal-library";
vi.mock("@/features/public-catalog/publicCatalogService", () => ({ getPublicCatalogOptions: vi.fn() }));
vi.mock("@/features/personal-library", async (original) => ({ ...(await original<typeof import("@/features/personal-library")>()), listCollection: vi.fn(), getCompleteCollectionEdition: vi.fn() }));
vi.mock("@/features/auth", () => ({ useAuth: () => ({ user: { id: "test-user", conteudo_adulto: false, active_profile: "Usuário Padrão" } }) }));
vi.mock("sonner", () => ({ toast: { error: vi.fn() } }));
function response(read = false, total = 1): CollectionResponse {
  return { works: [{ work: { id: 8, slug: "monster", title: "Monster" }, editions: [{ edition: { id: 20, chronologicalNumber: 1, brazilPublicationStatus: "Completa", brazilianPublisher: { id: 1, label: "Panini" } }, progress: { owned: total, total: 60, read: read ? 1 : 0, wished: 3 }, volumes: [{ id: 30, number: 1, singleVolume: false, read }], volumesPagination: { page: 1, limit: 50, total, totalPages: Math.ceil(total / 50) } }] }], totals: { editions: 1, volumes: total }, pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } };
}
function mount() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><Colecao isAuthenticated /></MemoryRouter></QueryClientProvider>);
}
describe("Estante conectada à API", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(listCollection).mockResolvedValue(response()); vi.mocked(getPublicCatalogOptions).mockResolvedValue({ brazilianPublishers: [{ id: 1, label: "Panini" }] } as Awaited<ReturnType<typeof getPublicCatalogOptions>>); });
  it("mostra o cartão compacto com título e edição, sem editora nem ações individuais", async () => {
    mount();
    expect(screen.getByRole("heading", { name: "Sua coleção" })).toHaveClass("sr-only");
    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua coleção");
    expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toBeDisabled();
    const heading = await screen.findByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" });
    expect(heading).toHaveClass("text-white");
    expect(heading.querySelectorAll(".mx-2")).toHaveLength(2);
    expect(heading.querySelector("span.font-bold")).toHaveTextContent("Coleção incompleta");
    expect(heading.querySelector(".rounded-full")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toBeEnabled();
    const edition = screen.getByRole("region", { name: "1ª edição de Monster" });
    expect(heading.nextElementSibling).toHaveTextContent("1/60 volumes adquiridos · 0/1 volumes lidos · 3/59 volumes faltantes desejados");
    expect(within(edition).queryByText("Gerenciar volumes:")).not.toBeInTheDocument();
    expect(within(edition).queryByRole("link", { name: /adquiridos|lidos|desejados/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(edition).queryByText("Panini")).not.toBeInTheDocument();
    expect(edition).toHaveClass("border-b", "border-border", "pb-3", "pt-6");
    expect(edition).not.toHaveClass("rounded-xl");
    const volumeRow = within(edition).getByRole("link", { name: "Ver 1ª edição de Monster" });
    expect(volumeRow).toHaveClass("flex", "-ml-3", "rounded-2xl", "hover:bg-sidebar-accent/30");
    expect(volumeRow).not.toHaveClass("border");
    expect(volumeRow).toContainElement(heading);
    expect(heading.nextElementSibling?.parentElement).toBe(volumeRow.firstElementChild);
    expect(within(volumeRow).getByText("Sem capa").closest(".w-24")).toHaveClass("w-24", "shrink-0");
    expect(within(volumeRow).queryByText("Volume 1")).not.toBeInTheDocument();
    expect(within(volumeRow).queryByText("Não lido")).not.toBeInTheDocument();
    expect(volumeRow.querySelector("svg.lucide-chevron-right")).toBeInTheDocument();
    expect(within(edition).queryByRole("link", { name: /Ver Volume/ })).not.toBeInTheDocument();
    expect(within(edition).queryByRole("button", { name: /Marcar|Remover da coleção/ })).not.toBeInTheDocument();
  });
  it("abre a edição pela faixa com título, resumo e capas", async () => {
    mount();
    const edition = await screen.findByRole("region", { name: "1ª edição de Monster" });
    expect(within(edition).getByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" })).toBeInTheDocument();
    expect(within(edition).getByRole("link", { name: "Ver 1ª edição de Monster" })).toHaveAttribute("href", "/obra/monster/edicao/1");
    expect(within(edition).queryByRole("link", { name: /adquiridos|lidos|desejados/ })).not.toBeInTheDocument();
  });
  it.each([
    ["Completa", 60, "Coleção completa"],
    ["Cancelada", 60, "Coleção completa"],
    ["Em andamento", 60, "Coleção incompleta"],
    ["Em hiato", 60, "Coleção incompleta"],
    ["Completa", 59, "Coleção incompleta"],
  ])("classifica edição %s com %i volumes adquiridos como %s", async (publicationStatus, owned, expected) => {
    const data = response(false, owned);
    data.works[0].editions[0].edition.brazilPublicationStatus = publicationStatus;
    vi.mocked(listCollection).mockResolvedValue(data);
    mount();
    const edition = await screen.findByRole("region", { name: "1ª edição de Monster" });
    expect(within(edition).getByRole("heading", { name: `Monster · 1ª edição · ${expected}` })).toBeInTheDocument();
  });
  it("separa edições da mesma Obra por linhas divisórias", async () => {
    const data = response();
    data.works[0].editions.push({
      ...data.works[0].editions[0],
      edition: { ...data.works[0].editions[0].edition, id: 21, chronologicalNumber: 2 },
    });
    vi.mocked(listCollection).mockResolvedValue(data);
    mount();
    const first = await screen.findByRole("region", { name: "1ª edição de Monster" });
    const second = screen.getByRole("region", { name: "2ª edição de Monster" });
    expect(first).toHaveClass("border-b", "border-border");
    expect(second).toHaveClass("border-b", "border-border");
  });
  it("expande além dos50 possuídos e filtra os não adquiridos", async () => {
    vi.mocked(listCollection).mockResolvedValue(response(false, 53));
    vi.mocked(getCompleteCollectionEdition).mockResolvedValue({ edition: { ...response().works[0].editions[0].edition, work: response().works[0].work }, progress: { owned: 53, read: 0, total: 60, wished: 0 }, pagination: { page: 1, limit: 50, total: 60, totalPages: 2 }, volumes: [{ id: 53, number: 53, singleVolume: false, coverUrl: "https://cdn.comanga.test/volume-53.jpg", owned: true, wished: false, read: false }, { id: 60, number: 60, singleVolume: false, owned: false, wished: false, read: null }] });
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Mostrar todos os volumes adquiridos" }));
    expect(await screen.findByAltText("Capa de Volume 53 de Monster")).toBeInTheDocument();
    expect(screen.queryByAltText("Capa de Volume 60 de Monster")).not.toBeInTheDocument();
    expect(getCompleteCollectionEdition).toHaveBeenCalledWith(20);
  });
  it("trata falha inicial, retry e coleção vazia", async () => {
    vi.mocked(listCollection).mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce({ works: [], totals: { editions: 0, volumes: 0 }, pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    mount();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar seu acervo.", expect.any(Object)));
    const retry = vi.mocked(toast.error).mock.calls[0][1] as unknown as { action: { onClick: () => void } };
    retry.action.onClick();
    expect(await screen.findByText("Você ainda não adicionou nenhum volume à sua coleção!")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Explorar catálogo" })).toHaveAttribute("href", "/pesquisa");
    expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Status da coleção" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Editora brasileira" })).toBeDisabled();
  });
  it("mantém os filtros quando a coleção só não tem resultados para a seleção", async () => {
    vi.mocked(listCollection).mockResolvedValueOnce(response()).mockResolvedValue({ works: [], totals: { editions: 0, volumes: 0 }, pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    mount();
    await screen.findByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" });
    fireEvent.click(screen.getByRole("button", { name: "Status da coleção" }));
    fireEvent.click(screen.getByRole("button", { name: "Completa" }));
    expect(await screen.findByText("Nenhuma edição da sua coleção corresponde aos filtros selecionados.")).toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toBeInTheDocument();
  });
  it("aplica busca, status e editora antes de consultar a página", async () => {
    mount();
    await screen.findByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" });
    fireEvent.change(screen.getByRole("searchbox", { name: "Pesquisar na coleção" }), { target: { value: "Naoki" } });
    await waitFor(() => expect(listCollection).toHaveBeenCalledWith(1, { term: "Naoki" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Status da coleção" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Status da coleção" }));
    fireEvent.click(screen.getByRole("button", { name: "Completa" }));
    await waitFor(() => expect(listCollection).toHaveBeenCalledWith(1, { term: "Naoki", status: "complete" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "Editora brasileira" })).toBeEnabled());
    fireEvent.click(screen.getByRole("button", { name: "Editora brasileira" }));
    fireEvent.click(screen.getByRole("button", { name: "Panini" }));
    await waitFor(() => expect(listCollection).toHaveBeenCalledWith(1, { term: "Naoki", status: "complete", brazilianPublisherId: 1 }));
  });
  it("navega para a segunda página de resultados", async () => {
    const first = response(); first.pagination = { page: 1, limit: 12, total: 13, totalPages: 2 };
    const second = response(); second.pagination = { page: 2, limit: 12, total: 13, totalPages: 2 };
    vi.mocked(listCollection).mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    mount(); fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
    await screen.findByText("Página 2 de 2");
    expect(listCollection).toHaveBeenNthCalledWith(2, 2, {});
    expect(screen.getByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" })).toBeInTheDocument();
  });
});
