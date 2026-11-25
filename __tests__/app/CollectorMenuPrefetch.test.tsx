import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CollectorMenuPrefetch } from "@/app/CollectorMenuPrefetch";
import Colecao from "@/features/collection/pages/Colecao";
import { addCollectionVolume, addWishlistVolume, removeWishlistVolume, syncWishlist, collectionQueryPrefix, syncCollectionEdition, type CollectionResponse } from "@/features/personal-library";
import { PERSONAL_LIBRARY_QUERY_ROOT, PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { api } from "@/services/api";

const mocks = vi.hoisted(() => ({ scope: ["cache-user", false, "Usuário Padrão"] as const }));
vi.mock("@/services/api", () => ({ api: { get: vi.fn(), put: vi.fn(), delete: vi.fn() } }));
vi.mock("@/features/auth", () => ({ useAuth: () => ({
  user: { id: mocks.scope[0] }, isAuthenticated: true, activeProfile: "Usuário Padrão", loading: false,
}) }));
vi.mock("@/features/public-catalog", async original => ({
  ...(await original<typeof import("@/features/public-catalog")>()),
  usePublicCatalogScope: () => mocks.scope,
  getPublicCatalogOptions: vi.fn().mockResolvedValue({ brazilianPublishers: [] }),
  listPublicWorks: vi.fn().mockResolvedValue({ works: [] }),
  listPublicEditions: vi.fn().mockResolvedValue({ editions: [] }),
  listPublicCalendar: vi.fn().mockResolvedValue({ volumes: [] }),
  prefetchListedEditions: vi.fn().mockResolvedValue(undefined),
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => { resolve = done; });
  return { promise, resolve };
}

function collection(title: string, owned = 1): CollectionResponse {
  return {
    works: [{ work: { id: 1, slug: "obra", title }, editions: [{
      edition: { id: 20, chronologicalNumber: 1, brazilPublicationStatus: "Em andamento", brazilianPublisher: { id: 3, label: "Editora" } },
      progress: { owned, total: 5, read: 0, wished: 0 },
      volumes: Array.from({ length: owned }, (_, index) => ({ id: index + 1, number: index + 1, singleVolume: false, read: false })),
      volumesPagination: { page: 1, limit: 11, total: owned, totalPages: 1 },
    }] }],
    totals: { editions: 1, volumes: owned },
    pagination: { page: 1, limit: 12, total: 1, totalPages: 1 },
  };
}

const collectionKey = [...collectionQueryPrefix(mocks.scope[0], "", "", ""), 1];
const filterKey = [...PERSONAL_LIBRARY_QUERY_ROOT, mocks.scope[0], "collection-filters"];
const oldCollection = collection("Obra antiga");
const newCollection = collection("Obra atualizada", 2);
const clients: QueryClient[] = [];

function createClient() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity, gcTime: Infinity } } });
  client.setQueryData(collectionKey, oldCollection);
  clients.push(client);
  return client;
}

function arrangeCollectionFetch(...responses: Promise<CollectionResponse>[]) {
  vi.mocked(api.get).mockImplementation(async url => {
    if (url === "/users/me/collection") {
      const next = responses.shift();
      if (!next) throw new Error("Requisição extra à coleção");
      return { data: await next };
    }
    return { data: { volumes: [], totals: { volumes: 0 }, pagination: { page: 1, limit: 24, total: 0, totalPages: 0 } } };
  });
}

function mount(client: QueryClient, path = "/origem") {
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>
    <CollectorMenuPrefetch />
    <Routes>
      <Route path="/origem" element={<Link to="/colecao">Abrir coleção</Link>} />
      <Route path="/colecao" element={<Colecao isAuthenticated />} />
    </Routes>
  </MemoryRouter></QueryClientProvider>);
}

