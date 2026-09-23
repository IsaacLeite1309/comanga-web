import type { Dispatch, SetStateAction } from "react";
import { CoverImportField } from "@/features/admin-media";
import { InputField, SelectField, ToggleField } from "@/components/forms/FormFields";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import type { RememberedVolumeStep, VolumeDraft } from "../pages/volumeDraftMemory";
import {
  getDateInputValue,
  PRICE_CURRENCY_OPTIONS,
  RELEASE_PRECISION_OPTIONS,
  type ReleaseDatePrecision,
} from "../pages/volumeFormModel";

const volumeSteps: Array<{ id: RememberedVolumeStep; title: string }> = [
  { id: "details", title: "Dados do Volume" },
  { id: "media", title: "Capa e sinopse" },
];

interface StepNavigationProps {
  currentStep: RememberedVolumeStep;
  onChange: (step: RememberedVolumeStep) => void;
}

export function VolumeStepNavigation({ currentStep, onChange }: StepNavigationProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {volumeSteps.map((step, index) => (
        <button
          key={step.id}
          type="button"
          onClick={() => onChange(step.id)}
          className={`rounded-2xl border px-5 py-4 text-left transition-colors ${
            currentStep === step.id
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border bg-card text-foreground hover:border-primary"
          }`}
        >
          <span className={`block text-xs font-bold uppercase ${currentStep === step.id ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
            Etapa {index + 1}
          </span>
          <span className="mt-1 block text-lg font-bold">{step.title}</span>
        </button>
      ))}
    </div>
  );
}

interface VolumeStepContentProps {
  currentStep: RememberedVolumeStep;
  form: VolumeDraft;
  invalidFields: string[];
  setForm: Dispatch<SetStateAction<VolumeDraft>>;
  updateCover: (cover: { assetId: string; coverUrl: string; pending: boolean } | null) => void;
  updateField: (field: keyof VolumeDraft, value: string) => void;
  updateReleaseDate: (value: string) => void;
  updateReleasePrecision: (value: ReleaseDatePrecision) => void;
  singleVolumeUnavailable?: boolean;
}

export function VolumeStepContent(props: VolumeStepContentProps) {
  return (
    <section className="space-y-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
      {props.currentStep === "details" ? <VolumeDetailsStep {...props} /> : <VolumeMediaStep {...props} />}
    </section>
  );
}

function VolumeDetailsStep({
  form,
  invalidFields,
  setForm,
  updateField,
  updateReleaseDate,
  updateReleasePrecision,
  singleVolumeUnavailable,
}: VolumeStepContentProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Número do Volume"
          value={form.number}
          onChange={(value) => updateField("number", value)}
          type="number"
          disabled={form.singleVolume}
          required
          invalid={invalidFields.includes("number")}
          errorMessage="Preencha o campo obrigatório."
          placeholder="Digite"
        />
        <ReleaseDateField
          precision={form.releaseDatePrecision}
          value={getDateInputValue(form)}
          invalid={invalidFields.includes("releaseDate")}
          onPrecisionChange={updateReleasePrecision}
          onDateChange={updateReleaseDate}
        />
      </div>

      <ToggleField
        label="Volume único"
        checked={form.singleVolume}
        disabled={singleVolumeUnavailable && !form.singleVolume}
        onChange={(checked) => setForm((current) => ({ ...current, singleVolume: checked, number: checked ? "1" : current.number }))}
      />
      {singleVolumeUnavailable && !form.singleVolume && (
        <p className="text-sm text-muted-foreground">Volume único só pode ser ativado se esta Edição não tiver outros Volumes.</p>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <SelectField
          label="Moeda"
          value={form.priceCurrency}
          onChange={(value) => updateField("priceCurrency", value)}
          options={PRICE_CURRENCY_OPTIONS.map((currency) => ({ value: currency, label: currency }))}
        />
        <InputField
          label="Preço de capa"
          value={form.price}
          onChange={(value) => updateField("price", value)}
          type="number"
          step="0.01"
          invalid={invalidFields.includes("price")}
          errorMessage="Informe um preço válido."
          placeholder="Digite"
        />
        <InputField
          label="Número de páginas"
          value={form.pages}
          onChange={(value) => updateField("pages", value)}
          type="number"
          invalid={invalidFields.includes("pages")}
          errorMessage="Informe um número maior que zero."
          placeholder="Digite"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <InputField label="ISBN-10" value={form.isbn10} onChange={(value) => updateField("isbn10", value)} placeholder="Digite" />
        <InputField label="ISBN-13" value={form.isbn13} onChange={(value) => updateField("isbn13", value)} placeholder="Digite" />
        <InputField
          label="Link afiliado"
          value={form.affiliateLink}
          onChange={(value) => updateField("affiliateLink", value)}
          invalid={invalidFields.includes("affiliateLink")}
          errorMessage="Informe uma URL absoluta válida."
          placeholder="Digite"
        />
      </div>
    </div>
  );
}

function VolumeMediaStep({
  form,
  invalidFields,
  updateCover,
  updateField,
}: VolumeStepContentProps) {
  return (
    <>
      <CoverImportField
        label="Capa do Volume"
        required
        invalid={invalidFields.includes("coverAssetId")}
        value={form.coverAssetId ? {
          assetId: form.coverAssetId,
          coverUrl: form.coverUrl,
          pending: form.coverPending,
        } : null}
        onChange={updateCover}
      />
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Sinopse
        </label>
        <textarea
          aria-label="Sinopse"
          value={form.synopsis}
          onChange={(event) => updateField("synopsis", event.target.value)}
          placeholder="Digite"
          rows={6}
          className="w-full resize-y rounded-xl border border-border bg-input px-4 py-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
        />
      </div>
    </>
  );
}

function ReleaseDateField({
  precision,
  value,
  invalid,
  onPrecisionChange,
  onDateChange,
}: {
  precision: ReleaseDatePrecision;
  value: string;
  invalid: boolean;
  onPrecisionChange: (value: ReleaseDatePrecision) => void;
  onDateChange: (value: string) => void;
}) {
  const dateInputType = precision === "Completa" ? "date" : precision === "Mes e ano" ? "month" : "number";
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-muted-foreground">
        Data de publicação <span className="text-red-400">*</span>
      </label>
      <div className="grid gap-3 sm:grid-cols-[170px_1fr]">
        <SearchableSelect
          ariaLabel="Precisão da data de publicação"
          value={precision}
          onChange={(nextValue) => onPrecisionChange(nextValue as ReleaseDatePrecision)}
          options={RELEASE_PRECISION_OPTIONS}
          className=""
        />
        <input
          aria-label="Data de publicação"
          value={value}
          onChange={(event) => onDateChange(event.target.value)}
          type={dateInputType}
          min={precision === "Ano" ? "1900" : undefined}
          max={precision === "Ano" ? "2200" : undefined}
          placeholder="Digite"
          className={`h-12 w-full rounded-xl border bg-input px-4 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${invalid ? "border-red-500" : "border-border"}`}
        />
      </div>
      {invalid && <p className="mt-2 text-sm font-semibold text-red-400">Informe a data conforme a precisão selecionada.</p>}
    </div>
  );
}
