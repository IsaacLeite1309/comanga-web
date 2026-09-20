import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import type { EditionDetail, WorkDetail } from "../domain/adminCatalogDetails";

interface WorkDetailResponse {
  work: WorkDetail;
}

interface EditionsResponse {
  editions: EditionDetail[];
}

export function useWorkDetails(workSlug: string) {
  const [work, setWork] = useState<WorkDetail | null>(null);
  const [editions, setEditions] = useState<EditionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingEdition, setDeletingEdition] = useState<EditionDetail | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadWorkHub() {
      setLoading(true);
      setError("");

      try {
        if (!workSlug) throw new Error("Obra não encontrada.");
        const workResponse = await api.get<WorkDetailResponse>(
          `/admin/works/slug/${encodeURIComponent(workSlug)}`,
        );
        const loadedWork = workResponse.data.work;
        const editionsResponse = await api.get<EditionsResponse>(`/admin/works/${loadedWork.id}/editions`, {
          params: { order: "DESC", page: 1, limit: 50 },
        });

        if (!isMounted) return;
        setWork(loadedWork);
        setEditions(editionsResponse.data.editions);
      } catch (loadError) {
        if (!isMounted) return;
        const fallback = loadError instanceof Error ? loadError.message : "Erro ao carregar dados da Obra.";
        setError(getApiError(loadError, fallback));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadWorkHub();
    return () => {
      isMounted = false;
    };
  }, [workSlug]);

  async function toggleEditionVisibility(edition: EditionDetail) {
    const nextVisibility = edition.visibility === "Público" ? "Privado" : "Público";
    setUpdatingVisibilityId(edition.id);

    try {
      const response = await api.patch<{ edition: EditionDetail }>(`/admin/editions/${edition.id}/visibility`, {
        visibility: nextVisibility,
      });
      setEditions((current) => current.map((item) => (item.id === edition.id ? response.data.edition : item)));
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
      setEditions((current) => current.filter((item) => item.id !== deletingEdition.id));
      toast.success("Edição excluída com sucesso.");
      setDeletingEdition(null);
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Edição."));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    work,
    editions,
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
