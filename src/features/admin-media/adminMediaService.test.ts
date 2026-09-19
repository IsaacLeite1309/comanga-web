import { beforeEach, describe, expect, it, vi } from "vitest";
import { api } from "@/services/api";
import { adminMediaService } from "./adminMediaService";

vi.mock("@/services/api", () => ({
  api: {
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("adminMediaService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("envia a URL somente para a importação administrativa", async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { asset: { id: "asset-id", coverUrl: "https://media.test/cover.webp" } } });

    await expect(adminMediaService.importCover("https://origem.test/cover.jpg")).resolves.toEqual({
      id: "asset-id",
      coverUrl: "https://media.test/cover.webp",
    });
    expect(api.post).toHaveBeenCalledWith("/admin/media/covers", {
      sourceUrl: "https://origem.test/cover.jpg",
    });
  });

  it("descarta uma importação ainda não associada", async () => {
    vi.mocked(api.delete).mockResolvedValue({});

    await adminMediaService.deletePendingCover("asset-id");

    expect(api.delete).toHaveBeenCalledWith("/admin/media/covers/asset-id");
  });
});
