import { api } from "@/services/api";
import type { CollectionDelta, CollectionEditionResponse, CollectionResponse, PersonalVolumeState, WishlistResponse } from "./personalLibraryTypes";

const ROOT = "/users/me";
const UPDATED = "comanga:personal-library-updated";
export function subscribePersonalLibraryUpdates(callback: () => void) {
  window.addEventListener(UPDATED, callback);
  return () => window.removeEventListener(UPDATED, callback);
}
function updated() { window.dispatchEvent(new Event(UPDATED)); }
export interface CollectionFilters {
  term?: string;
  status?: "complete" | "incomplete";
  brazilianPublisherId?: number;
  order?: "ASC" | "DESC";
}
export async function listCollection(page = 1, filters: CollectionFilters = {}) {
  return (await api.get<CollectionResponse>(`${ROOT}/collection`, { params: { page, limit: 12, ...filters } })).data;
}
export interface WishlistFilters { term?: string; brazilianPublisherId?: number; order?: "ASC" | "DESC" }
export async function listWishlist(page = 1, filters: WishlistFilters = {}) {
  return (await api.get<WishlistResponse>(`${ROOT}/wishlist`, { params: { page, limit: 24, ...filters } })).data;
}
export async function getCollectionEdition(editionId: number, query: { page: number; limit: number } | { all: true } = { page: 1, limit: 50 }) {
  return (await api.get<CollectionEditionResponse>(`${ROOT}/collection/editions/${editionId}`, { params: query })).data;
}
export async function getCompleteCollectionEdition(editionId: number) {
  return getCollectionEdition(editionId, { all: true });
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
export async function syncWishlist(editionId: number, delta: CollectionDelta) {
  const response = await api.put(`${ROOT}/wishlist/editions/${editionId}`, delta);
  updated(); return response.data;
}
export async function syncReading(editionId: number, delta: CollectionDelta) {
  const response = await api.put(`${ROOT}/reading/editions/${editionId}`, delta);
  updated(); return response.data;
}
