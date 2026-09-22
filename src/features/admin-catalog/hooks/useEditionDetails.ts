import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import type { EditionDetail, VolumeDetail } from "../domain/adminCatalogDetails";
import {
  VOLUMES_LIST_ORDER,
  VOLUMES_PAGE_SIZE,
  normalizeCatalogPagination,
  type CatalogPagination,
} from "../domain/catalogPagination";
import { useCatalogPagedList } from "./useCatalogPagedList";

interface EditionResponse {
  edition: EditionDetail;
}

interface VolumesResponse {
  volumes: VolumeDetail[];
  pagination?: Partial<CatalogPagination>;
}

function useEditionSummary(editionId: string | number | undefined) {
  const [edition, setEdition] = useState<EditionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [revision, setRevision] = useState(0);

  useEffect(() => {
    let isMounted = true;

    async function loadEdition() {
      setLoading(true);
      setError("");

      try {
        const editionResponse = await api.get<EditionResponse>(`/admin/editions/${editionId}`);
        if (!isMounted) return;
        setEdition(editionResponse.data.edition);
      } catch (loadError) {
        if (isMounted) setError(getApiError(loadError, "Erro ao carregar dados da Edição."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadEdition();
    return () => {
      isMounted = false;
    };
  }, [editionId, revision]);

  return { edition, loading, error, refresh: () => setRevision(current => current + 1) };
}

export function useEditionDetails(editionId: string | number | undefined) {
  const { edition, loading, error, refresh } = useEditionSummary(editionId);
  const [deletingVolume, setDeletingVolume] = useState<VolumeDetail | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadVolumesPage = useCallback(async (page: number, limit: number) => {
    const response = await api.get<VolumesResponse>(`/admin/editions/${editionId}/volumes`, {
      params: { order: VOLUMES_LIST_ORDER, page, limit },
    });
    const volumes = response.data.volumes;

    return {
      items: volumes,
      pagination: normalizeCatalogPagination(response.data.pagination, page, limit, volumes.length),
    };
  }, [editionId]);

  const volumesList = useCatalogPagedList<VolumeDetail>({
    enabled: Boolean(editionId),
    listKey: `edition:${editionId}:volumes`,
    pageSize: VOLUMES_PAGE_SIZE,
    errorMessage: "Erro ao listar Volumes.",
    loadPage: loadVolumesPage,
  });

  async function confirmDeleteVolume() {
    if (!deletingVolume || deletingId) return;
    setDeletingId(deletingVolume.id);

    try {
      await api.delete(`/admin/volumes/${deletingVolume.id}`);
      toast.success("Volume excluído com sucesso.");
      setDeletingVolume(null);
      volumesList.refreshAfterRemoval();
      refresh();
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Volume."));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    edition,
    volumes: volumesList.items,
    volumesLoading: volumesList.loading,
    volumesError: volumesList.error,
    volumesPagination: volumesList.pagination,
    loading,
    error,
    deletingVolume,
    deletingId,
    setDeletingVolume,
    confirmDeleteVolume,
  };
}
