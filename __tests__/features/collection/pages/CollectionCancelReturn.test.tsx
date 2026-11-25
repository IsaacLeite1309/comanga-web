import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import Colecao from "@/features/collection/pages/Colecao";
import EditionVolumeSelection from "@/features/public-catalog/pages/EditionVolumeSelection";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";
import { getCompleteCollectionEdition, listCollection, syncCollectionEdition, syncReading, syncWishlist, type CollectionResponse } from "@/features/personal-library";
import { PERSONAL_LIBRARY_QUERY_ROOT } from "@/lib/queryClient";

vi.mock("@/features/auth", () => ({ useAuth: () => ({ user: { id: "reader", active_profile: "Usuário Padrão" } }) }));
vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicCatalogOptions: vi.fn().mockResolvedValue({ brazilianPublishers: [] }), getPublicEditionDetails: vi.fn(),
}));
vi.mock("@/features/personal-library", async original => ({
  ...await original<typeof import("@/features/personal-library")>(),
  listCollection: vi.fn(), getCompleteCollectionEdition: vi.fn(), syncCollectionEdition: vi.fn(), syncReading: vi.fn(), syncWishlist: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const work = { id: 8, slug: "monster", title: "Monster" };
const edition = { id: 20, chronologicalNumber: 1, brazilPublicationStatus: "Em andamento", brazilianPublisher: { id: 1, label: "Editora" } };
const volume = { id: 30, number: 1, singleVolume: false, read: false };
const progress = { owned: 1, total: 2, read: 0, wished: 0 };
function collection(page: number): CollectionResponse {
  return { works: [{ work, editions: [{ edition, progress, volumes: [volume], volumesPagination: { page: 1, limit: 11, total: 1, totalPages: 1 } }] }],
    totals: { editions: 13, volumes: 13 }, pagination: { page, limit: 12, total: 13, totalPages: 2 } };
}

const modes = ["colecao", "lidos", "desejos"] as const;
let client: QueryClient;
beforeEach(() => {
  vi.clearAllMocks();
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  vi.spyOn(window, "scrollY", "get").mockReturnValue(760);
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  client.setQueryData([...PERSONAL_LIBRARY_QUERY_ROOT, "reader", "collection-filters"], { searchTerm: "Monster", term: "Monster", status: "incomplete", publisherId: "", order: "ASC" });
  vi.mocked(listCollection).mockImplementation(async page => collection(page));
  vi.mocked(getPublicEditionDetails).mockResolvedValue({ edition: { ...edition, work, volumesCount: 2 }, volumes: [], pagination: { page: 1, limit: 1, total: 2, totalPages: 2 } } as unknown as Awaited<ReturnType<typeof getPublicEditionDetails>>);
  vi.mocked(getCompleteCollectionEdition).mockResolvedValue({ edition: { ...edition, work }, progress,
    volumes: [{ ...volume, owned: true, wished: false }], pagination: { page: 1, limit: 50, total: 1, totalPages: 1 } });
});
afterEach(() => { client.clear(); vi.restoreAllMocks(); });

function mount() {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={["/colecao"]}><Routes>
    <Route path="/colecao" element={<Colecao isAuthenticated />} />
    {modes.map(mode => <Route key={mode} path={`/obra/:slug/edicao/:editionNumber/selecionar/${mode}`} element={<EditionVolumeSelection mode={mode} />} />)}
  </Routes></MemoryRouter></QueryClientProvider>);
}

async function openManagement(mode: typeof modes[number]) {
  mount();
  fireEvent.click(await screen.findByRole("button", { name: "Próxima" }));
  await screen.findByText("Página 2 de 2");
  fireEvent.click(screen.getByRole("button", { name: "Gerenciar volumes" }));
  fireEvent.click(screen.getByRole("link", { name: mode === "colecao" ? "1/2 adquiridos" : mode === "lidos" ? "0/1 lidos" : "0/1 desejados" }));
}

it.each(modes)("Cancelar em %s restaura página 2, filtros e rolagem, sem salvar", async mode => {
  await openManagement(mode);
  if (mode === "desejos") await screen.findByText("Nenhum volume faltante nesta edição.");
  else await screen.findByRole("button", { name: /^(Selecionar|Desmarcar) Volume 1$/ });
  vi.mocked(window.scrollTo).mockClear();
  fireEvent.click(screen.getByRole("link", { name: "Cancelar" }));
  await screen.findByText("Página 2 de 2");
  expect(screen.getByRole("searchbox", { name: "Pesquisar na coleção" })).toHaveValue("Monster");
  expect(screen.getByRole("button", { name: "Status da coleção" })).toHaveTextContent("Incompleta");
  await waitFor(() => expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 760, behavior: "instant" }));
  expect(syncCollectionEdition).not.toHaveBeenCalled();
  expect(syncReading).not.toHaveBeenCalled();
  expect(syncWishlist).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Anterior" }));
  await screen.findByText("Página 1 de 2");
});

it("restaura após carregar os resultados ao cancelar durante o carregamento do seletor", async () => {
  vi.mocked(getCompleteCollectionEdition).mockImplementation(() => new Promise(() => {}));
  await openManagement("colecao");
  expect(screen.getByRole("status", { name: "Carregando seleção de volumes" })).toBeInTheDocument();
  client.removeQueries({ queryKey: [...PERSONAL_LIBRARY_QUERY_ROOT, "reader", "collection"] });
  let resolve!: (value: CollectionResponse) => void;
  vi.mocked(listCollection).mockImplementationOnce(() => new Promise(done => { resolve = done; }));
  vi.mocked(window.scrollTo).mockClear();
  fireEvent.click(screen.getByRole("link", { name: "Cancelar" }));
  expect(await screen.findByRole("status", { name: "Carregando sua coleção" })).toBeInTheDocument();
  expect(window.scrollTo).not.toHaveBeenCalledWith({ top: 760, behavior: "instant" });
  await act(async () => { resolve(collection(2)); });
  await screen.findByText("Página 2 de 2");
  expect(listCollection).toHaveBeenLastCalledWith(2, { term: "Monster", status: "incomplete" });
  await waitFor(() => expect(window.scrollTo).toHaveBeenLastCalledWith({ top: 760, behavior: "instant" }));
});
