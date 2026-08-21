import type { PublicVolumePreview } from "@/features/public-catalog/publicCatalogTypes";

export function publicVolumeLabel(volume: Pick<PublicVolumePreview, "number" | "singleVolume">) {
  return volume.singleVolume ? "Volume único" : `Volume ${volume.number}`;
}

export function formatPublicReleaseDate(
  volume: Pick<PublicVolumePreview, "releaseDatePrecision" | "releaseYear" | "releaseMonth" | "releaseDay">,
) {
  if (!volume.releaseYear) return "Data não informada";
  if (volume.releaseDatePrecision === "Completa" && volume.releaseMonth && volume.releaseDay) {
    return [volume.releaseDay, volume.releaseMonth, volume.releaseYear]
      .map((value) => String(value).padStart(2, "0"))
      .join("/");
  }
  if (volume.releaseMonth) {
    return `${String(volume.releaseMonth).padStart(2, "0")}/${volume.releaseYear}`;
  }
  return String(volume.releaseYear);
}
