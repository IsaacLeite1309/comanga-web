import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { MultiSelect } from "@/components/forms/MultiSelect";
import type { EditionDraft } from "../pages/editionDraftMemory";
import {
  editionNumberOptions,
  EDITION_PUBLICATION_STATUS_OPTIONS,
  type EditionFormOptions,
  type EditionOption,
} from "../pages/editionFormModel";

interface EditionFormFieldsProps {
  draft: EditionDraft;
  options: EditionFormOptions;
  onChange: <K extends keyof EditionDraft>(field: K, value: EditionDraft[K]) => void;
}

export function EditionFormFields({ draft, options, onChange }: EditionFormFieldsProps) {
  return (
    <section className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-6">
      <EditionSelect className="md:col-span-2" label="Número da edição" value={draft.chronologicalNumber} onChange={(value) => onChange("chronologicalNumber", value)} options={editionNumberOptions(draft.chronologicalNumber)} required />
      <EditionSelect className="md:col-span-2" label="Editora brasileira" value={draft.brazilianPublisherId} onChange={(value) => onChange("brazilianPublisherId", value)} options={options.brazilianPublishers} required />
      <EditionSelect className="md:col-span-2" label="Status de publicação" value={draft.brazilPublicationStatus} onChange={(value) => onChange("brazilPublicationStatus", value)} options={EDITION_PUBLICATION_STATUS_OPTIONS} required />
      <EditionSelect className="md:col-span-2" label="Acabamento" value={draft.coverTypeId} onChange={(value) => onChange("coverTypeId", value)} options={options.coverTypes} />
      <EditionSelect className="md:col-span-2" label="Formato" value={draft.formatId} onChange={(value) => onChange("formatId", value)} options={options.formats} />
      <div className="min-w-0 md:col-span-2">
        <MultiSelect
          label="Miolo"
          selectedIds={draft.paperIds.map(Number)}
          onToggle={(id) => {
            const value = String(id);
            onChange(
              "paperIds",
              draft.paperIds.includes(value)
                ? draft.paperIds.filter((paperId) => paperId !== value)
                : [...draft.paperIds, value],
            );
          }}
          onClear={() => onChange("paperIds", [])}
          options={options.papers}
          searchable
        />
      </div>
    </section>
  );
}

function EditionSelect({
  className,
  label,
  value,
  onChange,
  options,
  required = false,
}: {
  className?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: EditionOption[];
  required?: boolean;
}) {
  return (
    <div className={`min-w-0 ${className || ""}`}>
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}{required && <span className="text-red-400"> *</span>}
      </span>
      <SearchableSelect ariaLabel={label} value={value} onChange={onChange} options={options} searchable />
    </div>
  );
}
