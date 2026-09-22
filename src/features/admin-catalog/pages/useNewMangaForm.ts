import {
  FormEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type RefObject,
  type SetStateAction,
} from "react";
import { useNavigate } from "react-router-dom";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import { workAdminPath } from "../domain/catalogPaths";
import { sortAuthorsByCredit } from "../domain/workOptions";
import {
  emptyNewMangaDraft,
  getRememberedNewMangaDraft,
  rememberNewMangaDraft,
  resetNewMangaDraftMemory,
} from "./newMangaMemory";
import {
  buildWorkPayload,
  draftFromWork,
  draftSignature,
  emptyOptions,
  filterOptionsByDependency,
  findOptionByLabels,
  getDefaultCountryAndType,
  getDefaultWorkTypeLabels,
  getInvalidAuthorFields,
  getInvalidIdentificationFields,
  getInvalidPublicationFields,
  hasDuplicateAuthors,
  moveValue,
  normalizeSearchText,
  toggleValue,
  validateCompleteForm,
} from "./newMangaLogic";
import type {
  AuthorField,
  NewMangaDraft,
  NewMangaMode,
  NewMangaStep,
  WorkDetailResponse,
  WorkFormOptions,
  WorkFormOptionsResponse,
} from "./newMangaTypes";

type SetDraft = Dispatch<SetStateAction<NewMangaDraft>>;

function withoutCurrentStep(value: typeof emptyNewMangaDraft): NewMangaDraft {
  const copy: Partial<typeof value> = { ...value };
  delete copy.currentStep;
  return copy as NewMangaDraft;
}

