import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import type { EditionDetail, VolumeDetail } from "../domain/adminCatalogDetails";

interface EditionResponse {
  edition: EditionDetail;
}

interface VolumesResponse {
  volumes: VolumeDetail[];
}

export function useEditionDetails(editionId: string | number | undefined) {
  const [edition, setEdition] = useState<EditionDetail | null>(null);
  const [volumes, setVolumes] = useState<VolumeDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingVolume, setDeletingVolume] = useState<VolumeDetail | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEdition() {
      setLoading(true);
      setError("");

      try {
        const [editionResponse, volumesResponse] = await Promise.all([
          api.get<EditionResponse>(`/admin/editions/${editionId}`),
          api.get<VolumesResponse>(`/admin/editions/${editionId}/volumes`, {
            params: { order: "ASC", page: 1, limit: 50 },
          }),
        ]);
        if (!isMounted) return;
        setEdition(editionResponse.data.edition);
        setVolumes(volumesResponse.data.volumes);
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
  }, [editionId]);

  async function confirmDeleteVolume() {
    if (!deletingVolume || deletingId) return;
    setDeletingId(deletingVolume.id);

    try {
      await api.delete(`/admin/volumes/${deletingVolume.id}`);
      setVolumes((current) => current.filter((volume) => volume.id !== deletingVolume.id));
      toast.success("Volume excluído com sucesso.");
      setDeletingVolume(null);
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Volume."));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    edition,
    volumes,
    loading,
    error,
    deletingVolume,
    deletingId,
    setDeletingVolume,
    confirmDeleteVolume,
  };
}
