import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { UnsavedChangesPrompt } from "@/hooks/useUnsavedChangesWarning";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { getApiError } from "@/lib/apiError";
import {
  editionAdminPath,
  newEditionAdminPath,
  newVolumeAdminPath,
  workAdminPath,
} from "@/lib/catalogPaths";

interface LocationState {
  workId?: number;
  editionId?: number;
}

interface OptionValue {
  id: number | string;
  label: string;
}

interface EditionFormOptionsResponse {
  options: {
    brazilianPublishers: OptionValue[];
    editionTypes: OptionValue[];
    coverTypes: OptionValue[];
    formats: OptionValue[];
  };
}

interface Edition {
  id: number;
  workId: number;
  chronologicalNumber: number;
  coverUrl?: string | null;
  brazilianPublisher: OptionValue | null;
  editionType: OptionValue | null;
  coverType: OptionValue | null;
  format: OptionValue | null;
  brazilPublicationStatus: string | OptionValue | null;
}

interface EditionResponse {
  edition: Edition;
}

interface WorkResponse {
  work: {
    id: number;
    slug: string;
    title: string;
  };
}

const emptyDraft = {
  brazilianPublisherId: "",
  editionTypeId: "",
  coverTypeId: "",
  formatId: "",
  chronologicalNumber: "",
  brazilPublicationStatus: "",
  coverUrl: "",
};

const EDITION_NUMBER_OPTIONS: OptionValue[] = Array.from({ length: 10 }, (_, index) => ({
  id: String(index + 1),
  label: `${index + 1}ª Edição`,
}));

const EDITION_PUBLICATION_STATUS_OPTIONS: OptionValue[] = [
  { id: "Completo", label: "Completo" },
  { id: "Em andamento", label: "Em andamento" },
  { id: "Em hiato", label: "Em hiato" },
  { id: "Cancelado", label: "Cancelado" },
];

