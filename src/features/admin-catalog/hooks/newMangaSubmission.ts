import { FormEvent, type Dispatch, type SetStateAction } from 'react';
import type { NavigateFunction } from 'react-router-dom';
import { toast } from 'sonner';
import { api } from '@/services/api';
import { getApiError } from '@/lib/apiError';
import { newEditionAdminPath, workEditAdminPath } from '../domain/catalogPaths';
import { resetNewMangaDraftMemory } from '../pages/newMangaMemory';
import { buildWorkPayload, getInvalidAuthorFields, getInvalidIdentificationFields, getInvalidMediaFields, getInvalidPublicationFields, validateCompleteForm } from '../pages/newMangaLogic';
import type { NewMangaDraft, NewMangaMode, NewMangaStep, WorkDetailResponse } from '../pages/newMangaTypes';

import type { DerivedState } from './newMangaOptions';
import { createStepActions } from './newMangaDraft';

export { createSubmissionHandler };

type SubmissionSettings = {
  currentStep: NewMangaStep;
  derived: DerivedState;
  draft: NewMangaDraft;
  mode: NewMangaMode;
  navigate: NavigateFunction;
  setBaselineSignature: Dispatch<SetStateAction<string>>;
  setFieldError: Dispatch<SetStateAction<string>>;
  setInvalidFields: Dispatch<SetStateAction<string[]>>;
  setSaving: Dispatch<SetStateAction<boolean>>;
  signature: string;
  stepActions: ReturnType<typeof createStepActions>;
  workId?: string;
};

function createSubmissionHandler(settings: SubmissionSettings) {
  const { derived, draft, mode, navigate, signature, workId } = settings;
  function showValidationError(message: string) {
    if (message === "Autor duplicado!") {
      settings.setFieldError(message);
      settings.setInvalidFields([]);
      return;
    }
    const fields = [
    ...getInvalidIdentificationFields(draft),
    ...getInvalidAuthorFields(draft),
    ...getInvalidPublicationFields(draft, derived),
    ...getInvalidMediaFields(draft),
    ];
    settings.setFieldError(fields.length === 0 ? message : "");
    settings.setInvalidFields(fields);
  }
  async function saveWork() {
    const payload = buildWorkPayload(draft, derived);
    if (mode === "edit" && workId) {
      await api.patch(`/admin/works/${workId}`, payload);
      toast.success("Obra atualizada com sucesso.");
      settings.setBaselineSignature(signature);
      navigate("/admin/gerenciar-mangas");
      return;
    }
    const response = await api.post<WorkDetailResponse>("/admin/works", payload);
    toast.success("Obra cadastrada com sucesso.");
    resetNewMangaDraftMemory();
    settings.setBaselineSignature(signature);
    const createdWork = response.data.work;
    const workEditPath = workEditAdminPath(createdWork.slug);
    navigate("/admin/pos-cadastro", { state: {
      title: "Obra cadastrada com sucesso!",
      description: "Escolha o próximo passo para continuar o cadastro do catálogo.",
      actions: [
        { label: "Editar esta Obra", to: workEditPath, state: { workId: createdWork.id } },
        { label: "Cadastrar nova Obra", to: "/admin/novo-manga" },
        { label: "Cadastrar Edição para esta Obra", to: newEditionAdminPath(createdWork.slug), state: { workId: createdWork.id } },
      ],
    } });
  }
  return async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settings.currentStep === "identification") return settings.stepActions.goToAuthorsStep();
    if (settings.currentStep === "authors") return settings.stepActions.goToPublicationStep();
    if (settings.currentStep === "publication") return settings.stepActions.goToMediaStep();
    const validationError = validateCompleteForm(draft, derived);
    if (validationError) return showValidationError(validationError);
    settings.setFieldError("");
    settings.setSaving(true);
    try {
      await saveWork();
    } catch (error) {
      toast.error(getApiError(error, mode === "edit" ? "Erro ao atualizar Obra." : "Erro ao cadastrar Obra."));
    } finally {
      settings.setSaving(false);
    }
  };
}
