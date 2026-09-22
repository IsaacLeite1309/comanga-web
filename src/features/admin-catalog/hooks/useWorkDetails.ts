import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import type { EditionDetail, WorkDetail } from "../domain/adminCatalogDetails";
import {
  EDITIONS_LIST_ORDER,
  EDITIONS_PAGE_SIZE,
  normalizeCatalogPagination,
  type CatalogPagination,
} from "../domain/catalogPagination";
import { useCatalogPagedList } from "./useCatalogPagedList";

interface WorkDetailResponse {
  work: WorkDetail;
}

interface EditionsResponse {
  editions: EditionDetail[];
  pagination?: Partial<CatalogPagination>;
}

export function useWorkSummary(workSlug: string) {
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadWork() {
      setLoading(true);
      setError("");

      try {
        if (!workSlug) throw new Error("Obra não encontrada.");
        const workResponse = await api.get<WorkDetailResponse>(
          `/admin/works/slug/${encodeURIComponent(workSlug)}`,
        );

        if (!isMounted) return;
        setWork(workResponse.data.work);
      } catch (loadError) {
        if (!isMounted) return;
        const fallback = loadError instanceof Error ? loadError.message : "Erro ao carregar dados da Obra.";
        setError(getApiError(loadError, fallback));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWork();
    return () => {
      isMounted = false;
    };
  }, [workSlug]);

  return { work, loading, error };
}

export function useWorkDetails(workSlug: string) {
  const { work, loading, error } = useWorkSummary(workSlug);
  const [deletingEdition, setDeletingEdition] = useState<EditionDetail | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const workId = work?.id;

  const loadEditionsPage = useCallback(async (page: number, limit: number) => {
    const response = await api.get<EditionsResponse>(`/admin/works/${workId}/editions`, {
      params: { order: EDITIONS_LIST_ORDER, page, limit },
    });
    const editions = response.data.editions;

    return {
      items: editions,
      pagination: normalizeCatalogPagination(response.data.pagination, page, limit, editions.length),
    };
  }, [workId]);

  const editionsList = useCatalogPagedList<EditionDetail>({
    enabled: Boolean(workId),
    listKey: `work:${workId}:editions`,
    pageSize: EDITIONS_PAGE_SIZE,
    errorMessage: "Erro ao listar Edições.",
    loadPage: loadEditionsPage,
  });

  async function toggleEditionVisibility(edition: EditionDetail) {
    const nextVisibility = edition.visibility === "Público" ? "Privado" : "Público";
    setUpdatingVisibilityId(edition.id);

    try {
      const response = await api.patch<{ edition: EditionDetail }>(`/admin/editions/${edition.id}/visibility`, {
        visibility: nextVisibility,
      });
      editionsList.setItems((current) => current.map((item) => (
        item.id === edition.id ? response.data.edition : item
      )));
      editionsList.refresh();
      toast.success("Visibilidade da Edição atualizada com sucesso.");
    } catch (visibilityError) {
      toast.error(getApiError(visibilityError, "Erro ao alterar visibilidade da Edição."));
    } finally {
      setUpdatingVisibilityId(null);
    }
  }

  async function confirmDeleteEdition() {
    if (!deletingEdition || deletingId) return;
    setDeletingId(deletingEdition.id);

    try {
      await api.delete(`/admin/editions/${deletingEdition.id}`);
      toast.success("Edição excluída com sucesso.");
      setDeletingEdition(null);
      editionsList.refreshAfterRemoval();
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Edição."));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    work,
    editions: editionsList.items,
    editionsLoading: editionsList.loading,
    editionsError: editionsList.error,
    editionsPagination: editionsList.pagination,
    loading,
    error,
    deletingEdition,
    deletingId,
    updatingVisibilityId,
    setDeletingEdition,
    toggleEditionVisibility,
    confirmDeleteEdition,
  };
}
