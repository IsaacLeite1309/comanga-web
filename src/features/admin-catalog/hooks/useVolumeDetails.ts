import { useEffect, useState } from "react";
import { getApiError } from "@/lib/apiError";
import type { VolumeDetail } from "../domain/adminCatalogDetails";
import { getVolumeByNumber } from "../domain/contextualAdminCatalog";

export function useVolumeDetails(workSlug: string, editionNumber: string, volumeNumber: string | number | undefined) {
  const [volume, setVolume] = useState<VolumeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadVolume() {
      setLoading(true);
      setError("");

      try {
        const volume = await getVolumeByNumber(workSlug, editionNumber, volumeNumber || "");
        if (isMounted) setVolume(volume);
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
  }, [workSlug, editionNumber, volumeNumber]);

  return { volume, loading, error };
}
