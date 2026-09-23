import { type FormEvent, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { getApiError } from "@/lib/apiError";
import { api } from "@/services/api";
import { editionAdminPath, newEditionAdminPath, newVolumeAdminPath, workAdminPath } from "../domain/catalogPaths";
import {
  emptyEditionDraft,
  getRememberedEditionDraft,
  rememberEditionDraft,
  resetEditionDraftMemory,
  type EditionDraft,
} from "../pages/editionDraftMemory";
import {
  buildEditionPayload,
  editionToDraft,
  isEditionDraftIncomplete,
  type EditionFormOptions,
  type EditionFormOptionsResponse,
  type EditionResponse,
  type WorkResponse,
} from "../pages/editionFormModel";

export function useEditionFormController() {
  const { workSlug = "", editionId } = useParams();
  const navigate = useNavigate();
  const draftKey = workSlug.toLocaleLowerCase("pt-BR");
  const isEditMode = Boolean(editionId);
  const [workId, setWorkId] = useState("");
  const [workTitle, setWorkTitle] = useState("");
  const [options, setOptions] = useState<EditionFormOptions | null>(null);
  const [draft, setDraft] = useState(() => (editionId ? emptyEditionDraft : getRememberedEditionDraft(draftKey)));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [baselineSignature, setBaselineSignature] = useState("");
  const workPath = useMemo(() => workAdminPath(workSlug), [workSlug]);
  const draftSignature = useMemo(() => JSON.stringify(draft), [draft]);
  const hasUnsavedChanges = Boolean(baselineSignature) && draftSignature !== baselineSignature && !saving;

  useEffect(() => {
    if (!isEditMode) rememberEditionDraft(draftKey, draft);
  }, [draft, draftKey, isEditMode]);

  useEffect(() => {
    let isMounted = true;
    async function loadForm() {
      setLoading(true);
      setError("");
      try {
        const [workResponse, optionsResponse, editionResponse] = await Promise.all([
          resolveWork(workSlug),
          ...loadEditionData(editionId),
        ]);
        if (!isMounted) return;
        const loadedDraft = editionResponse ? editionToDraft(editionResponse.data.edition) : emptyEditionDraft;
        setWorkId(String(workResponse.data.work.id));
        setWorkTitle(editionResponse?.data.edition.work.title || workResponse.data.work.title);
        setOptions(optionsResponse.data.options);
        if (editionResponse) setDraft(loadedDraft);
        setBaselineSignature(JSON.stringify(loadedDraft));
      } catch (loadError) {
        if (isMounted) setError(getLoadError(loadError));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadForm();
    return () => {
      isMounted = false;
    };
  }, [editionId, workSlug]);

  function updateDraft<K extends keyof EditionDraft>(field: K, value: EditionDraft[K]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    if (isEditionDraftIncomplete(draft)) {
      toast.error("Preencha os campos obrigatórios da Edição.");
      return;
    }
    setSaving(true);
    try {
      await saveEdition({
        draft,
        draftKey,
        draftSignature,
        editionId,
        isEditMode,
        workId,
        workSlug,
        navigate,
        setBaselineSignature,
      });
    } catch (saveError) {
      toast.error(getApiError(saveError, isEditMode ? "Erro ao atualizar Edição." : "Erro ao cadastrar Edição."));
    } finally {
      setSaving(false);
    }
  }

  return {
    draft,
    error,
    handleSubmit,
    hasUnsavedChanges,
    isEditMode,
    loading,
    options,
    saving,
    updateDraft,
    workId,
    workPath,
    workTitle,
  };
}

async function resolveWork(workSlug: string) {
  return api.get<WorkResponse>(`/admin/works/slug/${encodeURIComponent(workSlug)}`);
}

function loadEditionData(editionId?: string) {
  const optionsResponse = api.get<EditionFormOptionsResponse>("/admin/editions/form-options");
  const editionResponse = editionId ? api.get<EditionResponse>(`/admin/editions/${editionId}`) : Promise.resolve(null);
  return [optionsResponse, editionResponse] as const;
}

function getLoadError(loadError: unknown) {
  const fallback = loadError instanceof Error ? loadError.message : "Erro ao carregar formulário da Edição.";
  return getApiError(loadError, fallback);
}

interface SaveEditionArgs {
  draft: EditionDraft;
  draftKey: string;
  draftSignature: string;
  editionId?: string;
  isEditMode: boolean;
  workId: string;
  workSlug: string;
  navigate: ReturnType<typeof useNavigate>;
  setBaselineSignature: (signature: string) => void;
}

async function saveEdition(args: SaveEditionArgs) {
  const payload = buildEditionPayload(args.draft);
  if (args.isEditMode) {
    await api.patch(`/admin/editions/${args.editionId}`, payload);
    toast.success("Edição atualizada com sucesso.");
    args.setBaselineSignature(args.draftSignature);
    args.navigate(editionAdminPath(args.workSlug, args.editionId || ""), {
      state: { workId: Number(args.workId), editionId: Number(args.editionId) },
    });
    return;
  }
  const response = await api.post<EditionResponse>(`/admin/works/${args.workId}/editions`, payload);
  toast.success("Edição cadastrada com sucesso.");
  resetEditionDraftMemory(args.draftKey);
  args.setBaselineSignature(args.draftSignature);
  args.navigate("/admin/pos-cadastro", { state: buildPostCreateState(args, response.data.edition.id) });
}

function buildPostCreateState(args: SaveEditionArgs, editionId: number) {
  return {
    title: "Edição cadastrada com sucesso!",
    description: "Escolha o próximo passo para continuar organizando esta Obra.",
    actions: [
      {
        label: "Gerenciar esta Edição",
        to: editionAdminPath(args.workSlug, editionId),
        state: { workId: Number(args.workId), editionId },
      },
      {
        label: "Cadastrar nova Edição",
        to: newEditionAdminPath(args.workSlug),
        state: { workId: Number(args.workId) },
      },
      {
        label: "Cadastrar Volume para esta Edição",
        to: newVolumeAdminPath(args.workSlug, editionId),
        state: { workId: Number(args.workId), editionId },
      },
    ],
  };
}
