import { api } from "@/services/api";

export interface ImportedCover {
  id: string;
  coverUrl: string;
  width?: number;
  height?: number;
  format?: string;
}

interface ImportCoverResponse {
  asset: ImportedCover;
}

export const adminMediaService = {
  async importCover(sourceUrl: string) {
    const response = await api.post<ImportCoverResponse>("/admin/media/covers", { sourceUrl });
    return response.data.asset;
  },

  async deletePendingCover(assetId: string) {
    await api.delete(`/admin/media/covers/${encodeURIComponent(assetId)}`);
  },
};
