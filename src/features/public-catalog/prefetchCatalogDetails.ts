import type { QueryClient } from "@tanstack/react-query";
import { getPublicEditionDetails, getPublicVolumeDetails } from "./publicCatalogService";
import type { PublicEditionDetailsResponse, PublicWorkDetails, PublicVolumeDetails } from "./publicCatalogTypes";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";

type Scope = readonly [string, boolean, string];
type EditionRoute = { workSlug: string; editionNumber: number };
type VolumeRoute = EditionRoute & { volumeNumber: number };
const CONCURRENCY = 3;

async function prefetchMany<T, R>(items: T[], task: (item: T) => Promise<R>) {
  let next = 0;
  const results: Array<R | undefined> = Array(items.length);
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      try { results[index] = await task(items[index]); } catch { /* Uma falha não impede os demais itens. */ }
    }
  }));
  return results;
}

export function fetchEditionDetails(queryClient: QueryClient, scope: Scope, workSlug: string, editionNumber: number) {
  return queryClient.fetchQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "edition", workSlug, editionNumber],
    queryFn: async () => {
      const details = await getPublicEditionDetails(workSlug, editionNumber, { all: true });
      if (details.edition.work.slug !== workSlug || details.edition.chronologicalNumber !== editionNumber) {
        throw new Error("Edição não encontrada.");
      }
      return details;
    },
  });
}

export function fetchVolumeDetails(queryClient: QueryClient, scope: Scope, workSlug: string, editionNumber: number, volumeNumber: number) {
  return queryClient.fetchQuery({
    queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "volume", workSlug, editionNumber, volumeNumber],
    queryFn: async () => {
      const volume = await getPublicVolumeDetails(workSlug, editionNumber, volumeNumber);
      if (volume.edition.work.slug !== workSlug || volume.edition.chronologicalNumber !== editionNumber || volume.number !== volumeNumber) {
        throw new Error("Volume não encontrado.");
      }
      return volume;
    },
  });
}

export function prefetchWorkEditions(queryClient: QueryClient, scope: Scope, work: PublicWorkDetails) {
  return prefetchMany(work.editions, (edition) =>
    fetchEditionDetails(queryClient, scope, work.slug, edition.chronologicalNumber));
}

export async function prefetchListedEditions(
  queryClient: QueryClient,
  scope: Scope,
  editions: EditionRoute[],
  volumeLimit = 0,
  preferredVolumes: VolumeRoute[] = [],
) {
  const details = await prefetchMany(editions, (edition) =>
    fetchEditionDetails(queryClient, scope, edition.workSlug, edition.editionNumber));
  if (volumeLimit <= 0) return;

  const volumes = new Map<string, VolumeRoute>();
  const include = (volume: VolumeRoute) => {
    volumes.set(`${volume.workSlug}/${volume.editionNumber}/${volume.volumeNumber}`, volume);
  };
  if (preferredVolumes.length > 0) preferredVolumes.forEach(include);
  else details.forEach((result) => result?.volumes.forEach((volume) => include({
    workSlug: result.edition.work.slug,
    editionNumber: result.edition.chronologicalNumber,
    volumeNumber: volume.number,
  })));
  await prefetchMany([...volumes.values()].slice(0, volumeLimit), (volume) =>
    fetchVolumeDetails(queryClient, scope, volume.workSlug, volume.editionNumber, volume.volumeNumber));
}

export function prefetchEditionVolumes(queryClient: QueryClient, scope: Scope, details: PublicEditionDetailsResponse) {
  return prefetchMany(details.volumes, (volume) =>
    fetchVolumeDetails(queryClient, scope, details.edition.work.slug, details.edition.chronologicalNumber, volume.number));
}

export function prefetchAdjacentVolumes(queryClient: QueryClient, scope: Scope, volume: PublicVolumeDetails) {
  const neighbors = [volume.previousVolume, volume.nextVolume].filter((neighbor) => neighbor !== null);
  return prefetchMany(neighbors, (neighbor) =>
    fetchVolumeDetails(queryClient, scope, volume.edition.work.slug, volume.edition.chronologicalNumber, neighbor.number));
}