function useNewMangaOptions(
  mode: NewMangaMode,
  workId: string | undefined,
  setDraft: SetDraft,
  setCurrentStep: Dispatch<SetStateAction<NewMangaStep>>
) {
  const [options, setOptions] = useState<WorkFormOptions>(emptyOptions);
  const [allOptions, setAllOptions] = useState<WorkFormOptions>(emptyOptions);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const isEditMode = mode === "edit";

  useEffect(() => {
    let isMounted = true;
    async function loadOptions() {
      setLoadingOptions(true);
      setOptionsError("");
      try {
        const [optionsResponse, workResponse] = await Promise.all([
          api.get<WorkFormOptionsResponse>("/admin/works/form-options"),
          isEditMode && workId ? api.get<WorkDetailResponse>(`/admin/works/${workId}`) : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        const formOptions = optionsResponse.data.options;
        setAllOptions(formOptions);
        setOptions({ ...emptyOptions, genres: formOptions.genres });
        if (workResponse?.data.work) {
          setDraft(draftFromWork(workResponse.data.work));
          setCurrentStep("identification");
          return;
        }
        setDraft((current) => current.country
          ? current
          : { ...current, ...getDefaultCountryAndType(formOptions) });
      } catch (error) {
        if (isMounted) setOptionsError(getApiError(error, "Erro ao carregar listas de cadastro."));
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }
    loadOptions();
    return () => { isMounted = false; };
  }, [isEditMode, setCurrentStep, setDraft, workId]);

  return { allOptions, loadingOptions, options, optionsError, setOptions };
}

function availableOptions(allOptions: WorkFormOptions, country: string) {
  function relatedOrAll(values: WorkFormOptions[keyof WorkFormOptions]) {
    const related = filterOptionsByDependency(values, country);
    return related.length > 0 ? related : values;
  }
  return {
    authors: relatedOrAll(allOptions.authors),
    workTypes: relatedOrAll(allOptions.workTypes),
    genres: allOptions.genres,
    magazines: relatedOrAll(allOptions.magazines),
    originalPublishers: relatedOrAll(allOptions.originalPublishers),
  };
}

function useCountryOptions(
  allOptions: WorkFormOptions,
  country: string,
  setDraft: SetDraft,
  setOptions: Dispatch<SetStateAction<WorkFormOptions>>
) {
  useEffect(() => {
    if (!country) {
      setOptions((current) => ({ ...current, authors: [], workTypes: [], magazines: [], originalPublishers: [] }));
      setDraft((current) => ({ ...current, typeId: "", originalPublisherIds: [], magazineIds: [] }));
      return;
    }
    const hasOptions = allOptions.authors.length + allOptions.workTypes.length
      + allOptions.magazines.length + allOptions.originalPublishers.length > 0;
    if (!hasOptions) return;
    const nextOptions = availableOptions(allOptions, country);
    const defaultType = findOptionByLabels(nextOptions.workTypes, getDefaultWorkTypeLabels(country));
    setOptions(nextOptions);
    setDraft((current) => ({
      ...current,
      typeId: nextOptions.workTypes.some((type) => String(type.id) === current.typeId)
        ? current.typeId
        : defaultType ? String(defaultType.id) : "",
      authors: current.authors.map((author) => (
        author.authorId && !nextOptions.authors.some((candidate) => String(candidate.id) === author.authorId)
          ? { ...author, authorId: "" }
          : author
      )),
      magazineIds: current.magazineIds.filter((id) => nextOptions.magazines.some((option) => option.id === id)),
      originalPublisherIds: current.originalPublisherIds.filter(
        (id) => nextOptions.originalPublishers.some((option) => option.id === id)
      ),
    }));
  }, [allOptions, country, setDraft, setOptions]);
}

function getDerivedState(draft: NewMangaDraft, options: WorkFormOptions, allOptions: WorkFormOptions) {
  const workTypeName = options.workTypes.find((type) => String(type.id) === draft.typeId)?.label
    || allOptions.workTypes.find((type) => String(type.id) === draft.typeId)?.label;
  const normalizedType = workTypeName ? normalizeSearchText(workTypeName) : "";
  const isManga = workTypeName ? getDefaultWorkTypeLabels("").includes(normalizedType) : true;
  const directReleaseBlockedByWorkType = ["artbook", "databook"].includes(normalizedType);
  const effectiveDirectRelease = draft.directRelease || directReleaseBlockedByWorkType;
  const isOpenOriginalPublication = ["em andamento", "hiato"].some(
    (status) => normalizeSearchText(draft.originalPublicationStatus).includes(status)
  );
  const hasHentaiGenre = options.genres.some(
    (genre) => draft.genreIds.includes(Number(genre.id)) && normalizeSearchText(genre.label) === "hentai"
  );
  return {
    demographyDisabled: effectiveDirectRelease || Boolean(draft.typeId && !isManga),
    directReleaseBlockedByWorkType,
    effectiveDirectRelease,
    hasHentaiGenre,
    isOpenOriginalPublication,
  };
}

type DerivedState = ReturnType<typeof getDerivedState>;

function useDerivedRules(
  derived: DerivedState,
  setDraft: SetDraft,
  setInvalidFields: Dispatch<SetStateAction<string[]>>
) {
  useEffect(() => {
    if (!derived.demographyDisabled) return;
    setDraft((current) => ({ ...current, demographies: [] }));
    setInvalidFields((current) => current.filter((field) => field !== "demographies"));
  }, [derived.demographyDisabled, setDraft, setInvalidFields]);
  useEffect(() => {
    if (derived.hasHentaiGenre) setDraft((current) => ({ ...current, adultContent: true }));
  }, [derived.hasHentaiGenre, setDraft]);
  useEffect(() => {
    if (derived.directReleaseBlockedByWorkType) {
      setDraft((current) => ({ ...current, directRelease: true }));
    }
  }, [derived.directReleaseBlockedByWorkType, setDraft]);
  useEffect(() => {
    if (!derived.isOpenOriginalPublication) return;
    setDraft((current) => ({ ...current, originalPublicationEndYear: "" }));
    setInvalidFields((current) => current.filter(
      (field) => !["originalPublicationEndYear"].includes(field)
    ));
  }, [derived.isOpenOriginalPublication, setDraft, setInvalidFields]);
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
      if (currentStep === "publication" && !saving && !optionsError) formRef.current?.requestSubmit();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentStep, formRef, optionsError, saving]);
}

function createStepActions(
  draft: NewMangaDraft,
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
  return { goToAuthorsStep, goToPublicationStep, openPublicationStep };
}

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
      return;
    }
    const response = await api.post<WorkDetailResponse>("/admin/works", payload);
    toast.success("Obra cadastrada com sucesso.");
    resetNewMangaDraftMemory();
    settings.setBaselineSignature(signature);
    const createdWork = response.data.work;
    const workPath = workAdminPath(createdWork.slug);
    navigate("/admin/pos-cadastro", { state: {
      title: "Obra cadastrada com sucesso!",
      description: "Escolha o próximo passo para continuar o cadastro do catálogo.",
      actions: [
        { label: "Gerenciar esta Obra", to: workPath, state: { workId: createdWork.id } },
        { label: "Cadastrar nova Obra", to: "/admin/novo-manga" },
        { label: "Cadastrar Edição para esta Obra", to: `${workPath}/edicoes/nova`, state: { workId: createdWork.id } },
      ],
    } });
  }
  return async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (settings.currentStep === "identification") return settings.stepActions.goToAuthorsStep();
    if (settings.currentStep === "authors") return settings.stepActions.goToPublicationStep();
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
  const stepActions = createStepActions(draft, setFieldError, setInvalidFields, setCurrentStep);
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
    handleFormKeyDown,
    handleSubmit,
    hasUnsavedChanges: Boolean(baselineSignature) && signature !== baselineSignature && !saving,
    isInvalidField: (field: string) => invalidFields.includes(field),
    moveAuthor: (from: number, to: number) => updateDraft("authors", moveValue(draft.authors, from, to)),
    moveNumberValues: (field: "magazineIds" | "originalPublisherIds", from: number, to: number) => {
      updateDraft(field, moveValue(draft[field], from, to));
    },
    openPublicationStep: stepActions.openPublicationStep,
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
