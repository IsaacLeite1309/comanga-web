import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getApiError } from "@/lib/apiError";
import { api } from "@/services/api";
import { editionAdminPath, newVolumeAdminPath, volumeEditAdminPath } from "../domain/catalogPaths";
import { getEditionByNumber, getVolumeByNumber } from "../domain/contextualAdminCatalog";
import {
  emptyVolumeDraft,
  getRememberedVolumeDraft,
  rememberVolumeDraft,
  resetVolumeDraftMemory,
  type RememberedVolumeStep,
  type VolumeDraft,
} from "../pages/volumeDraftMemory";
import {
  buildVolumePayload,
  getDetailsInvalidFields,
  getVolumeInvalidFields,
  updateReleaseDateParts,
  volumeToDraft,
  type ReleaseDatePrecision,
  type VolumeResponse,
} from "../pages/volumeFormModel";
import { useWorkSummary } from "./useWorkDetails";

interface LocationState {
  workId?: number;
  editionId?: number;
  volumeId?: number;
}
type VolumeStep = RememberedVolumeStep;

export function useVolumeFormController() {
  const { workSlug = "", editionId = "", volumeId = "" } = useParams();
  const state = useLocation().state as LocationState | null;
  const navigate = useNavigate();
  const workSummary = useWorkSummary(workSlug);
  const isEditing = Boolean(volumeId);
  const draftKey = `${workSlug.toLocaleLowerCase("pt-BR")}:${editionId}`;
  const rememberedDraft = useMemo(() => getRememberedVolumeDraft(draftKey), [draftKey]);
  const editionPath = useMemo(() => editionAdminPath(workSlug, editionId), [workSlug, editionId]);
  const [form, setForm] = useState<VolumeDraft>(() => (isEditing ? emptyVolumeDraft : rememberedDraft.form));
  const [resolvedEditionId, setResolvedEditionId] = useState<number | null>(state?.editionId ?? null);
  const [resolvedVolumeId, setResolvedVolumeId] = useState<number | null>(null);
  const [currentStep, setCurrentStep] = useState<VolumeStep>(() => (isEditing ? "details" : rememberedDraft.currentStep));
  const [loading, setLoading] = useState(isEditing || !state?.editionId);
  const [saving, setSaving] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [error, setError] = useState("");
  const singleVolumeUnavailable = useSingleVolumeAvailability(resolvedEditionId, resolvedVolumeId, isEditing);
  const [baselineSignature, setBaselineSignature] = useState("");
  const formSignature = useMemo(() => JSON.stringify(form), [form]);
  const hasUnsavedChanges = Boolean(baselineSignature) && formSignature !== baselineSignature && !saving;

  useEffect(() => {
    if (!isEditing) rememberVolumeDraft(draftKey, { form, currentStep });
  }, [currentStep, draftKey, form, isEditing]);

  useLoadContextualVolume({ workSlug, editionId, volumeId, isEditing, fallbackEditionId: state?.editionId, setResolvedEditionId,
    setResolvedVolumeId, setForm, setBaselineSignature, setError, setLoading });

  useEffect(() => {
    if (!isEditing && !baselineSignature) setBaselineSignature(JSON.stringify(emptyVolumeDraft));
  }, [baselineSignature, isEditing]);

  function updateField(field: keyof VolumeDraft, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setInvalidFields((current) => current.filter((item) => item !== field));
  }

  function updateReleasePrecision(value: ReleaseDatePrecision) {
    setForm((current) => ({
      ...current,
      releaseDatePrecision: value,
      releaseMonth: ["Completa", "Mes e ano"].includes(value) ? current.releaseMonth : "",
      releaseDay: value === "Completa" ? current.releaseDay : "",
    }));
    clearInvalidField("releaseDate");
  }

  function updateReleaseDate(value: string) {
    setForm((current) => updateReleaseDateParts(current, value));
    clearInvalidField("releaseDate");
  }

  function clearInvalidField(field: string) {
    setInvalidFields((current) => current.filter((item) => item !== field));
  }

  function validateDetailsStep() {
    const invalid = getDetailsInvalidFields(form);
    setInvalidFields(invalid);
    return invalid.length === 0;
  }

  function changeStep(step: VolumeStep) {
    if (step === "media" && currentStep === "details" && !validateDetailsStep()) return;
    setCurrentStep(step);
  }

  function goToMediaStep() {
    if (validateDetailsStep()) setCurrentStep("media");
  }

  function updateCover(cover: { assetId: string; coverUrl: string; pending: boolean } | null) {
    setForm((current) => ({
      ...current,
      coverAssetId: cover?.assetId || "",
      coverUrl: cover?.coverUrl || "",
      coverPending: cover?.pending || false,
    }));
    clearInvalidField("coverAssetId");
  }

  function resetForm() {
    setForm(emptyVolumeDraft);
    setCurrentStep("details");
    resetVolumeDraftMemory(draftKey);
    setInvalidFields([]);
    setBaselineSignature(JSON.stringify(emptyVolumeDraft));
  }

  async function handleSave() {
    const invalid = getVolumeInvalidFields(form);
    if (saving) return;
    setInvalidFields(invalid);
    if (invalid.length > 0) return;
    setSaving(true);
    try {
      await saveVolume({
        draftKey,
        editionId: String(resolvedEditionId),
        editionNumber: editionId,
        editionPath,
        form,
        formSignature,
        isEditing,
        navigate,
        setBaselineSignature,
        state,
        volumeId: String(resolvedVolumeId),
        workSlug,
      });
    } catch (saveError) {
      toast.error(getApiError(saveError, isEditing ? "Erro ao alterar Volume." : "Erro ao cadastrar Volume."));
    } finally {
      setSaving(false);
    }
  }

  return {
    changeStep,
    currentStep,
    editionId,
    resolvedEditionId,
    editionPath,
    error,
    form,
    goToMediaStep,
    handleSave,
    hasUnsavedChanges,
    invalidFields,
    isEditing,
    loading,
    resetForm,
    saving,
    singleVolumeUnavailable,
    setCurrentStep,
    setForm,
    state,
    updateCover,
    updateField,
    updateReleaseDate,
    updateReleasePrecision,
    workSlug,
    workTitle: workSummary.work?.title || decodeURIComponent(workSlug),
  };
}

