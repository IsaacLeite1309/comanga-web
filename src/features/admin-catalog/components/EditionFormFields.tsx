import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { CoverImportField } from "@/features/admin-media";
import type { EditionDraft } from "../pages/editionDraftMemory";
import {
  EDITION_NUMBER_OPTIONS,
  EDITION_PUBLICATION_STATUS_OPTIONS,
  type EditionFormOptions,
  type EditionOption,
} from "../pages/editionFormModel";

interface EditionFormFieldsProps {
  draft: EditionDraft;
  options: EditionFormOptions;
  onChange: (field: keyof EditionDraft, value: string) => void;
  onCoverChange: (cover: { assetId: string; coverUrl: string; pending: boolean } | null) => void;
}

export function EditionFormFields({ draft, options, onChange, onCoverChange }: EditionFormFieldsProps) {
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
      <EditionSelect label="Editora brasileira" value={draft.brazilianPublisherId} onChange={(value) => onChange("brazilianPublisherId", value)} options={options.brazilianPublishers} />
      <EditionSelect label="Tipo de edição" value={draft.editionTypeId} onChange={(value) => onChange("editionTypeId", value)} options={options.editionTypes} />
      <EditionSelect label="Acabamento" value={draft.coverTypeId} onChange={(value) => onChange("coverTypeId", value)} options={options.coverTypes} />
      <EditionSelect label="Formato" value={draft.formatId} onChange={(value) => onChange("formatId", value)} options={options.formats} />
      <EditionSelect label="Número da edição" value={draft.chronologicalNumber} onChange={(value) => onChange("chronologicalNumber", value)} options={EDITION_NUMBER_OPTIONS} />
      <EditionSelect label="Status de publicação" value={draft.brazilPublicationStatus} onChange={(value) => onChange("brazilPublicationStatus", value)} options={EDITION_PUBLICATION_STATUS_OPTIONS} />
      <div className="md:col-span-3">
        <CoverImportField
          label="Capa da Edição"
          required
          value={draft.coverAssetId ? {
            assetId: draft.coverAssetId,
            coverUrl: draft.coverUrl,
            pending: draft.coverPending,
          } : null}
          onChange={onCoverChange}
        />
      </div>
    </section>
  );
}

function EditionSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: EditionOption[];
}) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}<span className="text-red-400"> *</span>
      </span>
      <SearchableSelect ariaLabel={label} value={value} onChange={onChange} options={options} searchable />
    </div>
  );
}
