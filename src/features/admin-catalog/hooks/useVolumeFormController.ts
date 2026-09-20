import { type Dispatch, type SetStateAction, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getApiError } from "@/lib/apiError";
import { api } from "@/services/api";
import { editionAdminPath, newVolumeAdminPath, volumeAdminPath } from "../domain/catalogPaths";
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
  const isEditing = Boolean(volumeId);
  const draftKey = `${workSlug.toLocaleLowerCase("pt-BR")}:${editionId || state?.editionId || ""}`;
  const rememberedDraft = useMemo(() => getRememberedVolumeDraft(draftKey), [draftKey]);
  const editionPath = useMemo(() => editionAdminPath(workSlug, editionId), [workSlug, editionId]);
  const [form, setForm] = useState<VolumeDraft>(() => (isEditing ? emptyVolumeDraft : rememberedDraft.form));
  const [currentStep, setCurrentStep] = useState<VolumeStep>(() => (isEditing ? "details" : rememberedDraft.currentStep));
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [baselineSignature, setBaselineSignature] = useState("");
  const formSignature = useMemo(() => JSON.stringify(form), [form]);
  const hasUnsavedChanges = Boolean(baselineSignature) && formSignature !== baselineSignature && !saving;

  useEffect(() => {
    if (!isEditing) rememberVolumeDraft(draftKey, { form, currentStep });
  }, [currentStep, draftKey, form, isEditing]);

  useLoadVolume({
    fallbackVolumeId: state?.volumeId,
    isEditing,
    setBaselineSignature,
    setError,
    setForm,
    setLoading,
    volumeId,
  });

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
        editionId,
        editionPath,
        form,
        formSignature,
        isEditing,
        navigate,
        setBaselineSignature,
        state,
        volumeId,
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
    setCurrentStep,
    setForm,
    state,
    updateCover,
    updateField,
    updateReleaseDate,
    updateReleasePrecision,
  };
}

interface LoadVolumeArgs {
  fallbackVolumeId?: number;
  isEditing: boolean;
  setBaselineSignature: Dispatch<SetStateAction<string>>;
  setError: Dispatch<SetStateAction<string>>;
  setForm: Dispatch<SetStateAction<VolumeDraft>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  volumeId: string;
}

function useLoadVolume({
  fallbackVolumeId,
  isEditing,
  setBaselineSignature,
  setError,
  setForm,
  setLoading,
  volumeId,
}: LoadVolumeArgs) {
  useEffect(() => {
    let isMounted = true;
    async function loadVolume() {
      if (!isEditing) return;
      setLoading(true);
      setError("");
      try {
        const response = await api.get<VolumeResponse>(`/admin/volumes/${volumeId || fallbackVolumeId}`);
        if (!isMounted) return;
        const loadedForm = volumeToDraft(response.data.volume);
        setForm(loadedForm);
        setBaselineSignature(JSON.stringify(loadedForm));
      } catch (loadError) {
        if (isMounted) setError(getApiError(loadError, "Erro ao carregar dados do Volume."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadVolume();
    return () => {
      isMounted = false;
    };
  }, [fallbackVolumeId, isEditing, setBaselineSignature, setError, setForm, setLoading, volumeId]);
}

interface SaveVolumeArgs {
  draftKey: string;
  editionId: string;
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
  args.navigate("/admin/pos-cadastro", { state: postCreateState(args, response.data.volume.id) });
}

function resolvedEditionId(args: SaveVolumeArgs) {
  return args.editionId || args.state?.editionId || "";
}

function editionLocationState(args: SaveVolumeArgs) {
  return {
    workId: args.state?.workId,
    editionId: args.state?.editionId || Number(args.editionId),
  };
}

function postCreateState(args: SaveVolumeArgs, volumeId: number) {
  const editionId = resolvedEditionId(args);
  return {
    title: "Volume cadastrado com sucesso!",
    description: "Escolha o próximo passo para continuar esta Edição.",
    actions: [
      {
        label: "Gerenciar este Volume",
        to: volumeAdminPath(args.workSlug, editionId, volumeId),
        state: { ...editionLocationState(args), volumeId },
      },
      {
        label: "Cadastrar novo Volume",
        to: newVolumeAdminPath(args.workSlug, editionId),
        state: editionLocationState(args),
      },
    ],
  };
}