const EditionForm = () => {
  const { workSlug = "", editionId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;
  const routedWorkId = state?.workId ? String(state.workId) : "";
  const [workId, setWorkId] = useState(routedWorkId);
  const [options, setOptions] = useState<EditionFormOptionsResponse["options"] | null>(null);
  const [draft, setDraft] = useState(emptyDraft);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [baselineSignature, setBaselineSignature] = useState("");
  const isEditMode = Boolean(editionId);
  const workPath = useMemo(() => workAdminPath(workSlug), [workSlug]);
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const coverPreviewUrl = useMemo(() => {
    const trimmedUrl = draft.coverUrl.trim();

    if (!trimmedUrl) return "";

    try {
      const parsedUrl = new URL(trimmedUrl);
      return ["http:", "https:"].includes(parsedUrl.protocol) ? parsedUrl.toString() : "";
    } catch {
      return "";
    }
  }, [draft.coverUrl]);

  const hasUnsavedChanges = Boolean(baselineSignature) && draftSignature !== baselineSignature && !saving;

  useEffect(() => {
    let isMounted = true;
    async function resolveWorkId() {
      if (routedWorkId || !workSlug) return routedWorkId;

      const response = await api.get<WorkResponse>(`/admin/works/slug/${encodeURIComponent(workSlug)}`);
      const resolvedId = String(response.data.work.id);

      if (isMounted) setWorkId(resolvedId);
      return resolvedId;
    }

    async function loadForm() {
      setLoading(true);
      setError("");

      try {
        const resolvedWorkId = await resolveWorkId();
        if (!resolvedWorkId) return;

        const [optionsResponse, editionResponse] = await Promise.all([
          api.get<EditionFormOptionsResponse>("/admin/editions/form-options"),
          isEditMode
            ? api.get<EditionResponse>(`/admin/editions/${editionId}`)
            : Promise.resolve(null),
        ]);

        if (!isMounted) return;

        setOptions(optionsResponse.data.options);

        if (editionResponse?.data.edition) {
          const edition = editionResponse.data.edition;
          setDraft({
            brazilianPublisherId: edition.brazilianPublisher?.id ? String(edition.brazilianPublisher.id) : "",
            editionTypeId: edition.editionType?.id ? String(edition.editionType.id) : "",
            coverTypeId: edition.coverType?.id ? String(edition.coverType.id) : "",
            formatId: edition.format?.id ? String(edition.format.id) : "",
            chronologicalNumber: String(edition.chronologicalNumber),
            brazilPublicationStatus: typeof edition.brazilPublicationStatus === "string"
              ? edition.brazilPublicationStatus
              : edition.brazilPublicationStatus?.label || "",
            coverUrl: edition.coverUrl || "",
          });
        }

        setBaselineSignature(JSON.stringify(editionResponse?.data.edition ? {
          brazilianPublisherId: editionResponse.data.edition.brazilianPublisher?.id ? String(editionResponse.data.edition.brazilianPublisher.id) : "",
          editionTypeId: editionResponse.data.edition.editionType?.id ? String(editionResponse.data.edition.editionType.id) : "",
          coverTypeId: editionResponse.data.edition.coverType?.id ? String(editionResponse.data.edition.coverType.id) : "",
          formatId: editionResponse.data.edition.format?.id ? String(editionResponse.data.edition.format.id) : "",
          chronologicalNumber: String(editionResponse.data.edition.chronologicalNumber),
          brazilPublicationStatus: typeof editionResponse.data.edition.brazilPublicationStatus === "string"
            ? editionResponse.data.edition.brazilPublicationStatus
            : editionResponse.data.edition.brazilPublicationStatus?.label || "",
          coverUrl: editionResponse.data.edition.coverUrl || "",
        } : emptyDraft));
      } catch (loadError) {
        if (!isMounted) return;
        setError(getApiError(loadError, loadError instanceof Error ? loadError.message : "Erro ao carregar formulário da Edição."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadForm();

    return () => {
      isMounted = false;
    };
  }, [editionId, isEditMode, routedWorkId, workSlug]);

  function updateDraft(field: keyof typeof draft, value: string) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function buildPayload() {
    return {
      brazilianPublisherId: Number(draft.brazilianPublisherId),
      editionTypeId: Number(draft.editionTypeId),
      coverTypeId: Number(draft.coverTypeId),
      formatId: Number(draft.formatId),
      chronologicalNumber: Number(draft.chronologicalNumber),
      brazilPublicationStatus: draft.brazilPublicationStatus,
      coverUrl: draft.coverUrl.trim() || null,
    };
  }

  function isDraftIncomplete() {
    return !draft.brazilianPublisherId
      || !draft.editionTypeId
      || !draft.coverTypeId
      || !draft.formatId
      || !draft.chronologicalNumber
      || Number(draft.chronologicalNumber) <= 0
      || !draft.brazilPublicationStatus;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;

    if (isDraftIncomplete()) {
      toast.error("Preencha os campos obrigatórios da Edição.");
      return;
    }

    setSaving(true);

    try {
      if (isEditMode) {
        await api.patch(`/admin/editions/${editionId}`, buildPayload());
        toast.success("Edição atualizada com sucesso.");
        setBaselineSignature(draftSignature);
      } else {
        const response = await api.post<EditionResponse>(`/admin/works/${workId}/editions`, buildPayload());
        toast.success("Edição cadastrada com sucesso.");
        setBaselineSignature(draftSignature);
        navigate("/admin/pos-cadastro", {
          state: {
            title: "Edição cadastrada com sucesso!",
            description: "Escolha o próximo passo para continuar organizando esta Obra.",
            actions: [
              {
                label: "Gerenciar esta Edição",
                to: editionAdminPath(workSlug, response.data.edition.id),
                state: { workId: Number(workId), editionId: response.data.edition.id },
              },
              {
                label: "Cadastrar nova Edição",
                to: newEditionAdminPath(workSlug),
                state: { workId: Number(workId) },
              },
              {
                label: "Cadastrar Volume para esta Edição",
                to: newVolumeAdminPath(workSlug, response.data.edition.id),
                state: { workId: Number(workId), editionId: response.data.edition.id },
              },
            ],
          },
        });
        return;
      }

      navigate(workPath, { state: { workId: Number(workId) } });
    } catch (saveError) {
      toast.error(getApiError(saveError, isEditMode ? "Erro ao atualizar Edição." : "Erro ao cadastrar Edição."));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando formulário da Edição...
      </div>
    );
  }

  if (error || !options || !workId) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {error || "Não foi possível carregar o formulário da Edição."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <UnsavedChangesPrompt when={hasUnsavedChanges} continueLabel={isEditMode ? "Continuar editando" : "Continuar cadastrando"} />
      <form onSubmit={handleSubmit} className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <Link
            to={workPath}
            state={{ workId: Number(workId) }}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <h1 className="mt-4 text-2xl font-bold text-foreground sm:text-3xl">
            {isEditMode ? "Editar Edição" : "Nova Edição"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre os dados físicos da publicação vinculada à Obra selecionada.
          </p>
        </div>

        <section className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
          <EditionSelect label="Editora brasileira" value={draft.brazilianPublisherId} onChange={(value) => updateDraft("brazilianPublisherId", value)} options={options.brazilianPublishers} />
          <EditionSelect label="Tipo de edição" value={draft.editionTypeId} onChange={(value) => updateDraft("editionTypeId", value)} options={options.editionTypes} />
          <EditionSelect label="Acabamento" value={draft.coverTypeId} onChange={(value) => updateDraft("coverTypeId", value)} options={options.coverTypes} />
          <EditionSelect label="Formato" value={draft.formatId} onChange={(value) => updateDraft("formatId", value)} options={options.formats} />
          <EditionSelect label="Número da edição" value={draft.chronologicalNumber} onChange={(value) => updateDraft("chronologicalNumber", value)} options={EDITION_NUMBER_OPTIONS} />
          <EditionSelect label="Status de publicação" value={draft.brazilPublicationStatus} onChange={(value) => updateDraft("brazilPublicationStatus", value)} options={EDITION_PUBLICATION_STATUS_OPTIONS} />
          <div className="md:col-span-3">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              URL da capa da edição
            </span>
            <div className="mt-2 grid gap-3 sm:grid-cols-[96px_1fr] sm:items-start">
              <div className="flex aspect-[2/3] w-24 items-center justify-center overflow-hidden rounded-xl border border-border bg-input text-xs font-bold uppercase text-muted-foreground">
                {coverPreviewUrl ? (
                  <img
                    src={coverPreviewUrl}
                    alt="Prévia da capa da edição"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  "Prévia"
                )}
              </div>
              <EditionInput
                label="URL da capa da edição"
                value={draft.coverUrl}
                onChange={(value) => updateDraft("coverUrl", value)}
                hideLabel
              />
            </div>
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex h-12 min-w-44 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Salvar
          </button>
        </div>
      </form>
    </div>
  );
};

function EditionSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: OptionValue[];
}) {
  return (
    <div className="min-w-0">
      <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}<span className="text-red-400"> *</span>
      </span>
      <SearchableSelect
        ariaLabel={label}
        value={value}
        onChange={onChange}
        options={options}
        searchable
      />
    </div>
  );
}

function EditionInput({
  label,
  value,
  onChange,
  type = "text",
  required = false,
  hideLabel = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  hideLabel?: boolean;
}) {
  return (
    <label className="min-w-0">
      {hideLabel ? (
        <span className="sr-only">{label}</span>
      ) : (
        <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          {label}{required ? <span className="text-red-400"> *</span> : ""}
        </span>
      )}
      <input
        aria-label={label}
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Digite"
        className={`${hideLabel ? "" : "mt-2"} h-12 w-full rounded-xl border border-border bg-input px-3 text-base font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/40`}
      />
    </label>
  );
}

export default EditionForm;
