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
  return { works: [{ work: { id: 8, slug: "monster", title: "Monster" }, editions: [{ edition: { id: 20, chronologicalNumber: 1, brazilPublicationStatus: "Completa", brazilianPublisher: { id: 1, label: "Panini" } }, progress: { owned: total, total: 60, read: read ? 1 : 0, wished: 3 }, volumes: [{ id: 30, number: 1, singleVolume: false, read }], volumesPagination: { page: 1, limit: 11, total, totalPages: Math.ceil(total / 11) } }] }], totals: { editions: 1, volumes: total }, pagination: { page: 1, limit: 12, total: 1, totalPages: 1 } };
}
function mount() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}><MemoryRouter><Colecao isAuthenticated /></MemoryRouter></QueryClientProvider>);
}
describe("Estante conectada à API", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(listCollection).mockResolvedValue(response()); vi.mocked(getPublicCatalogOptions).mockResolvedValue({ brazilianPublishers: [{ id: 1, label: "Panini" }] } as Awaited<ReturnType<typeof getPublicCatalogOptions>>); });
  it("separa o cabeçalho e o gerenciamento da faixa clicável das capas", async () => {
    mount();
    expect(screen.getByRole("heading", { name: "Sua coleção" })).toHaveClass("sr-only");
    expect(screen.getByRole("status")).toHaveTextContent("Carregando sua coleção");
    expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toBeEnabled();
    const heading = await screen.findByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" });
    expect(heading).toHaveClass("text-white");
    expect(heading.querySelectorAll(".mx-2")).toHaveLength(2);
    expect(heading.querySelector("span.font-bold")).toHaveTextContent("Coleção incompleta");
    expect(heading.querySelector(".rounded-full")).not.toBeInTheDocument();
    expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toBeEnabled();
    const edition = screen.getByRole("region", { name: "1ª edição de Monster" });
    expect(heading.nextElementSibling).toHaveTextContent("1/60 volumes adquiridos · 0/1 volumes lidos · 3/59 volumes faltantes desejados");
    const manage = within(edition).getByRole("button", { name: "Gerenciar volumes" });
    expect(manage).toHaveAttribute("aria-expanded", "false");
    expect(manage).toHaveClass("h-9", "rounded-lg", "bg-sidebar", "text-sm");
    expect(within(edition).queryByRole("link", { name: "1/60 adquiridos" })).not.toBeInTheDocument();
    fireEvent.click(manage);
    expect(manage).toHaveAttribute("aria-expanded", "true");
    expect(manage).toHaveClass("border-primary");
    expect(within(edition).getByRole("link", { name: "1/60 adquiridos" })).toHaveAttribute("href", "/obra/monster/edicao/1/selecionar/colecao");
    expect(within(edition).getByRole("link", { name: "0/1 lidos" })).toHaveAttribute("href", "/obra/monster/edicao/1/selecionar/lidos");
    expect(within(edition).getByRole("link", { name: "3/59 desejados" })).toHaveAttribute("href", "/obra/monster/edicao/1/selecionar/desejos");
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(within(edition).queryByText("Panini")).not.toBeInTheDocument();
    expect(edition).toHaveClass("border-b", "border-border", "pb-3", "pt-6");
    expect(edition).not.toHaveClass("rounded-xl");
    const volumeRow = within(edition).getByRole("link", { name: "Ver 1ª edição de Monster" });
    expect(volumeRow).toHaveClass("flex", "-ml-3", "rounded-2xl", "hover:bg-sidebar-accent/30");
    expect(volumeRow).not.toHaveClass("border");
    expect(volumeRow).not.toContainElement(heading);
    expect(heading.closest("a")).toBeNull();
    expect(volumeRow.querySelector("a")).toBeNull();
    expect(within(volumeRow).getByText("Sem capa").closest(".w-24")).toHaveClass("w-24", "shrink-0");
    expect(within(volumeRow).queryByText("Volume 1")).not.toBeInTheDocument();
    expect(within(volumeRow).queryByText("Não lido")).not.toBeInTheDocument();
    expect(volumeRow.querySelector("svg.lucide-chevron-right")).toBeInTheDocument();
    expect(within(edition).queryByRole("link", { name: /Ver Volume/ })).not.toBeInTheDocument();
    expect(within(edition).queryByRole("button", { name: /Marcar|Remover da coleção/ })).not.toBeInTheDocument();
  });
  it("abre a edição apenas pela faixa das capas e mantém atalhos independentes para os seletores", async () => {
    mount();
    const edition = await screen.findByRole("region", { name: "1ª edição de Monster" });
    expect(within(edition).getByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" })).toBeInTheDocument();
    expect(within(edition).getByRole("link", { name: "Ver 1ª edição de Monster" })).toHaveAttribute("href", "/obra/monster/edicao/1");
    expect(within(edition).getAllByRole("link")).toHaveLength(1);
    fireEvent.click(within(edition).getByRole("button", { name: "Gerenciar volumes" }));
    expect(within(edition).getAllByRole("link")).toHaveLength(4);
  });
  it.each([
    ["Completa", 60, "Coleção completa"],
    ["Cancelada", 60, "Coleção completa"],
    ["Em andamento", 60, "Coleção em dia"],
    ["Em hiato", 60, "Coleção em dia"],
    ["Em andamento", 59, "Coleção incompleta"],
    ["Completa", 59, "Coleção incompleta"],
  ])("classifica edição %s com %i volumes adquiridos como %s", async (publicationStatus, owned, expected) => {
    const data = response(false, owned);
    data.works[0].editions[0].edition.brazilPublicationStatus = publicationStatus;
    vi.mocked(listCollection).mockResolvedValue(data);
    mount();
    const edition = await screen.findByRole("region", { name: "1ª edição de Monster" });
    expect(within(edition).getByRole("heading", { name: `Monster · 1ª edição · ${expected}` })).toBeInTheDocument();
    expect(within(edition).queryByText(/volumes faltantes desejados/) !== null).toBe(owned < 60);
    fireEvent.click(within(edition).getByRole("button", { name: "Gerenciar volumes" }));
    expect(within(edition).queryByRole("link", { name: /desejados/ }) !== null).toBe(owned < 60);
  });
  it("fecha o gerenciamento com Escape, clique externo e ao sair pelo teclado", async () => {
    mount();
    const edition = await screen.findByRole("region", { name: "1ª edição de Monster" });
    const manage = within(edition).getByRole("button", { name: "Gerenciar volumes" });
    fireEvent.click(manage);
    const owned = within(edition).getByRole("link", { name: "1/60 adquiridos" });
    owned.focus();
    fireEvent.keyDown(owned, { key: "Escape" });
    expect(manage).toHaveFocus();
    expect(manage).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(manage);
    fireEvent.pointerDown(document.body);
    expect(manage).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(manage);
    fireEvent.blur(manage, { relatedTarget: screen.getByRole("searchbox", { name: "Pesquisar na coleção" }) });
    expect(manage).toHaveAttribute("aria-expanded", "false");
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
  it("avisa sobre falha inicial sem mostrar estado vazio; mostra o convite quando não há volumes", async () => {
    vi.mocked(listCollection).mockRejectedValueOnce(new Error("offline"));
    const first = mount();
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Não foi possível carregar seu acervo. Tente novamente em instantes.", { id: "personal-library-load-error" }));
    expect(screen.queryByRole("link", { name: "Explorar catálogo" })).not.toBeInTheDocument();
    expect(vi.mocked(toast.error).mock.lastCall?.[1]).not.toHaveProperty("action");
    first.unmount();
    vi.mocked(listCollection).mockResolvedValue({ works: [], totals: { editions: 0, volumes: 0 }, pagination: { page: 1, limit: 12, total: 0, totalPages: 0 } });
    mount();
    await screen.findByText("Você ainda não adicionou nenhum volume à sua coleção!");
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
  it("oferece Em dia depois de Incompleta e envia o filtro à API", async () => {
    mount();
    await screen.findByRole("heading", { name: "Monster · 1ª edição · Coleção incompleta" });
    fireEvent.click(screen.getByRole("button", { name: "Status da coleção" }));
    expect(screen.getAllByRole("button", { name: /^(Completa|Incompleta|Em dia)$/ }).map(button => button.textContent)).toEqual(["Completa", "Incompleta", "Em dia"]);
    fireEvent.click(screen.getByRole("button", { name: "Em dia" }));
    await waitFor(() => expect(listCollection).toHaveBeenCalledWith(1, { status: "up-to-date" }));
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
