import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";
import { addCollectionVolume, addWishlistVolume, getCompleteCollectionEdition, listCollection, listWishlist, removeCollectionVolume, removeWishlistVolume, subscribePersonalLibraryUpdates, syncCollectionEdition, syncWishlist, updateVolumeReading } from "@/features/personal-library/personalLibraryService";
vi.mock("@/services/api", () => ({ api: { get: vi.fn(), put: vi.fn(), patch: vi.fn(), delete: vi.fn() } }));
describe("cliente do acervo pessoal", () => {
  beforeEach(() => { vi.clearAllMocks(); });
  it("pagina listas e carrega todos os volumes de uma Edição em uma chamada", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { works: [] } }).mockResolvedValueOnce({ data: { volumes: [] } })
      .mockResolvedValueOnce({ data: { edition: { id: 2 }, volumes: [{ id: 1 }, { id: 2 }], pagination: { totalPages: 1 } } });
    await listCollection(2); await listWishlist(3);
    expect((await getCompleteCollectionEdition(2)).volumes).toEqual([{ id: 1 }, { id: 2 }]);
    expect(api.get).toHaveBeenNthCalledWith(1, "/users/me/collection", { params: { page: 2, limit: 12 } });
    expect(api.get).toHaveBeenNthCalledWith(2, "/users/me/wishlist", { params: { page: 3, limit: 24 } });
    expect(api.get).toHaveBeenLastCalledWith("/users/me/collection/editions/2", { params: { all: true } });
  });
  it("envia os filtros da coleção junto da paginação", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { works: [] } });
    await listCollection(2, { term: "Monster", status: "incomplete", brazilianPublisherId: 4 });
    expect(api.get).toHaveBeenCalledWith("/users/me/collection", { params: { page: 2, limit: 12, term: "Monster", status: "incomplete", brazilianPublisherId: 4 } });
  });
  it("envia os filtros dos desejos junto da paginação", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { volumes: [] } });
    await listWishlist(2, { term: "Monster", brazilianPublisherId: 4 });
    expect(api.get).toHaveBeenCalledWith("/users/me/wishlist", { params: { page: 2, limit: 24, term: "Monster", brazilianPublisherId: 4 } });
  });
  it("usa os verbos do contrato e emite invalidação apenas após confirmação", async () => {
    const callback = vi.fn(); const unsubscribe = subscribePersonalLibraryUpdates(callback);
    vi.mocked(api.put).mockResolvedValue({ data: { volumeId: 7, owned: true, read: false, wished: false } });
    vi.mocked(api.patch).mockResolvedValue({ data: { volumeId: 7, read: true } });
    await addCollectionVolume(7); await updateVolumeReading(7, true); await removeCollectionVolume(7);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(api.patch).toHaveBeenCalledWith("/users/me/collection/volumes/7", { read: true });
    expect(api.delete).toHaveBeenCalledWith("/users/me/collection/volumes/7");
    await addWishlistVolume(7); await removeWishlistVolume(7);
    await syncCollectionEdition(2, { addVolumeIds: [7], removeVolumeIds: [] });
    expect(callback).toHaveBeenCalledTimes(6);
    vi.mocked(api.put).mockRejectedValueOnce(new Error("rede"));
    await expect(addCollectionVolume(8)).rejects.toThrow("rede");
    expect(callback).toHaveBeenCalledTimes(6); unsubscribe();
    await removeWishlistVolume(8); expect(callback).toHaveBeenCalledTimes(6);
  });
  it("retorna falhas parciais e interrompe novos pedidos após mudar a sessão", async () => {
    vi.mocked(api.put).mockResolvedValue({ data: {} }).mockRejectedValueOnce(new Error("conflito"));
    expect(await syncWishlist({ addVolumeIds: [1, 2], removeVolumeIds: [3] })).toHaveLength(1);
    expect(api.delete).toHaveBeenCalledWith("/users/me/wishlist/volumes/3");
    vi.clearAllMocks();
    await syncWishlist({ addVolumeIds: [1, 2, 3, 4, 5], removeVolumeIds: [] }, () => false);
    expect(api.put).not.toHaveBeenCalled();
  });
});
