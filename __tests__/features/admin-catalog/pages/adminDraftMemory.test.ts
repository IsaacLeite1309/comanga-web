import { expect, it, vi } from "vitest";
import { emptyNewMangaDraft, rememberNewMangaDraft } from "@/features/admin-catalog/pages/newMangaMemory";
import { emptyEditionDraft, rememberEditionDraft } from "@/features/admin-catalog/pages/editionDraftMemory";
import { emptyVolumeDraft, rememberVolumeDraft } from "@/features/admin-catalog/pages/volumeDraftMemory";

it("restaura cadastros parciais depois de recarregar a aba", async () => {
  rememberNewMangaDraft({ ...emptyNewMangaDraft, title: "Obra em andamento", currentStep: "authors" });
  rememberEditionDraft("obra-a", { ...emptyEditionDraft, chronologicalNumber: "2" });
  rememberVolumeDraft("obra-a:2", {
    form: { ...emptyVolumeDraft, number: "3" },
    currentStep: "media",
  });

  vi.resetModules();
  const workMemory = await import("@/features/admin-catalog/pages/newMangaMemory");
  const editionMemory = await import("@/features/admin-catalog/pages/editionDraftMemory");
  const volumeMemory = await import("@/features/admin-catalog/pages/volumeDraftMemory");

  expect(workMemory.getRememberedNewMangaDraft()).toMatchObject({ title: "Obra em andamento", currentStep: "authors" });
  expect(editionMemory.getRememberedEditionDraft("obra-a").chronologicalNumber).toBe("2");
  expect(editionMemory.getRememberedEditionDraft("obra-b").chronologicalNumber).toBe("");
  expect(volumeMemory.getRememberedVolumeDraft("obra-a:2")).toMatchObject({
    form: { number: "3" }, currentStep: "media",
  });
  expect(volumeMemory.getRememberedVolumeDraft("obra-a:1").form.number).toBe("");
});
