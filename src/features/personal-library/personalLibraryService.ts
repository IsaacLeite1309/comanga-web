import { api } from "@/services/api";
import type { CollectionDelta, CollectionEditionResponse, CollectionResponse, PersonalVolumeState, WishlistResponse } from "./personalLibraryTypes";

const ROOT = "/users/me";
const UPDATED = "comanga:personal-library-updated";
export function subscribePersonalLibraryUpdates(callback: () => void) {
  window.addEventListener(UPDATED, callback);
  return () => window.removeEventListener(UPDATED, callback);
}
function updated() { window.dispatchEvent(new Event(UPDATED)); }
export async function listCollection(page = 1) {
  return (await api.get<CollectionResponse>(`${ROOT}/collection`, { params: { page, limit: 12 } })).data;
}
export async function listWishlist(page = 1) {
  return (await api.get<WishlistResponse>(`${ROOT}/wishlist`, { params: { page, limit: 24 } })).data;
}
export async function getCollectionEdition(editionId: number, query = { page: 1, limit: 50 }) {
  return (await api.get<CollectionEditionResponse>(`${ROOT}/collection/editions/${editionId}`, { params: query })).data;
}
export async function getCompleteCollectionEdition(editionId: number) {
  const first = await getCollectionEdition(editionId);
  const volumes = [...first.volumes];
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    volumes.push(...(await getCollectionEdition(editionId, { page, limit: 50 })).volumes);
  }
  return { ...first, volumes };
}
export async function addCollectionVolume(volumeId: number) {
  const response = await api.put<PersonalVolumeState>(`${ROOT}/collection/volumes/${volumeId}`);
  updated(); return response.data;
}
export async function updateVolumeReading(volumeId: number, read: boolean) {
  const response = await api.patch<PersonalVolumeState>(`${ROOT}/collection/volumes/${volumeId}`, { read });
  updated(); return response.data;
}
export async function removeCollectionVolume(volumeId: number) {
  await api.delete(`${ROOT}/collection/volumes/${volumeId}`); updated();
}
export async function addWishlistVolume(volumeId: number) {
  const response = await api.put<Omit<PersonalVolumeState, "read">>(`${ROOT}/wishlist/volumes/${volumeId}`);
  updated(); return { ...response.data, read: null };
}
export async function removeWishlistVolume(volumeId: number) {
  await api.delete(`${ROOT}/wishlist/volumes/${volumeId}`); updated();
}
export async function syncCollectionEdition(editionId: number, delta: CollectionDelta) {
  const response = await api.put<{ editionId: number; addedVolumeIds: number[]; removedVolumeIds: number[] }>(`${ROOT}/collection/editions/${editionId}`, delta);
  updated(); return response.data;
}
export async function syncWishlist(delta: CollectionDelta, shouldContinue = () => true) {
  const changes = [
    ...delta.removeVolumeIds.map((id) => () => removeWishlistVolume(id)),
    ...delta.addVolumeIds.map((id) => () => addWishlistVolume(id)),
  ];
  const failures: unknown[] = [];
  for (let index = 0; index < changes.length; index += 4) {
    if (!shouldContinue()) break;
    const results = await Promise.allSettled(changes.slice(index, index + 4).map((change) => change()));
    for (const result of results) if (result.status === "rejected") failures.push(result.reason);
  }
  return failures;
}
