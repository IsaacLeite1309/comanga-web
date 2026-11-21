import { adminCachedGet } from "@/services/adminCachedGet";
import { availableWorkTypes } from "@/lib/workTypeOptions";
import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { getApiError } from '@/lib/apiError';
import { draftFromWork, emptyOptions, getDefaultWorkType, getDefaultWorkTypeLabels, isHentaiGenre, isGenreWithoutDemography, normalizeSearchText } from '../pages/newMangaLogic';
import type { NewMangaDraft, NewMangaMode, NewMangaStep, WorkDetailResponse, WorkFormOptions, WorkFormOptionsResponse } from '../pages/newMangaTypes';

export { useNewMangaOptions, useFormOptions, getDerivedState, useDerivedRules };
export type { DerivedState };

type SetDraft = Dispatch<SetStateAction<NewMangaDraft>>;

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
          adminCachedGet<WorkFormOptionsResponse>("/admin/works/form-options"),
          isEditMode && workId ? adminCachedGet<WorkDetailResponse>(`/admin/works/${workId}`) : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        const formOptions = preserveLinkedOptions({ ...optionsResponse.data.options, workTypes: availableWorkTypes(optionsResponse.data.options.workTypes) }, workResponse?.data.work);
        setAllOptions(formOptions);
        setOptions({ ...emptyOptions, genres: formOptions.genres });
        if (workResponse?.data.work) {
          setDraft(draftFromWork(workResponse.data.work));
          setCurrentStep("identification");
          return;
        }
        setDraft((current) => formOptions.workTypes.some(type => String(type.id) === current.typeId)
          ? current
          : { ...current, ...getDefaultWorkType(formOptions) });
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

// Vínculos legados ou inativos continuam visíveis apenas na Obra à qual pertencem.
function preserveLinkedOptions(options: WorkFormOptions, work?: WorkDetailResponse["work"]): WorkFormOptions {
  if (!work) return options;
  const workTypes = [...options.workTypes];
  if (work.type && !workTypes.some(type => Number(type.id) === Number(work.type?.id))) {
    workTypes.push(work.type);
  }
  const genres = [...options.genres];
  for (const genre of work.genres) {
    if (!genres.some(option => Number(option.id) === Number(genre.id))) genres.push(genre);
  }
  return { ...options, workTypes, genres };
}

function useFormOptions(
  allOptions: WorkFormOptions,
  setOptions: Dispatch<SetStateAction<WorkFormOptions>>
) {
  useEffect(() => { setOptions(allOptions); }, [allOptions, setOptions]);
}

function getDerivedState(draft: NewMangaDraft, options: WorkFormOptions, allOptions: WorkFormOptions) {
  const workTypeName = options.workTypes.find((type) => String(type.id) === draft.typeId)?.label
    || allOptions.workTypes.find((type) => String(type.id) === draft.typeId)?.label;
  const normalizedType = workTypeName ? normalizeSearchText(workTypeName) : "";
  const isManga = workTypeName ? getDefaultWorkTypeLabels().includes(normalizedType) : true;
  const directReleaseBlockedByWorkType = ["artbook", "databook"].includes(normalizedType);
  const effectiveDirectRelease = draft.directRelease || directReleaseBlockedByWorkType;
  const isOpenOriginalPublication = ["em andamento", "hiato"].some(
    (status) => normalizeSearchText(draft.originalPublicationStatus).includes(status)
  );
  const hasHentaiGenre = options.genres.some(
    (genre) => draft.genreIds.includes(Number(genre.id)) && isHentaiGenre(genre)
  );
  const hasGenreWithoutDemography = allOptions.genres.some(
    (genre) => draft.genreIds.includes(Number(genre.id)) && isGenreWithoutDemography(genre)
  );
  return {
    demographyDisabled: effectiveDirectRelease || Boolean(draft.typeId && !isManga) || hasGenreWithoutDemography,
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
  const hadHentaiGenre = useRef(derived.hasHentaiGenre);
  useEffect(() => {
    if (!derived.demographyDisabled) return;
    setDraft((current) => ({ ...current, demographies: [] }));
    setInvalidFields((current) => current.filter((field) => field !== "demographies"));
  }, [derived.demographyDisabled, setDraft, setInvalidFields]);
  useEffect(() => {
    if (derived.hasHentaiGenre) {
      setDraft((current) => ({ ...current, adultContent: true }));
    } else if (hadHentaiGenre.current) {
      setDraft((current) => ({ ...current, adultContent: false }));
    }
    hadHentaiGenre.current = derived.hasHentaiGenre;
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