describe("atualização do cache do menu coleção", () => {
  it.each([
    ["adicionar aos desejos", () => addWishlistVolume(7)],
    ["remover dos desejos", () => removeWishlistVolume(7)],
    ["salvar selecionador de desejos", () => syncWishlist(20, { addVolumeIds: [7], removeVolumeIds: [] })],
  ])("invalida lançamentos após %s em outro menu, preservando outros leitores", async (_, operation) => {
    const client = createClient();
    const calendarKey = [...PUBLIC_CATALOG_QUERY_ROOT, mocks.scope, "calendar", { page: 2 }];
    const otherUserKey = [...PUBLIC_CATALOG_QUERY_ROOT, ["other-user", false, "Usuário Padrão"], "calendar"];
    client.setQueryData(calendarKey, { volumes: [] });
    client.setQueryData(otherUserKey, { volumes: [] });
    arrangeCollectionFetch(Promise.resolve(newCollection));
    mount(client);
    await act(async () => { await operation(); });
    expect(client.getQueryState(calendarKey)?.isInvalidated).toBe(true);
    expect(client.getQueryState(otherUserKey)?.isInvalidated).toBe(false);
  });
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(api.put).mockReset().mockResolvedValue({ data: { volumeId: 7, owned: true, read: false, wished: false } });
  });
  afterEach(() => { clients.splice(0).forEach(client => client.clear()); });

  it.each([
    ["página do volume", () => addCollectionVolume(7)],
    ["selecionador da edição", () => syncCollectionEdition(20, { addVolumeIds: [7], removeVolumeIds: [] })],
  ])("descarta dados antigos ao adicionar pela %s e mostra carregamento ao abrir o menu", async (_, operation) => {
    const client = createClient();
    const filteredKey = [...collectionQueryPrefix(mocks.scope[0], "Monster", "incomplete", "3"), 2];
    const otherUserKey = [...collectionQueryPrefix("other-user", "", "", ""), 1];
    client.setQueryData(filteredKey, oldCollection);
    client.setQueryData(otherUserKey, oldCollection);
    const pending = deferred<CollectionResponse>();
    arrangeCollectionFetch(pending.promise);
    mount(client);
    await act(async () => { await operation(); });
    expect(client.getQueryData(collectionKey)).toBeUndefined();
    expect(client.getQueryData(filteredKey)).toBeUndefined();
    expect(client.getQueryData(otherUserKey)).toEqual(oldCollection);
    expect(api.get).toHaveBeenCalledWith("/users/me/collection", { params: { page: 1, limit: 12 } });
    fireEvent.click(screen.getByRole("link", { name: "Abrir coleção" }));
    expect(await screen.findByRole("status", { name: "Carregando sua coleção" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Obra antiga/ })).not.toBeInTheDocument();
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === "/users/me/collection")).toHaveLength(1);
    await act(async () => { pending.resolve(newCollection); await pending.promise; });
    expect(await screen.findByRole("heading", { name: /Obra atualizada/ })).toBeInTheDocument();
    expect(screen.queryByRole("status", { name: "Carregando sua coleção" })).not.toBeInTheDocument();
  });

  it("reseta a coleção já aberta e preserva os filtros selecionados", async () => {
    const client = createClient();
    const filters = { searchTerm: "", term: "", status: "incomplete", publisherId: "", order: "ASC" };
    const filteredKey = [...collectionQueryPrefix(mocks.scope[0], "", "incomplete", ""), 1];
    client.setQueryData(filterKey, filters);
    client.setQueryData(filteredKey, oldCollection);
    const pending = deferred<CollectionResponse>();
    arrangeCollectionFetch(pending.promise, pending.promise);
    mount(client, "/colecao");
    await screen.findByRole("heading", { name: /Obra antiga/ });
    await act(async () => { await addCollectionVolume(7); });
    expect(await screen.findByRole("status", { name: "Carregando sua coleção" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /Obra antiga/ })).not.toBeInTheDocument();
    expect(client.getQueryData(filterKey)).toEqual(filters);
    expect(api.get).toHaveBeenCalledWith("/users/me/collection", { params: { page: 1, limit: 12, status: "incomplete" } });
    await act(async () => { pending.resolve(newCollection); await pending.promise; });
    expect(await screen.findByRole("heading", { name: /Obra atualizada/ })).toBeInTheDocument();
  });

  it("não deixa uma busca anterior sobrescrever a coleção após duas alterações rápidas", async () => {
    const client = createClient();
    const oldRequest = deferred<CollectionResponse>();
    const freshRequest = deferred<CollectionResponse>();
    arrangeCollectionFetch(oldRequest.promise, freshRequest.promise);
    mount(client);
    await act(async () => { await addCollectionVolume(7); });
    await act(async () => { await addCollectionVolume(8); });
    await act(async () => { freshRequest.resolve(newCollection); await freshRequest.promise; });
    await waitFor(() => expect(client.getQueryData(collectionKey)).toEqual(newCollection));
    await act(async () => { oldRequest.resolve(oldCollection); await oldRequest.promise; });
    expect(client.getQueryData(collectionKey)).toEqual(newCollection);
  });

  it("mantém o cache quando a API recusa a alteração", async () => {
    const client = createClient();
    arrangeCollectionFetch();
    vi.mocked(api.put).mockRejectedValueOnce(new Error("Não foi possível salvar"));
    mount(client);
    await act(async () => { await expect(addCollectionVolume(7)).rejects.toThrow("Não foi possível salvar"); });
    expect(client.getQueryData(collectionKey)).toEqual(oldCollection);
    expect(vi.mocked(api.get).mock.calls.filter(([url]) => url === "/users/me/collection")).toHaveLength(0);
  });
});
