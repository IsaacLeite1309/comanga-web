import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, RotateCcw, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { UnsavedChangesPrompt } from "@/hooks/useUnsavedChangesWarning";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { InputField, SelectField, ToggleField } from "@/components/forms/FormFields";
import { getApiError } from "@/lib/apiError";
import {
  editionAdminPath,
  newVolumeAdminPath,
  volumeAdminPath,
} from "@/lib/catalogPaths";

interface LocationState {
  workId?: number;
  editionId?: number;
  volumeId?: number;
}

interface Volume {
  id: number;
  editionId: number;
  number: number;
  singleVolume?: boolean | null;
  coverUrl?: string | null;
  pages?: number | null;
  price?: number | null;
  priceCurrency?: string | null;
  releaseDatePrecision?: ReleaseDatePrecision | null;
  releaseYear?: number | null;
  releaseMonth?: number | null;
  releaseDay?: number | null;
  isbn10?: string | null;
  isbn13?: string | null;
  affiliateLink?: string | null;
  synopsis?: string | null;
}

interface VolumeResponse {
  volume: Volume;
}

type ReleaseDatePrecision = "Completa" | "Mes e ano" | "Ano";
type VolumeStep = "details" | "media";

interface FormState {
  number: string;
  singleVolume: boolean;
  coverUrl: string;
  pages: string;
  price: string;
  priceCurrency: string;
  releaseDatePrecision: ReleaseDatePrecision;
  releaseYear: string;
  releaseMonth: string;
  releaseDay: string;
  isbn10: string;
  isbn13: string;
  affiliateLink: string;
  synopsis: string;
}

const PRICE_CURRENCY_OPTIONS = ["R$", "CR$", "Cr$", "NCz$", "Cz$"];

const RELEASE_PRECISION_OPTIONS: Array<{ value: ReleaseDatePrecision; label: string }> = [
  { value: "Completa", label: "Data completa" },
  { value: "Mes e ano", label: "Mês e ano" },
  { value: "Ano", label: "Apenas ano" },
];

const emptyForm: FormState = {
  number: "",
  singleVolume: false,
  coverUrl: "",
  pages: "",
  price: "",
  priceCurrency: "R$",
  releaseDatePrecision: "Completa",
  releaseYear: "",
  releaseMonth: "",
  releaseDay: "",
  isbn10: "",
  isbn13: "",
  affiliateLink: "",
  synopsis: "",
};

const volumeSteps: Array<{ id: VolumeStep; title: string }> = [
  { id: "details", title: "Dados do Volume" },
  { id: "media", title: "Capa e sinopse" },
];

