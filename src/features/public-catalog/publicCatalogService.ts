import { api } from "@/services/api";
import type {
  PublicCatalogOptions,
  PublicAuthorWorksQuery,
  PublicAuthorWorksResponse,
  PublicEditionsQuery,
  PublicEditionsResponse,
  PublicEditionDetailsResponse,
  PublicVolumeDetailsResponse,
  PublicWorkDetailsResponse,
  PublicWorksQuery,
  PublicWorksResponse,
} from "@/features/public-catalog/publicCatalogTypes";

function compactParams(params: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== ""),
  );
}

export async function listPublicWorks(query: PublicWorksQuery) {
  const response = await api.get<PublicWorksResponse>("/public/works", {
    params: compactParams({
      ...query,
      demographics: query.demographics?.length ? query.demographics.join(",") : undefined,
      genreIds: query.genreIds?.length ? query.genreIds.join(",") : undefined,
    }),
  });

  return response.data;
}

export async function listPublicEditions(query: PublicEditionsQuery) {
  const response = await api.get<PublicEditionsResponse>("/public/editions", {
    params: compactParams(query),
  });

  return response.data;
}

export async function getPublicCatalogOptions() {
  const response = await api.get<{ options: PublicCatalogOptions }>("/public/catalog-options");
  return response.data.options;
}

export async function getPublicWorkDetails(slug: string) {
  const response = await api.get<PublicWorkDetailsResponse>(`/public/works/${encodeURIComponent(slug)}`);
  return response.data.work;
}

export async function getPublicEditionDetails(
  editionId: number,
  query: { page: number; limit: number },
) {
  const response = await api.get<PublicEditionDetailsResponse>(`/public/editions/${editionId}`, {
    params: query,
  });
  return response.data;
}

export async function getPublicAuthorWorks(authorId: number, query: PublicAuthorWorksQuery) {
  const response = await api.get<PublicAuthorWorksResponse>(`/public/authors/${authorId}/works`, {
    params: query,
  });
  return response.data;
}

export async function getPublicVolumeDetails(volumeId: number) {
  const response = await api.get<PublicVolumeDetailsResponse>(`/public/volumes/${volumeId}`);
  return response.data.volume;
}
