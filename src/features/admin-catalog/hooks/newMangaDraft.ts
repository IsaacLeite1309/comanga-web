import { useEffect, type Dispatch, type RefObject, type SetStateAction } from 'react';
import { emptyNewMangaDraft, rememberNewMangaDraft } from '../pages/newMangaMemory';
import { getInvalidAuthorFields, getInvalidIdentificationFields, getInvalidPublicationFields, hasDuplicateAuthors } from '../pages/newMangaLogic';
import type { NewMangaDraft, NewMangaMode, NewMangaStep } from '../pages/newMangaTypes';

import type { DerivedState } from './newMangaOptions';

export { withoutCurrentStep, useDraftLifecycle, useDocumentSubmitShortcut, createStepActions };

function withoutCurrentStep(value: typeof emptyNewMangaDraft): NewMangaDraft {
  const copy: Partial<typeof value> = { ...value };
  delete copy.currentStep;
  return copy as NewMangaDraft;
}

function useDraftLifecycle(
  mode: NewMangaMode,
  draft: NewMangaDraft,
  currentStep: NewMangaStep,
  effectiveDirectRelease: boolean,
  signature: string,
  loading: boolean,
  baseline: string,
  setBaseline: Dispatch<SetStateAction<string>>
) {
  useEffect(() => {
    if (!loading && !baseline) setBaseline(signature);
  }, [baseline, loading, setBaseline, signature]);
  useEffect(() => {
    if (mode === "create") {
      rememberNewMangaDraft({ ...draft, directRelease: effectiveDirectRelease, currentStep });
    }
  }, [currentStep, draft, effectiveDirectRelease, mode]);
}

function useDocumentSubmitShortcut(
  currentStep: NewMangaStep,
  saving: boolean,
  optionsError: string,
  formRef: RefObject<HTMLFormElement | null>
) {
  useEffect(() => {
    function handleKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Enter" || event.defaultPrevented) return;
      const active = document.activeElement;
      const isFormControl = active instanceof HTMLInputElement
        || active instanceof HTMLTextAreaElement
        || active instanceof HTMLSelectElement
        || active instanceof HTMLButtonElement;
      if (isFormControl) return;
      if (currentStep === "media" && !saving && !optionsError) formRef.current?.requestSubmit();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, formRef, optionsError, saving]);
}

function createStepActions(
  draft: NewMangaDraft,
  derived: DerivedState,
  setFieldError: Dispatch<SetStateAction<string>>,
  setInvalidFields: Dispatch<SetStateAction<string[]>>,
  setCurrentStep: Dispatch<SetStateAction<NewMangaStep>>
) {
  function showInvalid(fields: string[]) {
    setFieldError("");
    setInvalidFields(fields);
  }
  function goToAuthorsStep() {
    const fields = getInvalidIdentificationFields(draft);
    if (fields.length > 0) return showInvalid(fields);
    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("authors");
  }
  function goToPublicationStep() {
    const fields = getInvalidAuthorFields(draft);
    if (fields.length > 0) return showInvalid(fields);
    if (hasDuplicateAuthors(draft)) {
      setFieldError("Autor duplicado!");
      setInvalidFields([]);
      return;
    }
    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("publication");
  }
  function goToMediaStep() {
    const fields = getInvalidPublicationFields(draft, derived);
    if (fields.length > 0) return showInvalid(fields);
    const startYear = Number(draft.originalPublicationStartYear);
    const endYear = Number(draft.originalPublicationEndYear);
    if (draft.originalPublicationEndYear && endYear < startYear) {
      setFieldError("O fim da publicação original não pode ser anterior ao início.");
      setInvalidFields(["originalPublicationEndYear"]);
      return;
    }
    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("media");
  }
  function openPublicationStep() {
    const fields = getInvalidIdentificationFields(draft);
    if (fields.length > 0) {
      showInvalid(fields);
      setCurrentStep("identification");
      return;
    }
    setCurrentStep("authors");
    goToPublicationStep();
  }
  function openMediaStep() {
    const identificationFields = getInvalidIdentificationFields(draft);
    if (identificationFields.length > 0) {
      showInvalid(identificationFields);
      setCurrentStep("identification");
      return;
    }
    const authorFields = getInvalidAuthorFields(draft);
    if (authorFields.length > 0 || hasDuplicateAuthors(draft)) {
      if (authorFields.length > 0) showInvalid(authorFields);
      else setFieldError("Autor duplicado!");
      setCurrentStep("authors");
      return;
    }
    goToMediaStep();
  }
  return { goToAuthorsStep, goToPublicationStep, goToMediaStep, openMediaStep, openPublicationStep };
}
