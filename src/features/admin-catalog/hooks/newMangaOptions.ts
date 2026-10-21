import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { api } from '@/services/api';
import { getApiError } from '@/lib/apiError';
import { draftFromWork, emptyOptions, filterOptionsByDependency, filterWorkTypesByCountry, findOptionByLabels, getDefaultCountryAndType, getDefaultWorkTypeLabels, isHentaiGenre, isGenreWithoutDemography, normalizeSearchText } from '../pages/newMangaLogic';
import type { NewMangaDraft, NewMangaMode, NewMangaStep, WorkDetailResponse, WorkFormOptions, WorkFormOptionsResponse } from '../pages/newMangaTypes';

export { useNewMangaOptions, useCountryOptions, getDerivedState, useDerivedRules };
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
          api.get<WorkFormOptionsResponse>("/admin/works/form-options"),
          isEditMode && workId ? api.get<WorkDetailResponse>(`/admin/works/${workId}`) : Promise.resolve(null),
        ]);
        if (!isMounted) return;
        const formOptions = preserveLinkedOptions(optionsResponse.data.options, workResponse?.data.work);
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

// Vínculos legados ou inativos continuam visíveis apenas na Obra à qual pertencem.
function preserveLinkedOptions(options: WorkFormOptions, work?: WorkDetailResponse["work"]): WorkFormOptions {
  if (!work) return options;
  const workTypes = [...options.workTypes];
  if (work.type && !workTypes.some(type => Number(type.id) === Number(work.type?.id))) {
    workTypes.push({ ...work.type, preservedCountry: work.country || "" });
  }
  const genres = [...options.genres];
  for (const genre of work.genres) {
    if (!genres.some(option => Number(option.id) === Number(genre.id))) genres.push(genre);
  }
  return { ...options, workTypes, genres };
}

function availableOptions(allOptions: WorkFormOptions, country: string) {
  function relatedOrAll(values: WorkFormOptions[keyof WorkFormOptions]) {
    const related = filterOptionsByDependency(values, country);
    return related.length > 0 ? related : values;
  }
  return {
    authors: relatedOrAll(allOptions.authors),
    // Tipos oficiais são restritos ao país; sem dependência não há combinação válida.
    workTypes: filterWorkTypesByCountry(allOptions.workTypes, country),
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
