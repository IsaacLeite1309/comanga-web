import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import type { VolumeDetail } from "../domain/adminCatalogDetails";

interface VolumeResponse {
  volume: VolumeDetail;
}

export function useVolumeDetails(volumeId: string | number | undefined) {
  const [volume, setVolume] = useState<VolumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadVolume() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<VolumeResponse>(`/admin/volumes/${volumeId}`);
        if (isMounted) setVolume(response.data.volume);
      } catch (loadError) {
        if (isMounted) setError(getApiError(loadError, "Erro ao carregar dados do Volume."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVolume();
    return () => {
      isMounted = false;
    };
  }, [volumeId]);

  return { volume, loading, error };
}
