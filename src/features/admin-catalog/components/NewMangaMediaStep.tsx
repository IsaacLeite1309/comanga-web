import { CoverImportField } from '@/features/admin-media';

import type { ControllerProps } from './newMangaSectionShared';
import { WorkSynopsisField } from './NewMangaIdentificationStep';

export function MediaStep({ controller }: ControllerProps) {
  const { draft } = controller;
  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-4">
      <CoverImportField
        label="Capa da Obra"
        required
        invalid={controller.isInvalidField("coverAssetId")}
        value={draft.coverAssetId ? { assetId: draft.coverAssetId, coverUrl: draft.coverUrl, pending: draft.coverPending } : null}
        onChange={(cover) => {
          controller.updateDraft("coverAssetId", cover?.assetId || "");
          controller.updateDraft("coverUrl", cover?.coverUrl || "");
          controller.updateDraft("coverPending", cover?.pending || false);
          controller.clearInvalidField("coverAssetId");
        }}
      />
      <WorkSynopsisField controller={controller} />
    </section>
  );
}
