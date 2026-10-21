import { useCallback, useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { getPublicEditionDetails } from "../publicCatalogService";
import type { PublicEditionDetailsResponse } from "../publicCatalogTypes";
import { updatePersonalVolumeCache } from "../updatePersonalVolumeCache";
import { usePublicCatalogScope } from "../usePublicCatalogScope";
import { getCompleteCollectionEdition, syncCollectionEdition, syncWishlist, updateVolumeReading, type CollectionEditionResponse } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT, PUBLIC_CATALOG_STALE_TIME_MS } from "@/lib/queryClient";

export type SelectionMode = "colecao" | "desejos" | "lidos";

function asCollectionEdition(response: PublicEditionDetailsResponse): CollectionEditionResponse {
  const { edition, volumes, pagination } = response;
  return {
    edition: {
      id: edition.id,
      chronologicalNumber: edition.chronologicalNumber,
      brazilPublicationStatus: edition.brazilPublicationStatus,
      brazilianPublisher: edition.brazilianPublisher,
      work: {
        id: edition.work.id,
        slug: edition.work.slug,
        title: edition.work.title,
      },
    },
    volumes: volumes.map((volume) => ({
      id: volume.id,
      number: volume.number,
      singleVolume: volume.singleVolume,
      coverUrl: volume.coverUrl,
      owned: volume.personal!.owned,
      read: volume.personal!.read,
      wished: volume.personal!.wished,
    })),
    progress: {
      owned: edition.personal!.ownedCount,
      read: edition.personal!.readCount,
      wished: edition.personal!.wishedCount,
      total: edition.volumesCount,
    },
    pagination,
  };
}

function cachedEditionSelection(queryClient: QueryClient, scope: readonly [string, boolean, string], slug: string, editionNumber: number) {
  if (scope[0] === "guest") return null;
  const queryKey = [...PUBLIC_CATALOG_QUERY_ROOT, scope, "edition", slug, editionNumber];
  const state = queryClient.getQueryState<PublicEditionDetailsResponse>(queryKey);
  const response = state?.data;
  if (!response || state.isInvalidated || Date.now() - state.dataUpdatedAt >= PUBLIC_CATALOG_STALE_TIME_MS) return null;
  if (response.edition.work.slug !== slug || response.edition.chronologicalNumber !== editionNumber) return null;
  if (!response.edition.personal || response.pagination.total !== response.volumes.length || response.volumes.some((volume) => !volume.personal)) return null;
  return asCollectionEdition(response);
}

function selectedVolumeIds(result: CollectionEditionResponse, mode: SelectionMode) {
  return new Set(result.volumes.filter((volume) => {
    if (mode === "colecao") return volume.owned;
    if (mode === "desejos") return volume.wished;
    return volume.owned && volume.read;
  }).map(({ id }) => id));
}

async function syncReading(delta: { addVolumeIds: number[]; removeVolumeIds: number[] }, active: () => boolean) {
  const changes = [
    ...delta.removeVolumeIds.map((id) => ({ id, read: false })),
    ...delta.addVolumeIds.map((id) => ({ id, read: true })),
  ];
  let failure: unknown;
  for (let index = 0; index < changes.length && active(); index += 4) {
    const results = await Promise.allSettled(changes.slice(index, index + 4).map(({ id, read }) => updateVolumeReading(id, read)));
    failure ??= results.find((result) => result.status === "rejected")?.reason;
  }
  return failure;
}

async function syncSelection(mode: SelectionMode, editionId: number, delta: { addVolumeIds: number[]; removeVolumeIds: number[] }, active: () => boolean) {
  if (mode === "colecao") return syncCollectionEdition(editionId, delta).then(() => undefined);
  if (mode === "desejos") return (await syncWishlist(delta, active))[0];
  return syncReading(delta, active);
}

