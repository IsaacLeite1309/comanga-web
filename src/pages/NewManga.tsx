import { FormEvent, KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/services/api";
import { UnsavedChangesPrompt } from "@/hooks/useUnsavedChangesWarning";
import { MultiSelect as MultiSelectDropdown } from "@/components/forms/MultiSelect";
import { InputField, SelectField, ToggleField, YearSelectField } from "@/components/forms/FormFields";
import { getApiError } from "@/lib/apiError";
import { workAdminPath } from "@/lib/catalogPaths";
import { CoverImportField } from "@/features/admin-media";
import {
  NATIVE_AUTHOR_ROLE_OPTIONS,
  NATIVE_COUNTRY_OPTIONS,
  NATIVE_DEMOGRAPHY_OPTIONS,
  NATIVE_ORIGINAL_STATUS_OPTIONS,
} from "@/features/admin-catalog/domain/workOptions";
import {
  emptyNewMangaDraft,
  getRememberedNewMangaDraft,
  rememberNewMangaDraft,
  resetNewMangaDraftMemory,
} from "./newMangaMemory";

interface OptionValue {
  id: number | string;
  label: string;
  value?: string;
  depends_on?: Array<{
    id: number;
    label: string;
    category: {
      slug: string;
      name: string;
    };
  }>;
}

interface WorkFormOptionsResponse {
  options: {
    authors: OptionValue[];
    workTypes: OptionValue[];
    genres: OptionValue[];
    magazines: OptionValue[];
    originalPublishers: OptionValue[];
  };
}

interface WorkDetailResponse {
  work: {
    id: number;
    slug: string;
    title: string;
    originalTitle?: string | null;
    coverAssetId?: string | null;
    coverUrl?: string | null;
    country?: string | null;
    type?: OptionValue | null;
    adultContent: boolean;
    originalPublicationStartYear?: number | null;
    originalPublicationEndYear?: number | null;
    originalVolumeCount?: number | null;
    directRelease: boolean;
    originalPublishers: OptionValue[];
    originalPublicationStatus?: string | null;
    authors: Array<{
      author: OptionValue | null;
      roles: string[];
    }>;
    genres: OptionValue[];
    demographics: string[];
    serializationMagazines: OptionValue[];
  };
}

export interface AuthorField {
  authorId: string;
  roles: string[];
}

type NewMangaStep = "identification" | "authors" | "publication";
type NewMangaProps = {
  mode?: "create" | "edit";
  workId?: string;
  returnPath?: string;
};

const emptyOptions = {
  authors: [] as OptionValue[],
  workTypes: [] as OptionValue[],
  genres: [] as OptionValue[],
  magazines: [] as OptionValue[],
  originalPublishers: [] as OptionValue[],
};


function normalizeSearchText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}


function findOptionByLabels(options: OptionValue[], labels: string[]) {
  const normalizedLabels = labels.map(normalizeSearchText);

  return options.find((option) => normalizedLabels.includes(normalizeSearchText(option.label)));
}

function getOptionValue(option: OptionValue) {
  return option.value ?? String(option.id);
}

function buildOrderedPayload(ids: number[]) {
  return ids.map((id, position) => ({ id, position }));
}

function filterOptionsByDependency(options: OptionValue[], dependencyLabel: string) {
  if (!dependencyLabel) return [];

  const hasDependencies = options.some((option) => option.depends_on && option.depends_on.length > 0);

  if (!hasDependencies) return options;

  const normalizedDependencyLabel = normalizeSearchText(dependencyLabel);

  return options.filter((option) => (
    option.depends_on?.some((dependency) => normalizeSearchText(dependency.label) === normalizedDependencyLabel)
  ));
}

function getDefaultWorkTypeLabels(countryName = "") {
  const normalizedCountry = normalizeSearchText(countryName);

  if (normalizedCountry.includes("coreia")) return ["manhwa"];
  if (normalizedCountry.includes("china") || normalizedCountry.includes("taiwan")) return ["manhua"];

  return ["manga", "mangá"];
}

