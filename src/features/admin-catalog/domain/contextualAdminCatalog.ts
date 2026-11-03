import { adminCachedGet } from "@/services/adminCachedGet";
import type { EditionDetail, VolumeDetail } from "./adminCatalogDetails";

export async function getEditionByNumber<T = EditionDetail>(workSlug: string, editionNumber: string | number) {
  const response = await adminCachedGet<{ edition: T }>(
    `/admin/works/slug/${encodeURIComponent(workSlug)}/editions/${editionNumber}`,
  );
  return response.data.edition;
}

export async function getVolumeByNumber<T = VolumeDetail>(workSlug: string, editionNumber: string | number, volumeNumber: string | number) {
  const response = await adminCachedGet<{ volume: T }>(
    `/admin/works/slug/${encodeURIComponent(workSlug)}/editions/${editionNumber}/volumes/${volumeNumber}`,
  );
  return response.data.volume;
}