function updateSelectionCache(queryClient: QueryClient, scope: readonly [string, boolean, string], before: CollectionEditionResponse, after: CollectionEditionResponse) {
  const previousVolumes = new Map(before.volumes.map((volume) => [volume.id, volume]));
  for (const volume of after.volumes) {
    const previous = previousVolumes.get(volume.id);
    if (!previous || previous.owned === volume.owned && previous.read === volume.read && previous.wished === volume.wished) continue;
    updatePersonalVolumeCache(queryClient, scope, {
      workSlug: after.edition.work.slug,
      editionId: after.edition.id,
      editionNumber: after.edition.chronologicalNumber,
      volumeId: volume.id,
      volumeNumber: volume.number,
      previous: { owned: previous.owned, read: previous.read, wished: previous.wished },
      next: { owned: volume.owned, read: volume.read, wished: volume.wished },
    });
  }
}

export function useEditionSelection(slug: string, editionNumber: number, mode: SelectionMode) {
  const queryClient = useQueryClient();
  const scope = usePublicCatalogScope();
  const [data, setData] = useState<CollectionEditionResponse | null>(() => cachedEditionSelection(queryClient, scope, slug, editionNumber));
  const [initialIds, setInitialIds] = useState(() => data ? selectedVolumeIds(data, mode) : new Set<number>());
  const [selectedIds, setSelectedIds] = useState(() => data ? selectedVolumeIds(data, mode) : new Set<number>());
  const [loading, setLoading] = useState(!data);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retry, setRetry] = useState(0);
  const version = useRef(0);
  const accept = useCallback((result: CollectionEditionResponse) => {
    const ids = selectedVolumeIds(result, mode);
    setData(result); setInitialIds(ids); setSelectedIds(new Set(ids));
  }, [mode]);
  useEffect(() => {
    const current = ++version.current;
    const active = () => version.current === current;
    const cached = retry === 0 ? cachedEditionSelection(queryClient, scope, slug, editionNumber) : null;
    if (cached) {
      accept(cached); setLoading(false); setError(""); setMessage("");
      return () => { version.current = current + 1; };
    }
    setLoading(true); setError(""); setData(null); setMessage("");
    async function load() {
      if (!slug || !Number.isInteger(editionNumber) || editionNumber <= 0) throw new Error("invalid");
      const result = await getPublicEditionDetails(slug, editionNumber, { page: 1, limit: 1 });
      if (result.edition.work.slug !== slug || result.edition.chronologicalNumber !== editionNumber) throw new Error("invalid");
      if (!active()) return;
      const personal = await getCompleteCollectionEdition(result.edition.id);
      if (active()) accept(personal);
    }
    load().catch((failure) => { if (active()) setError(getApiError(failure, "Não foi possível carregar a seleção de volumes.")); })
      .finally(() => { if (active()) setLoading(false); });
    return () => { version.current = current + 1; };
  }, [slug, editionNumber, mode, retry, accept, queryClient, scope]);
  async function save() {
    if (!data || saving) return false;
    const delta = {
      addVolumeIds: [...selectedIds].filter((id) => !initialIds.has(id)),
      removeVolumeIds: [...initialIds].filter((id) => !selectedIds.has(id)),
    };
    if (mode === "colecao" && delta.addVolumeIds.length + delta.removeVolumeIds.length > 100) {
      setMessage("Altere até 100 Volumes por vez para salvar a coleção em uma única operação."); return false;
    }
    const current = version.current;
    const active = () => current === version.current;
    setSaving(true); setMessage("");
    let failure: unknown;
    try {
      failure = await syncSelection(mode, data.edition.id, delta, active);
    } catch (requestError) { failure = requestError; }
    if (!active()) return false;
    try {
      const result = await getCompleteCollectionEdition(data.edition.id);
      if (!active()) return false;
      updateSelectionCache(queryClient, scope, data, result);
      accept(result);
      setMessage(failure ? getApiError(failure, "Algumas alterações não foram salvas. Confira a seleção atualizada e tente novamente.") : "Seleção salva com sucesso.");
    } catch (refreshError) {
      if (!active()) return false;
      setData(null); setError(getApiError(refreshError, "Não foi possível confirmar a seleção salva. Recarregue antes de continuar."));
      failure = refreshError;
    } finally { if (active()) setSaving(false); }
    return !failure && active();
  }
  const hasChanges = selectedIds.size !== initialIds.size || [...selectedIds].some((id) => !initialIds.has(id));
  return { data, selectedIds, setSelectedIds, loading, saving, error, message, hasChanges, save, reload: () => setRetry((value) => value + 1) };
}
