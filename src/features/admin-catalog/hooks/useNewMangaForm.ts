import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { sortAuthorsByCredit } from '../domain/workOptions';
import { emptyNewMangaDraft, getRememberedNewMangaDraft, resetNewMangaDraftMemory } from '../pages/newMangaMemory';
import { draftSignature, moveValue, toggleValue } from '../pages/newMangaLogic';
import type { AuthorField, NewMangaDraft, NewMangaMode, NewMangaStep } from '../pages/newMangaTypes';

import { useNewMangaOptions, useCountryOptions, getDerivedState, useDerivedRules } from './newMangaOptions';
import { withoutCurrentStep, useDraftLifecycle, useDocumentSubmitShortcut, createStepActions } from './newMangaDraft';
import { createSubmissionHandler } from './newMangaSubmission';

export function useNewMangaForm(mode: NewMangaMode, workId?: string) {
  const navigate = useNavigate();
  const initial = useMemo(
    () => mode === "edit" ? structuredClone(emptyNewMangaDraft) : getRememberedNewMangaDraft(),
    [mode]
  );
  const [draft, setDraft] = useState<NewMangaDraft>(() => {
    return withoutCurrentStep(initial);
  });
  const [currentStep, setCurrentStep] = useState<NewMangaStep>(initial.currentStep);
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [fieldError, setFieldError] = useState("");
  const [saving, setSaving] = useState(false);
  const [baselineSignature, setBaselineSignature] = useState("");
  const formRef = useRef<HTMLFormElement>(null);
  const optionState = useNewMangaOptions(mode, workId, setDraft, setCurrentStep);
  const derived = getDerivedState(draft, optionState.options, optionState.allOptions);
  const signature = useMemo(
    () => draftSignature(draft, derived.effectiveDirectRelease),
    [derived.effectiveDirectRelease, draft]
  );

  useCountryOptions(optionState.allOptions, draft.country, setDraft, optionState.setOptions);
  useDerivedRules(derived, setDraft, setInvalidFields);
  useDraftLifecycle(
    mode,
    draft,
    currentStep,
    derived.effectiveDirectRelease,
    signature,
    optionState.loadingOptions,
    baselineSignature,
    setBaselineSignature
  );
  useDocumentSubmitShortcut(currentStep, saving, optionState.optionsError, formRef);
  useEffect(() => { if (optionState.optionsError) toast.error(optionState.optionsError); }, [optionState.optionsError]);
  useEffect(() => { if (fieldError) toast.error(fieldError); }, [fieldError]);

  const updateDraft = useCallback(<K extends keyof NewMangaDraft>(field: K, value: NewMangaDraft[K]) => {
    setDraft((current) => ({ ...current, [field]: value }));
  }, []);
  const clearInvalidFields = useCallback((fields: string[]) => {
    setInvalidFields((current) => current.filter((field) => !fields.includes(field)));
  }, []);
  const clearInvalidField = useCallback((field: string) => clearInvalidFields([field]), [clearInvalidFields]);
  const stepActions = createStepActions(draft, derived, setFieldError, setInvalidFields, setCurrentStep);
  const handleSubmit = createSubmissionHandler({
    currentStep,
    derived,
    draft,
    mode,
    navigate,
    setBaselineSignature,
    setFieldError,
    setInvalidFields,
    setSaving,
    signature,
    stepActions,
    workId,
  });

  function resetForm() {
    const emptyDraft = withoutCurrentStep(structuredClone(emptyNewMangaDraft));
    setDraft(emptyDraft);
    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("identification");
    resetNewMangaDraftMemory();
    setBaselineSignature(draftSignature(emptyDraft, false));
  }

  function updateAuthor(index: number, field: keyof AuthorField, value: string) {
    updateDraft("authors", draft.authors.map((author, authorIndex) => (
      authorIndex === index ? { ...author, [field]: value } : author
    )));
  }
  function toggleAuthorRole(index: number, role: string) {
    const updatedAuthor = { ...draft.authors[index], roles: toggleValue(draft.authors[index].roles, role) };
    const authors = draft.authors.map((author, authorIndex) => authorIndex === index ? updatedAuthor : author);
    const sortedAuthors = sortAuthorsByCredit(authors, optionState.options.authors);
    updateDraft("authors", sortedAuthors);
    return sortedAuthors.indexOf(updatedAuthor) !== index;
  }
  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return;
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) return;
    if (target.dataset.comangaDropdownSearch === "true") return;
    event.preventDefault();
    target.blur();
  }

  return {
    ...optionState,
    ...derived,
    clearInvalidField,
    clearInvalidFields,
    currentStep,
    draft,
    formRef,
    goToAuthorsStep: stepActions.goToAuthorsStep,
    goToPublicationStep: stepActions.goToPublicationStep,
    goToMediaStep: stepActions.goToMediaStep,
    handleFormKeyDown,
    handleSubmit,
    hasUnsavedChanges: Boolean(baselineSignature) && signature !== baselineSignature && !saving,
    isInvalidField: (field: string) => invalidFields.includes(field),
    moveAuthor: (from: number, to: number) => updateDraft("authors", moveValue(draft.authors, from, to)),
    moveNumberValues: (field: "magazineIds" | "originalPublisherIds", from: number, to: number) => {
      updateDraft(field, moveValue(draft[field], from, to));
    },
    openPublicationStep: stepActions.openPublicationStep,
    openMediaStep: stepActions.openMediaStep,
    removeAuthor: (index: number) => updateDraft("authors", draft.authors.length === 1
      ? draft.authors
      : draft.authors.filter((_, authorIndex) => authorIndex !== index)),
    resetForm,
    saving,
    setCurrentStep,
    toggleAuthorRole,
    toggleNumberValue: (field: "genreIds" | "magazineIds" | "originalPublisherIds", value: number) => {
      updateDraft(field, toggleValue(draft[field], value));
    },
    toggleStringValue: (field: "demographies", value: string) => updateDraft(field, toggleValue(draft[field], value)),
    updateAuthor,
    updateDraft,
  };
}

export type NewMangaController = ReturnType<typeof useNewMangaForm>;