function useSingleVolumeAvailability(editionId: number | null, volumeId: number | null, isEditing: boolean) {
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let active = true;
    if (!editionId) return;
    api.get<{ volumes: Array<{ id: number }>; pagination: { total: number } }>(`/admin/editions/${editionId}/volumes`, {
      params: { page: 1, limit: 2 },
    }).then(({ data }) => {
      if (!active) return;
      const hasOtherVolume = data.pagination.total > 1
        || (data.pagination.total === 1 && (!isEditing || data.volumes[0]?.id !== volumeId));
      setUnavailable(hasOtherVolume);
    }).catch(() => {});
    return () => { active = false; };
  }, [editionId, volumeId, isEditing]);
  return unavailable;
}

interface LoadContextualVolumeArgs {
  workSlug: string;
  editionId: string;
  volumeId: string;
  isEditing: boolean;
  fallbackEditionId?: number;
  setResolvedEditionId: Dispatch<SetStateAction<number | null>>;
  setResolvedVolumeId: Dispatch<SetStateAction<number | null>>;
  setForm: Dispatch<SetStateAction<VolumeDraft>>;
  setBaselineSignature: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
}

function useLoadContextualVolume(args: LoadContextualVolumeArgs) {
  const { workSlug, editionId, volumeId, isEditing, fallbackEditionId, setResolvedEditionId, setResolvedVolumeId,
    setForm, setBaselineSignature, setError, setLoading } = args;
  useEffect(() => {
    let active = true;
    setLoading(isEditing || !fallbackEditionId);
    setError("");
    Promise.all([
      getEditionByNumber(workSlug, editionId),
      isEditing ? getVolumeByNumber<VolumeResponse["volume"]>(workSlug, editionId, volumeId) : Promise.resolve(null),
    ]).then(([edition, volume]) => {
      if (!active) return;
      setResolvedEditionId(edition.id);
      setResolvedVolumeId(volume?.id ?? null);
      if (volume) {
        const loaded = volumeToDraft(volume);
        setForm(loaded);
        setBaselineSignature(JSON.stringify(loaded));
      }
    }).catch((loadError) => {
      if (active) setError(getApiError(loadError, "Erro ao carregar dados do Volume."));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [workSlug, editionId, volumeId, isEditing, fallbackEditionId, setResolvedEditionId, setResolvedVolumeId,
    setForm, setBaselineSignature, setError, setLoading]);
}

interface SaveVolumeArgs {
  draftKey: string;
  editionId: string;
  editionNumber: string;
  editionPath: string;
  form: VolumeDraft;
  formSignature: string;
  isEditing: boolean;
  navigate: ReturnType<typeof useNavigate>;
  setBaselineSignature: (signature: string) => void;
  state: LocationState | null;
  volumeId: string;
  workSlug: string;
}

async function saveVolume(args: SaveVolumeArgs) {
  const payload = buildVolumePayload(args.form);
  if (args.isEditing) {
    await api.patch(`/admin/volumes/${args.volumeId}`, payload);
    toast.success("Volume atualizado com sucesso.");
    args.setBaselineSignature(args.formSignature);
    args.navigate(args.editionPath, { state: editionLocationState(args) });
    return;
  }
  const response = await api.post<VolumeResponse>(`/admin/editions/${resolvedEditionId(args)}/volumes`, payload);
  toast.success("Volume cadastrado com sucesso.");
  resetVolumeDraftMemory(args.draftKey);
  args.setBaselineSignature(args.formSignature);
  args.navigate("/admin/pos-cadastro", { state: postCreateState(args, response.data.volume.id, response.data.volume.number) });
}

function resolvedEditionId(args: SaveVolumeArgs) {
  return args.editionId || args.state?.editionId || "";
}

function editionLocationState(args: SaveVolumeArgs) {
  return {
    workId: args.state?.workId,
    editionId: Number(args.editionId),
  };
}

function postCreateState(args: SaveVolumeArgs, volumeId: number, volumeNumber: number) {
  return {
    title: "Volume cadastrado com sucesso!",
    description: "Escolha o próximo passo para continuar esta Edição.",
    actions: [
      {
        label: "Gerenciar este Volume",
        to: volumeEditAdminPath(args.workSlug, args.editionNumber, volumeNumber),
        state: { ...editionLocationState(args), volumeId },
      },
      ...(!args.form.singleVolume
        ? [{
          label: "Cadastrar novo Volume",
          to: newVolumeAdminPath(args.workSlug, args.editionNumber),
          state: editionLocationState(args),
        }]
        : []),
    ],
  };
}