function isAbsoluteUrl(value: string) {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function padDatePart(value?: number | string | null) {
  return value ? String(value).padStart(2, "0") : "";
}

function getDateInputValue(form: FormState) {
  if (form.releaseDatePrecision === "Completa" && form.releaseYear && form.releaseMonth && form.releaseDay) {
    return `${form.releaseYear}-${padDatePart(form.releaseMonth)}-${padDatePart(form.releaseDay)}`;
  }

  if (form.releaseDatePrecision === "Mes e ano" && form.releaseYear && form.releaseMonth) {
    return `${form.releaseYear}-${padDatePart(form.releaseMonth)}`;
  }

  if (form.releaseDatePrecision === "Ano") {
    return form.releaseYear;
  }

  return "";
}

const VolumeForm = () => {
  const { workSlug = "", editionId = "", volumeId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const isEditing = Boolean(volumeId);
  const editionPath = useMemo(() => editionAdminPath(workSlug, editionId), [workSlug, editionId]);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [currentStep, setCurrentStep] = useState<VolumeStep>("details");
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [baselineSignature, setBaselineSignature] = useState("");
  const formSignature = useMemo(() => JSON.stringify(form), [form]);

  const hasUnsavedChanges = Boolean(baselineSignature) && formSignature !== baselineSignature && !saving;

  useEffect(() => {
    let isMounted = true;

    async function loadVolume() {
      if (!isEditing) return;

      setLoading(true);
      setError("");

      try {
        const response = await api.get<VolumeResponse>(`/admin/volumes/${volumeId || state?.volumeId}`);
        const volume = response.data.volume;

        if (!isMounted) return;

        setForm({
          number: String(volume.number ?? ""),
          singleVolume: Boolean(volume.singleVolume),
          coverUrl: volume.coverUrl || "",
          pages: volume.pages ? String(volume.pages) : "",
          price: volume.price !== null && volume.price !== undefined ? String(volume.price) : "",
          priceCurrency: volume.priceCurrency || "R$",
          releaseDatePrecision: volume.releaseDatePrecision || "Completa",
          releaseYear: volume.releaseYear ? String(volume.releaseYear) : "",
          releaseMonth: volume.releaseMonth ? String(volume.releaseMonth) : "",
          releaseDay: volume.releaseDay ? String(volume.releaseDay) : "",
          isbn10: volume.isbn10 || "",
          isbn13: volume.isbn13 || "",
          affiliateLink: volume.affiliateLink || "",
          synopsis: volume.synopsis || "",
        });
        setBaselineSignature(JSON.stringify({
          number: String(volume.number ?? ""),
          singleVolume: Boolean(volume.singleVolume),
          coverUrl: volume.coverUrl || "",
          pages: volume.pages ? String(volume.pages) : "",
          price: volume.price !== null && volume.price !== undefined ? String(volume.price) : "",
          priceCurrency: volume.priceCurrency || "R$",
          releaseDatePrecision: volume.releaseDatePrecision || "Completa",
          releaseYear: volume.releaseYear ? String(volume.releaseYear) : "",
          releaseMonth: volume.releaseMonth ? String(volume.releaseMonth) : "",
          releaseDay: volume.releaseDay ? String(volume.releaseDay) : "",
          isbn10: volume.isbn10 || "",
          isbn13: volume.isbn13 || "",
          affiliateLink: volume.affiliateLink || "",
          synopsis: volume.synopsis || "",
        }));
      } catch (loadError) {
        if (!isMounted) return;
        setError(getApiError(loadError, "Erro ao carregar dados do Volume."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadVolume();

    return () => {
      isMounted = false;
    };
  }, [isEditing, state?.volumeId, volumeId]);

  useEffect(() => {
    if (!isEditing && !baselineSignature) {
      setBaselineSignature(JSON.stringify(emptyForm));
    }
  }, [baselineSignature, isEditing]);

  function updateField(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setInvalidFields((current) => current.filter((item) => item !== field));
  }

  function updateReleasePrecision(value: ReleaseDatePrecision) {
    setForm((current) => ({
      ...current,
      releaseDatePrecision: value,
      releaseYear: current.releaseYear,
      releaseMonth: ["Completa", "Mes e ano"].includes(value) ? current.releaseMonth : "",
      releaseDay: value === "Completa" ? current.releaseDay : "",
    }));
    setInvalidFields((current) => current.filter((item) => !["releaseDate"].includes(item)));
  }

  function updateReleaseDate(value: string) {
    if (form.releaseDatePrecision === "Completa") {
      const [year = "", month = "", day = ""] = value.split("-");
      setForm((current) => ({ ...current, releaseYear: year, releaseMonth: month, releaseDay: day }));
    } else if (form.releaseDatePrecision === "Mes e ano") {
      const [year = "", month = ""] = value.split("-");
      setForm((current) => ({ ...current, releaseYear: year, releaseMonth: month, releaseDay: "" }));
    } else if (form.releaseDatePrecision === "Ano") {
      setForm((current) => ({ ...current, releaseYear: value, releaseMonth: "", releaseDay: "" }));
    }

    setInvalidFields((current) => current.filter((item) => item !== "releaseDate"));
  }

  function getInvalidFields() {
    const invalid: string[] = [];

    if (form.number === "" || Number(form.number) < 0) invalid.push("number");
    if (!form.coverUrl || !isAbsoluteUrl(form.coverUrl)) invalid.push("coverUrl");
    if (form.affiliateLink && !isAbsoluteUrl(form.affiliateLink)) invalid.push("affiliateLink");
    if (form.pages && Number(form.pages) <= 0) invalid.push("pages");
    if (form.price && Number(form.price) < 0) invalid.push("price");
    if (form.releaseDatePrecision === "Completa" && (!form.releaseYear || !form.releaseMonth || !form.releaseDay)) invalid.push("releaseDate");
    if (form.releaseDatePrecision === "Mes e ano" && (!form.releaseYear || !form.releaseMonth)) invalid.push("releaseDate");
    if (form.releaseDatePrecision === "Ano" && !form.releaseYear) invalid.push("releaseDate");

    return invalid;
  }

  function validateForm() {
    const invalid = getInvalidFields();
    setInvalidFields(invalid);
    return invalid.length === 0;
  }

  function getDetailsStepInvalidFields() {
    const invalid: string[] = [];

    if (form.number === "" || Number(form.number) < 0) invalid.push("number");
    if (form.releaseDatePrecision === "Completa" && (!form.releaseYear || !form.releaseMonth || !form.releaseDay)) invalid.push("releaseDate");
    if (form.releaseDatePrecision === "Mes e ano" && (!form.releaseYear || !form.releaseMonth)) invalid.push("releaseDate");
    if (form.releaseDatePrecision === "Ano" && !form.releaseYear) invalid.push("releaseDate");

    return invalid;
  }

  function validateDetailsStep() {
    const invalid = getDetailsStepInvalidFields();
    setInvalidFields(invalid);
    return invalid.length === 0;
  }

  function goToMediaStep() {
    if (!validateDetailsStep()) return;
    setCurrentStep("media");
  }

  function changeStep(step: VolumeStep) {
    if (step === "media" && currentStep === "details" && !validateDetailsStep()) return;
    setCurrentStep(step);
  }

  function buildPayload() {
    return {
      number: Number(form.number),
      singleVolume: form.singleVolume,
      coverUrl: form.coverUrl || null,
      pages: form.pages ? Number(form.pages) : null,
      price: form.price ? Number(form.price) : null,
      priceCurrency: form.priceCurrency,
      releaseDatePrecision: form.releaseDatePrecision,
      releaseYear: Number(form.releaseYear),
      releaseMonth: ["Completa", "Mes e ano"].includes(form.releaseDatePrecision) ? Number(form.releaseMonth) : null,
      releaseDay: form.releaseDatePrecision === "Completa" ? Number(form.releaseDay) : null,
      isbn10: form.isbn10 || null,
      isbn13: form.isbn13 || null,
      affiliateLink: form.affiliateLink || null,
      synopsis: form.synopsis || null,
    };
  }

  async function handleSave() {
    if (saving || !validateForm()) return;

    setSaving(true);

    try {
      if (isEditing) {
        await api.patch(`/admin/volumes/${volumeId}`, buildPayload());
        toast.success("Volume atualizado com sucesso.");
        setBaselineSignature(formSignature);
      } else {
        const response = await api.post<VolumeResponse>(`/admin/editions/${editionId || state?.editionId}/volumes`, buildPayload());
        toast.success("Volume cadastrado com sucesso.");
        setBaselineSignature(formSignature);
        navigate("/admin/pos-cadastro", {
          state: {
            title: "Volume cadastrado com sucesso!",
            description: "Escolha o próximo passo para continuar esta Edição.",
            actions: [
              {
                label: "Gerenciar este Volume",
                to: volumeAdminPath(workSlug, editionId || state?.editionId || "", response.data.volume.id),
                state: { workId: state?.workId, editionId: state?.editionId || Number(editionId), volumeId: response.data.volume.id },
              },
              {
                label: "Cadastrar novo Volume",
                to: newVolumeAdminPath(workSlug, editionId || state?.editionId || ""),
                state: { workId: state?.workId, editionId: state?.editionId || Number(editionId) },
              },
            ],
          },
        });
        return;
      }

      navigate(editionPath, {
        state: { workId: state?.workId, editionId: state?.editionId || Number(editionId) },
      });
    } catch (saveError) {
      toast.error(getApiError(saveError, isEditing ? "Erro ao alterar Volume." : "Erro ao cadastrar Volume."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando formulário.
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {error}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <UnsavedChangesPrompt when={hasUnsavedChanges} continueLabel={isEditing ? "Continuar editando" : "Continuar cadastrando"} />
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Link
          to={editionPath}
          state={{ workId: state?.workId, editionId: state?.editionId || Number(editionId) }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div>
          <h1 className="text-3xl font-bold text-foreground">{isEditing ? "Editar Volume" : "Novo Volume"}</h1>
          <p className="mt-2 text-muted-foreground">
            Cadastre os dados físicos, comerciais e editoriais do tomo.
          </p>
        </div>

        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            {volumeSteps.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => changeStep(step.id)}
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

          <section className="space-y-6 rounded-2xl border border-border bg-card p-4 sm:p-5">
            {currentStep === "details" ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <InputField
                    label="Número do Volume"
                    value={form.number}
                    onChange={(value) => updateField("number", value)}
                    type="number"
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
                  onChange={(checked) => setForm((current) => ({ ...current, singleVolume: checked }))}
                />

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
                  <InputField
                    label="ISBN-10"
                    value={form.isbn10}
                    onChange={(value) => updateField("isbn10", value)}
                    placeholder="Digite"
                  />
                  <InputField
                    label="ISBN-13"
                    value={form.isbn13}
                    onChange={(value) => updateField("isbn13", value)}
                    placeholder="Digite"
                  />
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
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-[120px_1fr]">
                  <div className="aspect-[2/3] w-28 overflow-hidden rounded-xl border border-border bg-input">
                    {form.coverUrl && isAbsoluteUrl(form.coverUrl) ? (
                      <img src={form.coverUrl} alt="Prévia da capa do Volume" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center px-3 text-center text-xs font-semibold text-muted-foreground">
                        Prévia
                      </div>
                    )}
                  </div>
                  <InputField
                    label="URL da capa"
                    value={form.coverUrl}
                    onChange={(value) => updateField("coverUrl", value)}
                    required
                    invalid={invalidFields.includes("coverUrl")}
                    errorMessage="Informe uma URL absoluta válida."
                    placeholder="Digite"
                  />
                </div>

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
            )}
          </section>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                setForm(emptyForm);
                setInvalidFields([]);
                setBaselineSignature(JSON.stringify(emptyForm));
              }}
              disabled={saving}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
            >
              <RotateCcw className="h-4 w-4" />
              Limpar formulário
            </button>
            <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
              {currentStep === "media" && (
                <button
                  type="button"
                  onClick={() => setCurrentStep("details")}
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-32"
                >
                  Voltar
                </button>
              )}
              {currentStep === "details" ? (
                <button
                  type="button"
                  onClick={goToMediaStep}
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-40"
                >
                  Continuar
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-40"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Salvar
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
          className={`h-12 w-full rounded-xl border bg-input px-4 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary ${
            invalid ? "border-red-500" : "border-border"
          }`}
        />
      </div>
      {invalid && (
        <p className="mt-2 text-sm font-semibold text-red-400">Informe a data conforme a precisão selecionada.</p>
      )}
    </div>
  );
}

export default VolumeForm;