const NewManga = ({ mode = "create", workId, returnPath = "/admin/editar-mangas" }: NewMangaProps) => {
  const navigate = useNavigate();
  const isEditMode = mode === "edit";
  const rememberedDraft = useMemo(
    () => (isEditMode ? structuredClone(emptyNewMangaDraft) : getRememberedNewMangaDraft()),
    [isEditMode]
  );
  const [options, setOptions] = useState(emptyOptions);
  const [allAuthors, setAllAuthors] = useState<OptionValue[]>([]);
  const [allWorkTypes, setAllWorkTypes] = useState<OptionValue[]>([]);
  const [allMagazines, setAllMagazines] = useState<OptionValue[]>([]);
  const [allOriginalPublishers, setAllOriginalPublishers] = useState<OptionValue[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState("");
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState(rememberedDraft.title);
  const [originalTitle, setOriginalTitle] = useState(rememberedDraft.originalTitle);
  const [originalPublicationStartYear, setOriginalPublicationStartYear] = useState(rememberedDraft.originalPublicationStartYear);
  const [originalPublicationEndYear, setOriginalPublicationEndYear] = useState(rememberedDraft.originalPublicationEndYear);
  const [originalVolumeCount, setOriginalVolumeCount] = useState(rememberedDraft.originalVolumeCount);
  const [coverAssetId, setCoverAssetId] = useState(rememberedDraft.coverAssetId);
  const [coverUrl, setCoverUrl] = useState(rememberedDraft.coverUrl);
  const [coverPending, setCoverPending] = useState(rememberedDraft.coverPending);
  const [typeId, setTypeId] = useState(rememberedDraft.typeId);
  const [country, setCountry] = useState(rememberedDraft.country);
  const [originalPublisherIds, setOriginalPublisherIds] = useState<number[]>(rememberedDraft.originalPublisherIds);
  const [originalPublicationStatus, setOriginalPublicationStatus] = useState(rememberedDraft.originalPublicationStatus);
  const [adultContent, setAdultContent] = useState(rememberedDraft.adultContent);
  const [directRelease, setDirectRelease] = useState(rememberedDraft.directRelease);
  const [authors, setAuthors] = useState<AuthorField[]>(rememberedDraft.authors);
  const [genreIds, setGenreIds] = useState<number[]>(rememberedDraft.genreIds);
  const [demographies, setDemographies] = useState<string[]>(rememberedDraft.demographies);
  const [magazineIds, setMagazineIds] = useState<number[]>(rememberedDraft.magazineIds);
  const [fieldError, setFieldError] = useState("");
  const [invalidFields, setInvalidFields] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState<NewMangaStep>(rememberedDraft.currentStep);
  const [baselineSignature, setBaselineSignature] = useState("");
  const formRef = useRef<HTMLFormElement>(null);

  const selectedCountryName = country;
  const selectedWorkTypeName = useMemo(
    () => options.workTypes.find((type) => String(type.id) === typeId)?.label
      || allWorkTypes.find((type) => String(type.id) === typeId)?.label,
    [allWorkTypes, options.workTypes, typeId]
  );
  const isMangaWorkType = selectedWorkTypeName
    ? getDefaultWorkTypeLabels("").includes(normalizeSearchText(selectedWorkTypeName))
    : true;
  const directReleaseBlockedByWorkType = selectedWorkTypeName
    ? ["artbook", "databook"].includes(normalizeSearchText(selectedWorkTypeName))
    : false;
  const effectiveDirectRelease = directRelease || directReleaseBlockedByWorkType;
  const demographyDisabled = effectiveDirectRelease || Boolean(typeId && !isMangaWorkType);
  const selectedOriginalStatusName = originalPublicationStatus;
  const isOpenOriginalPublication = selectedOriginalStatusName
    ? ["em andamento", "hiato"].some((status) => normalizeSearchText(selectedOriginalStatusName).includes(status))
    : false;
  const selectedGenreNames = useMemo(
    () => options.genres
      .filter((genre) => genreIds.includes(genre.id))
      .map((genre) => genre.label),
    [genreIds, options.genres]
  );
  const hasHentaiGenre = selectedGenreNames.some((genre) => normalizeSearchText(genre) === "hentai");
  const currentDraftSignature = useMemo(() => JSON.stringify({
    title,
    originalTitle,
    originalPublicationStartYear,
    originalPublicationEndYear,
    originalVolumeCount,
    coverAssetId,
    coverUrl,
    coverPending,
    typeId,
    country,
    originalPublisherIds,
    originalPublicationStatus,
    adultContent,
    directRelease: effectiveDirectRelease,
    authors,
    genreIds,
    demographies,
    magazineIds,
  }), [
    adultContent,
    authors,
    country,
    coverAssetId,
    coverPending,
    coverUrl,
    demographies,
    effectiveDirectRelease,
    genreIds,
    magazineIds,
    originalPublicationEndYear,
    originalPublicationStartYear,
    originalPublicationStatus,
    originalPublisherIds,
    originalTitle,
    originalVolumeCount,
    title,
    typeId,
  ]);

  const hasUnsavedChanges = Boolean(baselineSignature) && currentDraftSignature !== baselineSignature && !saving;

  useEffect(() => {
    if (!loadingOptions && !baselineSignature) {
      setBaselineSignature(currentDraftSignature);
    }
  }, [baselineSignature, currentDraftSignature, loadingOptions]);

  useEffect(() => {
    let isMounted = true;

    async function loadBaseOptions() {
      setLoadingOptions(true);
      setOptionsError("");

      try {
        const [optionsResponse, workResponse] = await Promise.all([
          api.get<WorkFormOptionsResponse>("/admin/works/form-options"),
          isEditMode && workId ? api.get<WorkDetailResponse>(`/admin/works/${workId}`) : Promise.resolve(null),
        ]);
        const formOptions = optionsResponse.data.options;

        if (!isMounted) return;

        setAllAuthors(formOptions.authors);
        setAllWorkTypes(formOptions.workTypes);
        setAllMagazines(formOptions.magazines);
        setAllOriginalPublishers(formOptions.originalPublishers);
        setOptions({
          authors: [],
          workTypes: [],
          genres: formOptions.genres,
          magazines: [],
          originalPublishers: [],
        });

        if (workResponse?.data.work) {
          const work = workResponse.data.work;

          setTitle(work.title || "");
          setOriginalTitle(work.originalTitle || "");
          setOriginalPublicationStartYear(work.originalPublicationStartYear ? String(work.originalPublicationStartYear) : "");
          setOriginalPublicationEndYear(work.originalPublicationEndYear ? String(work.originalPublicationEndYear) : "");
          setOriginalVolumeCount(work.originalVolumeCount ? String(work.originalVolumeCount) : "");
          setCoverAssetId(work.coverAssetId || "");
          setCoverUrl(work.coverUrl || "");
          setCoverPending(false);
          setTypeId(work.type?.id ? String(work.type.id) : "");
          setCountry(work.country || "");
          setOriginalPublisherIds(work.originalPublishers.map((publisher) => Number(publisher.id)));
          setOriginalPublicationStatus(work.originalPublicationStatus || "");
          setAdultContent(work.adultContent);
          setDirectRelease(work.directRelease);
          setAuthors(work.authors.length > 0
            ? work.authors.map((author) => ({
                authorId: author.author?.id ? String(author.author.id) : "",
                roles: author.roles,
              }))
            : [{ authorId: "", roles: [] }]
          );
          setGenreIds(work.genres.map((genre) => Number(genre.id)));
          setDemographies(work.demographics);
          setMagazineIds(work.serializationMagazines.map((magazine) => Number(magazine.id)));
          setCurrentStep("identification");
          return;
        }

        setCountry((currentCountry) => {
          if (currentCountry) return currentCountry;

          const japan = NATIVE_COUNTRY_OPTIONS.find((option) => option.value === "Japão");
          const relatedCountryWorkTypes = japan
            ? filterOptionsByDependency(formOptions.workTypes, getOptionValue(japan))
            : [];
          const countryWorkTypes = relatedCountryWorkTypes.length > 0
            ? relatedCountryWorkTypes
            : formOptions.workTypes;
          const defaultType = findOptionByLabels(countryWorkTypes, getDefaultWorkTypeLabels(japan?.label));

          if (defaultType) setTypeId(String(defaultType.id));
          return japan ? getOptionValue(japan) : currentCountry;
        });
      } catch (error) {
        if (!isMounted) return;
        setOptionsError(getApiError(error, "Erro ao carregar listas de cadastro."));
      } finally {
        if (isMounted) setLoadingOptions(false);
      }
    }

    loadBaseOptions();

    return () => {
      isMounted = false;
    };
  }, [isEditMode, workId]);

  useEffect(() => {
    if (optionsError) {
      toast.error(optionsError);
    }
  }, [optionsError]);

  useEffect(() => {
    if (fieldError) {
      toast.error(fieldError);
    }
  }, [fieldError]);

  useEffect(() => {
    if (!country) {
      setTypeId("");
      setOriginalPublisherIds([]);
      setMagazineIds([]);
      setOptions((current) => ({
        ...current,
        authors: [],
        workTypes: [],
        magazines: [],
        originalPublishers: [],
      }));
      return;
    }

    if (allAuthors.length === 0 && allWorkTypes.length === 0 && allMagazines.length === 0 && allOriginalPublishers.length === 0) {
      return;
    }

    const relatedAuthors = filterOptionsByDependency(allAuthors, country);
    const authors = relatedAuthors.length > 0 ? relatedAuthors : allAuthors;
    const relatedWorkTypes = filterOptionsByDependency(allWorkTypes, country);
    const workTypes = relatedWorkTypes.length > 0 ? relatedWorkTypes : allWorkTypes;
    const relatedMagazines = filterOptionsByDependency(allMagazines, country);
    const relatedOriginalPublishers = filterOptionsByDependency(allOriginalPublishers, country);
    const magazines = relatedMagazines.length > 0 ? relatedMagazines : allMagazines;
    const originalPublishers = relatedOriginalPublishers.length > 0
      ? relatedOriginalPublishers
      : allOriginalPublishers;
    const defaultType = findOptionByLabels(workTypes, getDefaultWorkTypeLabels(selectedCountryName));

    setOptions((current) => ({
      ...current,
      authors,
      workTypes,
      magazines,
      originalPublishers,
    }));
    setTypeId((currentTypeId) => (
      workTypes.some((type) => String(type.id) === currentTypeId)
        ? currentTypeId
        : defaultType ? String(defaultType.id) : ""
    ));
    setAuthors((currentAuthors) => (
      currentAuthors.map((author) => (
        author.authorId && !authors.some((candidate) => String(candidate.id) === author.authorId)
          ? { ...author, authorId: "" }
          : author
      ))
    ));
    setMagazineIds((currentMagazineIds) => (
      currentMagazineIds.filter((magazineId) => magazines.some((magazine) => magazine.id === magazineId))
    ));
    setOriginalPublisherIds((currentOriginalPublisherIds) => (
      currentOriginalPublisherIds.filter((publisherId) => originalPublishers.some((publisher) => publisher.id === publisherId))
    ));
  }, [allAuthors, allMagazines, allOriginalPublishers, allWorkTypes, country, selectedCountryName]);

  useEffect(() => {
    if (demographyDisabled) {
      setDemographies([]);
      setInvalidFields((current) => current.filter((fieldName) => fieldName !== "demographies"));
    }
  }, [demographyDisabled]);

  useEffect(() => {
    if (hasHentaiGenre) {
      setAdultContent(true);
    }
  }, [hasHentaiGenre]);

  useEffect(() => {
    if (directReleaseBlockedByWorkType) {
      setDirectRelease(true);
    }
  }, [directReleaseBlockedByWorkType]);

  useEffect(() => {
    if (isOpenOriginalPublication) {
      setOriginalPublicationEndYear("");
      setOriginalVolumeCount("");
      setInvalidFields((current) => (
        current.filter((fieldName) => !["originalPublicationEndYear", "originalVolumeCount"].includes(fieldName))
      ));
    }
  }, [isOpenOriginalPublication]);

  useEffect(() => {
    if (isEditMode) return;

    rememberNewMangaDraft({
      currentStep,
      title,
      originalTitle,
      originalPublicationStartYear,
      originalPublicationEndYear,
      originalVolumeCount,
      coverAssetId,
      coverUrl,
      coverPending,
      typeId,
      country,
      originalPublisherIds,
      originalPublicationStatus,
      adultContent,
      directRelease: effectiveDirectRelease,
      authors,
      genreIds,
      demographies,
      magazineIds,
    });
  }, [
    adultContent,
    authors,
    country,
    coverAssetId,
    coverPending,
    coverUrl,
    currentStep,
    demographies,
    effectiveDirectRelease,
    genreIds,
    magazineIds,
    originalPublicationEndYear,
    originalPublicationStartYear,
    originalPublicationStatus,
    originalPublisherIds,
    originalTitle,
    originalVolumeCount,
    title,
    typeId,
    isEditMode,
  ]);

  useEffect(() => {
    function handleDocumentKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key !== "Enter" || event.defaultPrevented) return;

      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLInputElement
        || activeElement instanceof HTMLTextAreaElement
        || activeElement instanceof HTMLSelectElement
        || activeElement instanceof HTMLButtonElement
      ) {
        return;
      }

      if (currentStep === "publication" && !saving && !optionsError) {
        formRef.current?.requestSubmit();
      }
    }

    window.addEventListener("keydown", handleDocumentKeyDown);
    return () => window.removeEventListener("keydown", handleDocumentKeyDown);
  }, [currentStep, optionsError, saving]);

  function toggleSelectedValue<T extends number | string>(
    valueId: T,
    selectedValues: T[],
    setSelectedValues: (values: T[]) => void
  ) {
    setSelectedValues(
      selectedValues.includes(valueId)
        ? selectedValues.filter((id) => id !== valueId)
        : [...selectedValues, valueId]
    );
  }

  function moveSelectedValue<T>(
    selectedValues: T[],
    setSelectedValues: (values: T[]) => void,
    fromIndex: number,
    toIndex: number
  ) {
    if (toIndex < 0 || toIndex >= selectedValues.length) return;

    const nextValues = [...selectedValues];
    const [movedValue] = nextValues.splice(fromIndex, 1);
    nextValues.splice(toIndex, 0, movedValue);
    setSelectedValues(nextValues);
  }

  function updateAuthor(index: number, field: keyof AuthorField, value: string) {
    setAuthors((current) => current.map((author, authorIndex) => (
      authorIndex === index ? { ...author, [field]: value } : author
    )));
  }

  function toggleAuthorRole(index: number, role: string) {
    setAuthors((current) => current.map((author, authorIndex) => {
      if (authorIndex !== index) return author;

      return {
        ...author,
        roles: author.roles.includes(role)
          ? author.roles.filter((currentRole) => currentRole !== role)
          : [...author.roles, role],
      };
    }));
  }

  function addAuthor() {
    setAuthors((current) => [...current, { authorId: "", roles: [] }]);
  }

  function removeAuthor(index: number) {
    setAuthors((current) => (
      current.length === 1
        ? current
        : current.filter((_, authorIndex) => authorIndex !== index)
    ));
  }

  function resetForm() {
    setTitle("");
    setOriginalTitle("");
    setOriginalPublicationStartYear("");
    setOriginalPublicationEndYear("");
    setOriginalVolumeCount("");
    setCoverAssetId("");
    setCoverUrl("");
    setCoverPending(false);
    setTypeId("");
    setCountry("");
    setOriginalPublisherIds([]);
    setOriginalPublicationStatus("");
    setAdultContent(false);
    setDirectRelease(false);
    setAuthors([{ authorId: "", roles: [] }]);
    setGenreIds([]);
    setDemographies([]);
    setMagazineIds([]);
    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("identification");
    resetNewMangaDraftMemory();
    setBaselineSignature(JSON.stringify({
      title: "",
      originalTitle: "",
      originalPublicationStartYear: "",
      originalPublicationEndYear: "",
      originalVolumeCount: "",
      coverAssetId: "",
      coverUrl: "",
      coverPending: false,
      typeId: "",
      country: "",
      originalPublisherIds: [],
      originalPublicationStatus: "",
      adultContent: false,
      directRelease: false,
      authors: [{ authorId: "", roles: [] }],
      genreIds: [],
      demographies: [],
      magazineIds: [],
    }));
  }

  function isInvalidField(fieldName: string) {
    return invalidFields.includes(fieldName);
  }

  function getFieldErrorMessage(fieldName: string) {
    if (!isInvalidField(fieldName)) return "";

    if (fieldName === "originalVolumeCount" && originalVolumeCount && Number(originalVolumeCount) <= 0) {
      return "Informe um número maior que zero.";
    }

    return "Preencha o campo obrigatório.";
  }

  function clearInvalidFields(fieldNames: string[]) {
    setInvalidFields((current) => current.filter((fieldName) => !fieldNames.includes(fieldName)));
  }

  function clearInvalidField(fieldName: string) {
    clearInvalidFields([fieldName]);
  }

  function getInvalidIdentificationFields() {
    const fields: string[] = [];

    if (!title.trim()) fields.push("title");
    if (!originalTitle.trim()) fields.push("originalTitle");
    if (!country) fields.push("country");
    if (!typeId) fields.push("typeId");
    if (!coverAssetId) fields.push("coverAssetId");

    return [...new Set(fields)];
  }

  function getInvalidAuthorFields() {
    return authors.flatMap((author, index) => {
      const fields: string[] = [];

      if (!author.authorId) fields.push(`authors.${index}.authorId`);
      if (author.roles.length === 0) fields.push(`authors.${index}.roles`);

      return fields;
    });
  }

  function getInvalidPublicationFields() {
    const fields: string[] = [];

    if (originalPublisherIds.length === 0) fields.push("originalPublisherIds");
    if (!originalPublicationStatus) fields.push("originalPublicationStatus");
    if (!originalPublicationStartYear) fields.push("originalPublicationStartYear");
    if (!isOpenOriginalPublication && !originalPublicationEndYear) fields.push("originalPublicationEndYear");
    if (!isOpenOriginalPublication && (!originalVolumeCount || Number(originalVolumeCount) <= 0)) fields.push("originalVolumeCount");
    if (genreIds.length === 0) fields.push("genreIds");
    if (!demographyDisabled && demographies.length === 0) fields.push("demographies");
    if (!effectiveDirectRelease && magazineIds.length === 0) fields.push("magazineIds");

    return fields;
  }

  function validateIdentificationStep() {
    if (
      !title.trim()
      || !originalTitle.trim()
      || !country
      || !typeId
      || !coverAssetId
    ) {
      return "Preencha os campos obrigatórios da etapa de Identificação.";
    }

    return "";
  }

  function validateAuthorsStep() {
    if (authors.some((author) => !author.authorId || author.roles.length === 0)) {
      return "Preencha os autores e seus papéis.";
    }

    const authorIds = authors.map((author) => author.authorId);
    if (new Set(authorIds).size !== authorIds.length) {
      return "Autor duplicado!";
    }

    return "";
  }

  function showStepValidationError(fields: string[]) {
    setFieldError("");
    setInvalidFields(fields);
  }

  function goToAuthorsStep() {
    const invalidStepFields = getInvalidIdentificationFields();
    const validationError = validateIdentificationStep();

    if (validationError) {
      showStepValidationError(invalidStepFields);
      return;
    }

    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("authors");
  }

  function goToPublicationStep() {
    const invalidStepFields = getInvalidAuthorFields();
    const validationError = validateAuthorsStep();

    if (validationError) {
      if (validationError === "Autor duplicado!") {
        setFieldError(validationError);
        setInvalidFields([]);
        return;
      }

      showStepValidationError(invalidStepFields);
      return;
    }

    setFieldError("");
    setInvalidFields([]);
    setCurrentStep("publication");
  }

  function showFormValidationError(validationError: string) {
    if (validationError === "Autor duplicado!") {
      setFieldError(validationError);
      setInvalidFields([]);
      return;
    }

    const nextInvalidFields = [
      ...getInvalidIdentificationFields(),
      ...getInvalidAuthorFields(),
      ...getInvalidPublicationFields(),
    ];

    if (nextInvalidFields.length === 0) {
      setFieldError(validationError);
      setInvalidFields([]);
      return;
    }

    setFieldError("");
    setInvalidFields(nextInvalidFields);
  }

  function validateForm() {
    const hasMissingBaseFields = !title.trim()
      || !originalTitle.trim()
      || !typeId
      || !country
      || originalPublisherIds.length === 0
      || !originalPublicationStatus
      || !originalPublicationStartYear
      || !coverAssetId
      || authors.some((author) => !author.authorId || author.roles.length === 0)
      || genreIds.length === 0
      || (!demographyDisabled && demographies.length === 0)
      || (!effectiveDirectRelease && magazineIds.length === 0)
      || (!isOpenOriginalPublication && (!originalPublicationEndYear || !originalVolumeCount || Number(originalVolumeCount) <= 0));

    if (hasMissingBaseFields) {
      return "Preencha os campos obrigatórios da Obra.";
    }

    const authorIds = authors.map((author) => author.authorId);
    if (new Set(authorIds).size !== authorIds.length) {
      return "Autor duplicado!";
    }

    if (
      originalPublicationStartYear
      && originalPublicationEndYear
      && Number(originalPublicationEndYear) < Number(originalPublicationStartYear)
    ) {
      return "O fim da publicação original não pode ser anterior ao início.";
    }

    return "";
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (currentStep === "identification") {
      goToAuthorsStep();
      return;
    }

    if (currentStep === "authors") {
      goToPublicationStep();
      return;
    }

    const validationError = validateForm();

    if (validationError) {
      showFormValidationError(validationError);
      return;
    }

    setFieldError("");
    setSaving(true);

    try {
      const payload = {
        title: title.trim(),
        originalTitle: originalTitle.trim() || null,
        originalPublicationStartYear: originalPublicationStartYear ? Number(originalPublicationStartYear) : null,
        originalPublicationEndYear: !isOpenOriginalPublication && originalPublicationEndYear ? Number(originalPublicationEndYear) : null,
        originalVolumeCount: !isOpenOriginalPublication && originalVolumeCount ? Number(originalVolumeCount) : null,
        coverAssetId: coverAssetId || null,
        typeId: Number(typeId),
        country,
        originalPublisherIds: buildOrderedPayload(originalPublisherIds),
        originalPublicationStatus,
        adultContent,
        directRelease: effectiveDirectRelease,
        authors: authors.map((author) => ({
          authorId: Number(author.authorId),
          roles: author.roles,
        })),
        genreIds,
        demographies: demographyDisabled ? [] : demographies,
        magazineIds: effectiveDirectRelease ? [] : buildOrderedPayload(magazineIds),
      };

      if (isEditMode && workId) {
        await api.patch(`/admin/works/${workId}`, payload);
        toast.success("Obra atualizada com sucesso.");
        setBaselineSignature(currentDraftSignature);
        return;
      }

      const response = await api.post<WorkDetailResponse>("/admin/works", payload);

      toast.success("Obra cadastrada com sucesso.");
      resetNewMangaDraftMemory();
      setBaselineSignature(currentDraftSignature);

      const createdWork = response.data.work;
      const workPath = workAdminPath(createdWork.slug);

      navigate("/admin/pos-cadastro", {
        state: {
          title: "Obra cadastrada com sucesso!",
          description: "Escolha o próximo passo para continuar o cadastro do catálogo.",
          actions: [
            {
              label: "Gerenciar esta Obra",
              to: workPath,
              state: { workId: createdWork.id },
            },
            {
              label: "Cadastrar nova Obra",
              to: "/admin/novo-manga",
            },
            {
              label: "Cadastrar Edição para esta Obra",
              to: `${workPath}/edicoes/nova`,
              state: { workId: createdWork.id },
            },
          ],
        },
      });
    } catch (error) {
      toast.error(getApiError(error, isEditMode ? "Erro ao atualizar Obra." : "Erro ao cadastrar Obra."));
    } finally {
      setSaving(false);
    }
  }

  function handleFormKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter") return;

    const target = event.target;
    if (
      target instanceof HTMLInputElement
      || target instanceof HTMLTextAreaElement
      || target instanceof HTMLSelectElement
    ) {
      if (target.dataset.comangaDropdownSearch === "true") return;

      event.preventDefault();
      target.blur();
    }
  }

  if (loadingOptions) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        {isEditMode ? "Carregando dados da Obra..." : "Carregando formulário..."}
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <UnsavedChangesPrompt when={hasUnsavedChanges} continueLabel={isEditMode ? "Continuar editando" : "Continuar cadastrando"} />
      <form ref={formRef} onSubmit={handleSubmit} onKeyDownCapture={handleFormKeyDown} className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          {isEditMode ? (
            <button
              type="button"
              onClick={() => navigate(returnPath, { state: { workId: workId ? Number(workId) : undefined } })}
              className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </button>
          ) : (
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Novo mangá</h1>
          )}
          <p className="mt-2 text-sm text-muted-foreground">
            {isEditMode
              ? "Atualize os dados da Obra matriz do catálogo."
              : "Cadastre a Obra matriz do catálogo. Edições e volumes serão vinculados a ela nas próximas etapas."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 md:gap-3">
          <button
            type="button"
            onClick={() => setCurrentStep("identification")}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              currentStep === "identification"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 1</span>
            <span className="hidden text-base font-bold md:block">Identificação</span>
          </button>
          <button
            type="button"
            onClick={goToAuthorsStep}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              currentStep === "authors"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 2</span>
            <span className="hidden text-base font-bold md:block">Autoria</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const identificationError = validateIdentificationStep();
              if (identificationError) {
                showStepValidationError(getInvalidIdentificationFields());
                setCurrentStep("identification");
                return;
              }
              setCurrentStep("authors");
              goToPublicationStep();
            }}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              currentStep === "publication"
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:border-primary"
            }`}
          >
            <span className="block text-center text-xs font-bold uppercase tracking-wide opacity-80 md:text-left">Etapa 3</span>
            <span className="hidden text-base font-bold md:block">Publicação original e classificação</span>
          </button>
        </div>

        {currentStep === "identification" && (
          <>
            <section className="grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2">
              <InputField label="Título" value={title} onChange={(value) => { setTitle(value); clearInvalidField("title"); }} required invalid={isInvalidField("title")} errorMessage={getFieldErrorMessage("title")} placeholder="Digite" />
              <InputField label="Título original" value={originalTitle} onChange={(value) => { setOriginalTitle(value); clearInvalidField("originalTitle"); }} required invalid={isInvalidField("originalTitle")} errorMessage={getFieldErrorMessage("originalTitle")} placeholder="Digite" />
              <SelectField label="País de origem" value={country} onChange={(value) => { setCountry(value); clearInvalidFields(["country", "typeId"]); }} onOpen={() => clearInvalidField("country")} options={NATIVE_COUNTRY_OPTIONS} required invalid={isInvalidField("country")} errorMessage={getFieldErrorMessage("country")} searchable />
              <SelectField label="Tipo de obra" value={typeId} onChange={(value) => { setTypeId(value); clearInvalidField("typeId"); }} onOpen={() => clearInvalidField("typeId")} options={options.workTypes} required disabled={!country} placeholder={country ? "Selecione" : "Selecione o país primeiro"} invalid={isInvalidField("typeId")} errorMessage={getFieldErrorMessage("typeId")} searchable />
              <div className="md:col-span-2">
                <CoverImportField
                  label="Capa da Obra"
                  required
                  invalid={isInvalidField("coverAssetId")}
                  value={coverAssetId ? { assetId: coverAssetId, coverUrl, pending: coverPending } : null}
                  onChange={(cover) => {
                    setCoverAssetId(cover?.assetId || "");
                    setCoverUrl(cover?.coverUrl || "");
                    setCoverPending(cover?.pending || false);
                    clearInvalidField("coverAssetId");
                  }}
                />
              </div>
            </section>

          </>
        )}

        {currentStep === "authors" && (
          <section className="rounded-xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-foreground">Autor(es)</h2>
                <p className="text-sm text-muted-foreground">Adicione cada autor com seu respectivo papel.</p>
              </div>
              <button
                type="button"
                onClick={addAuthor}
                aria-label="Adicionar autor"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90"
              >
                <Plus className="h-4 w-4" />
                Autor
              </button>
            </div>
            <div className="space-y-3 md:relative md:space-y-0">
              {authors.map((author, index) => (
                <div key={index} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]">
                  <SelectField label="Autor" value={author.authorId} onChange={(value) => { updateAuthor(index, "authorId", value); clearInvalidField(`authors.${index}.authorId`); }} onOpen={() => clearInvalidField(`authors.${index}.authorId`)} options={options.authors} required invalid={isInvalidField(`authors.${index}.authorId`)} errorMessage={getFieldErrorMessage(`authors.${index}.authorId`)} searchable />
                  <MultiSelectDropdown
                    label="Papel"
                    options={NATIVE_AUTHOR_ROLE_OPTIONS}
                    selectedIds={author.roles}
                    onToggle={(role) => {
                      toggleAuthorRole(index, String(role));
                      clearInvalidField(`authors.${index}.roles`);
                    }}
                    onOpen={() => clearInvalidField(`authors.${index}.roles`)}
                    required
                    invalid={isInvalidField(`authors.${index}.roles`)}
                    errorMessage={getFieldErrorMessage(`authors.${index}.roles`)}
                    searchable
                  />
                  <button
                    type="button"
                    onClick={() => removeAuthor(index)}
                    disabled={authors.length === 1}
                    className="inline-flex h-12 w-full items-center justify-center gap-2 self-end rounded-xl bg-red-500 px-3 text-sm font-bold text-white hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50 md:w-12"
                    aria-label="Remover autor"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        {currentStep === "publication" && (
          <section className="grid min-w-0 gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-3">
            <SelectField label="Status de publicação original" value={originalPublicationStatus} onChange={(value) => { setOriginalPublicationStatus(value); clearInvalidFields(["originalPublicationStatus", "originalPublicationEndYear", "originalVolumeCount"]); }} onOpen={() => clearInvalidField("originalPublicationStatus")} options={NATIVE_ORIGINAL_STATUS_OPTIONS} required invalid={isInvalidField("originalPublicationStatus")} errorMessage={getFieldErrorMessage("originalPublicationStatus")} searchable />
            <YearSelectField label="Início da publicação original" value={originalPublicationStartYear} onChange={(value) => { setOriginalPublicationStartYear(value); clearInvalidField("originalPublicationStartYear"); }} onOpen={() => clearInvalidField("originalPublicationStartYear")} required invalid={isInvalidField("originalPublicationStartYear")} errorMessage={getFieldErrorMessage("originalPublicationStartYear")} searchable />
            <YearSelectField label="Fim da publicação original" value={originalPublicationEndYear} onChange={(value) => { setOriginalPublicationEndYear(value); clearInvalidField("originalPublicationEndYear"); }} onOpen={() => clearInvalidField("originalPublicationEndYear")} required={!isOpenOriginalPublication} disabled={isOpenOriginalPublication} invalid={isInvalidField("originalPublicationEndYear")} errorMessage={getFieldErrorMessage("originalPublicationEndYear")} searchable />
            <InputField label="Número de volumes originais" value={originalVolumeCount} onChange={(value) => { setOriginalVolumeCount(value); clearInvalidField("originalVolumeCount"); }} type="number" required={!isOpenOriginalPublication} disabled={isOpenOriginalPublication} invalid={isInvalidField("originalVolumeCount")} errorMessage={getFieldErrorMessage("originalVolumeCount")} placeholder="Digite" />
            <MultiSelectDropdown
              label="Editora original"
              options={options.originalPublishers}
              selectedIds={originalPublisherIds}
              onToggle={(id) => {
                toggleSelectedValue(id, originalPublisherIds, setOriginalPublisherIds);
                clearInvalidField("originalPublisherIds");
              }}
              onOpen={() => clearInvalidField("originalPublisherIds")}
              disabled={!country}
              disabledMessage="Incompatível"
              required
              invalid={isInvalidField("originalPublisherIds")}
              errorMessage={getFieldErrorMessage("originalPublisherIds")}
              searchable
              reorderable
              onMove={(fromIndex, toIndex) => moveSelectedValue(
                originalPublisherIds,
                setOriginalPublisherIds,
                fromIndex,
                toIndex
              )}
            />
            <MultiSelectDropdown
              label="Pré-publicação"
              options={options.magazines}
              selectedIds={magazineIds}
              onToggle={(id) => {
                toggleSelectedValue(id, magazineIds, setMagazineIds);
                clearInvalidField("magazineIds");
              }}
              onOpen={() => clearInvalidField("magazineIds")}
              disabled={effectiveDirectRelease}
              emptyMessage={selectedCountryName ? `Nenhuma pré-publicação relacionada a ${selectedCountryName}.` : "Selecione o país de origem para carregar opções de pré-publicação."}
              disabledMessage="Incompatível"
              required={!effectiveDirectRelease}
              invalid={isInvalidField("magazineIds")}
              errorMessage={getFieldErrorMessage("magazineIds")}
              searchable
              reorderable
              onMove={(fromIndex, toIndex) => moveSelectedValue(
                magazineIds,
                setMagazineIds,
                fromIndex,
                toIndex
              )}
            />
            <div className="min-w-0 md:col-start-3 md:row-start-3 md:self-start">
              <ToggleField
                label="Lançamento direto (sem pré-publicação)"
                checked={effectiveDirectRelease}
                disabled={directReleaseBlockedByWorkType}
                onChange={(checked) => {
                  setDirectRelease(checked);
                  if (checked) {
                    setDemographies([]);
                    setMagazineIds([]);
                    clearInvalidFields(["demographies", "magazineIds"]);
                  }
                }}
              />
            </div>
            <div className="min-w-0 md:col-start-1 md:row-start-3">
              <MultiSelectDropdown
                label="Demografias"
                options={NATIVE_DEMOGRAPHY_OPTIONS}
                selectedIds={demographies}
                onToggle={(id) => {
                  toggleSelectedValue(String(id), demographies, setDemographies);
                  clearInvalidField("demographies");
                }}
                onOpen={() => clearInvalidField("demographies")}
                disabled={demographyDisabled}
                disabledMessage="Incompatível"
                required={!demographyDisabled}
                invalid={isInvalidField("demographies")}
                errorMessage={getFieldErrorMessage("demographies")}
                searchable
              />
            </div>
            <div className="min-w-0 space-y-3 md:col-start-2 md:row-start-3">
              <MultiSelectDropdown
                label="Gêneros"
                options={options.genres}
                selectedIds={genreIds}
                onToggle={(id) => {
                  toggleSelectedValue(id, genreIds, setGenreIds);
                  clearInvalidField("genreIds");
                }}
                onOpen={() => clearInvalidField("genreIds")}
                required
                invalid={isInvalidField("genreIds")}
                errorMessage={getFieldErrorMessage("genreIds")}
                searchable
              />
              <ToggleField label="Sinalizar como Conteúdo +18 (Restrito)" checked={adultContent} onChange={setAdultContent} disabled={hasHentaiGenre} className="md:mt-4" />
            </div>
          </section>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-44"
          >
            <RotateCcw className="h-4 w-4" />
            Limpar formulário
          </button>
          <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-row">
            {currentStep !== "identification" && (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep === "publication" ? "authors" : "identification")}
                disabled={saving}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl border border-border bg-input px-5 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-32"
              >
                Voltar
              </button>
            )}
            {currentStep === "publication" ? (
              <button
                key="save-work"
                type="submit"
                disabled={saving || Boolean(optionsError)}
                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-44 ${
                  currentStep === "identification" ? "col-span-2" : ""
                }`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Salvar
              </button>
            ) : (
              <button
                key="continue-work-form"
                type="button"
                onClick={currentStep === "identification" ? goToAuthorsStep : goToPublicationStep}
                disabled={saving || Boolean(optionsError)}
                className={`inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto sm:min-w-44 ${
                  currentStep === "identification" ? "col-span-2" : ""
                }`}
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

export default NewManga;

