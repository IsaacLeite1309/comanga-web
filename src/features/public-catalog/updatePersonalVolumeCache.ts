import type { QueryClient } from "@tanstack/react-query";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import type {
  PublicEditionDetailsResponse,
  PublicPersonalSummary,
  PublicPersonalVolumeState,
  PublicVolumeDetails,
  PublicVolumePreview,
  PublicWorkDetails,
} from "./publicCatalogTypes";

export interface PersonalVolumeCacheChange {
  workSlug: string;
  editionId: number;
  editionNumber: number;
  volumeId: number;
  volumeNumber: number;
  previous: PublicPersonalVolumeState;
  next: PublicPersonalVolumeState;
}

const EMPTY: PublicPersonalVolumeState = { owned: false, read: null, wished: false };

function sameState(a: PublicPersonalVolumeState, b: PublicPersonalVolumeState) {
  return a.owned === b.owned && a.read === b.read && a.wished === b.wished;
}

function updateSummary(summary: PublicPersonalSummary | undefined, previous: PublicPersonalVolumeState, next: PublicPersonalVolumeState) {
  if (!summary || sameState(previous, next)) return summary;
  return {
    ownedCount: summary.ownedCount + Number(next.owned) - Number(previous.owned),
    readCount: summary.readCount + Number(Boolean(next.read)) - Number(Boolean(previous.read)),
    wishedCount: summary.wishedCount + Number(next.wished) - Number(previous.wished),
  };
}

function updatePreview<T extends PublicVolumePreview>(volume: T, change: PersonalVolumeCacheChange): T {
  if (volume.id !== change.volumeId || sameState(volume.personal ?? EMPTY, change.next)) return volume;
  return { ...volume, personal: change.next };
}

function updateWork(work: PublicWorkDetails | undefined, change: PersonalVolumeCacheChange) {
  if (!work || work.slug !== change.workSlug) return work;
  const edition = work.editions.find((item) => item.id === change.editionId);
  if (!edition) return work;
  const previous = edition.volumes.find((item) => item.id === change.volumeId)?.personal ?? change.previous;
  if (sameState(previous, change.next)) return work;
  return {
    ...work,
    personal: updateSummary(work.personal, previous, change.next),
    editions: work.editions.map((item) => item.id === change.editionId ? {
      ...item,
      personal: updateSummary(item.personal, previous, change.next),
      volumes: item.volumes.map((volume) => updatePreview(volume, change)),
    } : item),
  };
}

function updateEdition(response: PublicEditionDetailsResponse | undefined, change: PersonalVolumeCacheChange) {
  if (!response || response.edition.id !== change.editionId) return response;
  const previous = response.volumes.find((item) => item.id === change.volumeId)?.personal ?? change.previous;
  if (sameState(previous, change.next)) return response;
  return {
    ...response,
    edition: { ...response.edition, personal: updateSummary(response.edition.personal, previous, change.next) },
    volumes: response.volumes.map((volume) => updatePreview(volume, change)),
  };
}

export function updatePersonalVolumeCache(
  queryClient: QueryClient,
  scope: readonly [string, boolean, string],
  change: PersonalVolumeCacheChange,
) {
  const key = [...PUBLIC_CATALOG_QUERY_ROOT, scope] as const;
  queryClient.setQueryData<PublicWorkDetails>([...key, "work", change.workSlug], (work) => updateWork(work, change));
  queryClient.setQueriesData<PublicEditionDetailsResponse>(
    { queryKey: [...key, "edition", change.workSlug, change.editionNumber] },
    (response) => updateEdition(response, change),
  );
  queryClient.setQueryData<PublicVolumeDetails>(
    [...key, "volume", change.workSlug, change.editionNumber, change.volumeNumber],
    (volume) => volume && volume.id === change.volumeId ? { ...volume, personal: change.next } : volume,
  );
}
