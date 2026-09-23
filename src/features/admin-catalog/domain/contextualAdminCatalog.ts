import { api } from "@/services/api";
import type { EditionDetail, VolumeDetail } from "./adminCatalogDetails";

export async function getEditionByNumber<T = EditionDetail>(workSlug: string, editionNumber: string | number) {
  const response = await api.get<{ edition: T }>(
    `/admin/works/slug/${encodeURIComponent(workSlug)}/editions/${editionNumber}`,
  );
  return response.data.edition;
}

export async function getVolumeByNumber<T = VolumeDetail>(workSlug: string, editionNumber: string | number, volumeNumber: string | number) {
  const response = await api.get<{ volume: T }>(
    `/admin/works/slug/${encodeURIComponent(workSlug)}/editions/${editionNumber}/volumes/${volumeNumber}`,
  );
  return response.data.volume;
}
