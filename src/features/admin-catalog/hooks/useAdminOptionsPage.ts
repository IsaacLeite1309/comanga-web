import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import {
  getRememberedAdminOptionsCategory,
  getRememberedAdminOptionsCountryIds,
  getRememberedAdminOptionsForm,
  getRememberedAdminOptionsNewValue,
  getRememberedAdminOptionsSearchTerm,
  rememberAdminOptionsCategory,
  rememberAdminOptionsCountryIds,
  rememberAdminOptionsForm,
  rememberAdminOptionsNewValue,
  rememberAdminOptionsSearchTerm,
} from "../pages/adminOptionsMemory";
import {
  CATEGORIES,
  COUNTRY_CATEGORY_SLUG,
  DEFAULT_PAGE_SIZE,
  DomainOptionValue,
  getCategoryForm,
  getPageSizeForCategory,
  isCountryDependent,
  OptionForm,
  OptionsPagination,
  OptionsResponse,
  parseNewValueLabels,
  SortOrder,
} from "../pages/adminOptionsModel";

function useAdminOptionsSelection() {
  const rememberedCategory = getRememberedAdminOptionsCategory();
  const [selectedForm, setSelectedForm] = useState<OptionForm>(() => (
    getCategoryForm(rememberedCategory) || getRememberedAdminOptionsForm()
  ));
  const [selectedCategory, setSelectedCategory] = useState(getRememberedAdminOptionsCategory);
  const [newValue, setNewValue] = useState(getRememberedAdminOptionsNewValue);
  const [newValueError, setNewValueError] = useState("");
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>(getRememberedAdminOptionsCountryIds);
  const [searchTerm, setSearchTerm] = useState(getRememberedAdminOptionsSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(getRememberedAdminOptionsSearchTerm().trim());
  const [order, setOrder] = useState<SortOrder>("ASC");
  const categoryOptions = useMemo(
    () => CATEGORIES.filter((category) => category.form === selectedForm),
    [selectedForm]
  );
  const currentCategory = useMemo(
    () => CATEGORIES.find((category) => category.slug === selectedCategory),
    [selectedCategory]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearchTerm(searchTerm.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (isCountryDependent(selectedCategory)) return;
    setSelectedCountryIds([]);
    rememberAdminOptionsCountryIds([]);
  }, [selectedCategory]);

  function clearCategoryState() {
    rememberAdminOptionsCategory("");
    setSelectedCategory("");
    setNewValue("");
    rememberAdminOptionsNewValue("");
    setNewValueError("");
    setSelectedCountryIds([]);
    rememberAdminOptionsCountryIds([]);
    setSearchTerm("");
    rememberAdminOptionsSearchTerm("");
    setDebouncedSearchTerm("");
  }

  function changeForm(formSlug: string) {
    const nextForm = formSlug as OptionForm;
    setSelectedForm(nextForm);
    rememberAdminOptionsForm(nextForm);
    clearCategoryState();
  }

  function changeCategory(categorySlug: string) {
    rememberAdminOptionsCategory(categorySlug);
    setSelectedCategory(categorySlug);
  }

  function changeNewValue(value: string) {
    setNewValue(value);
    rememberAdminOptionsNewValue(value);
    if (newValueError) setNewValueError("");
  }

  function changeSearchTerm(value: string) {
    setSearchTerm(value);
    rememberAdminOptionsSearchTerm(value);
  }

  function toggleNewValueCountry(countryId: number) {
    setSelectedCountryIds((current) => {
      const next = current.includes(countryId)
        ? current.filter((id) => id !== countryId)
        : [...current, countryId];
      rememberAdminOptionsCountryIds(next);
      return next;
    });
  }

  function clearNewValue() {
    setNewValue("");
    rememberAdminOptionsNewValue("");
    setSelectedCountryIds([]);
    rememberAdminOptionsCountryIds([]);
  }

  return {
    categoryOptions,
    changeCategory,
    changeForm,
    changeNewValue,
    changeSearchTerm,
    clearCategoryState,
    clearNewValue,
    currentCategory,
    debouncedSearchTerm,
    newValue,
    newValueError,
    order,
    searchTerm,
    selectedCategory,
    selectedCountryIds,
    selectedForm,
    setNewValueError,
    setOrder,
    toggleNewValueCountry,
  };
}

type Selection = ReturnType<typeof useAdminOptionsSelection>;

function useAdminOptionsData(selection: Selection) {
  const [values, setValues] = useState<DomainOptionValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [countryOptions, setCountryOptions] = useState<DomainOptionValue[]>([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<OptionsPagination>({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const countryDependent = isCountryDependent(selection.selectedCategory);
  const pageSize = selection.selectedCategory
    ? getPageSizeForCategory(selection.selectedCategory)
    : DEFAULT_PAGE_SIZE;

  const fetchOptions = useCallback(async (
    categorySlug: string,
    term: string,
    sortOrder: SortOrder,
    currentPage: number
  ) => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get<OptionsResponse>(`/admin/options/${categorySlug}`, {
        params: {
          ...(term ? { term } : {}),
          order: sortOrder,
          page: currentPage,
          limit: getPageSizeForCategory(categorySlug),
        },
      });
      setValues(response.data.values);
      setPagination(response.data.pagination);
    } catch (requestError) {
      setError(getApiError(requestError, "Erro ao carregar opções."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!selection.selectedCategory) {
      setValues([]);
      setLoading(false);
      setError("");
      setPagination({
        page: 1,
        limit: DEFAULT_PAGE_SIZE,
        total: 0,
        totalPages: 1,
      });
      return;
    }
    void fetchOptions(
      selection.selectedCategory,
      selection.debouncedSearchTerm,
      selection.order,
      page
    );
  }, [
    fetchOptions,
    page,
    selection.debouncedSearchTerm,
    selection.order,
    selection.selectedCategory,
  ]);

  useEffect(() => {
    setPage(1);
    setPagination((current) => ({ ...current, limit: pageSize }));
  }, [pageSize, selection.debouncedSearchTerm, selection.order, selection.selectedCategory]);

  useEffect(() => {
    if (!countryDependent) {
      setCountryError("");
      return;
    }
    let active = true;
    async function fetchCountries() {
      setCountryLoading(true);
      setCountryError("");
      try {
        const response = await api.get<OptionsResponse>(`/admin/options/${COUNTRY_CATEGORY_SLUG}`, {
          params: {
            order: "ASC",
            page: 1,
            limit: 100,
          },
        });
        if (active) setCountryOptions(response.data.values);
      } catch (requestError) {
        if (active) {
          setCountryError(getApiError(requestError, "Erro ao carregar países de origem."));
        }
      } finally {
        if (active) setCountryLoading(false);
      }
    }
    void fetchCountries();
    return () => {
      active = false;
    };
  }, [countryDependent]);

  return {
    countryDependent,
    countryError,
    countryLoading,
    countryOptions,
    error,
    fetchOptions,
    loading,
    page,
    pagination,
    setPage,
    setPagination,
    setValues,
    values,
  };
}

function useEditingState() {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingCountryIds, setEditingCountryIds] = useState<number[]>([]);
  const [savingEditId, setSavingEditId] = useState<number | null>(null);

  function cancelEditing() {
    setEditingId(null);
    setEditingValue("");
    setEditingCountryIds([]);
  }

  function startEditing(value: DomainOptionValue) {
    setEditingId(value.id);
    setEditingValue(value.label);
    setEditingCountryIds(value.depends_on?.map((dependency) => dependency.id) || []);
  }

  function toggleEditingCountry(countryId: number) {
    setEditingCountryIds((current) => (
      current.includes(countryId) ? current.filter((id) => id !== countryId) : [...current, countryId]
    ));
  }

  return {
    cancelEditing,
    editingCountryIds,
    editingId,
    editingValue,
    savingEditId,
    setEditingCountryIds,
    setEditingId,
    setEditingValue,
    setSavingEditId,
    startEditing,
    toggleEditingCountry,
  };
}

type Data = ReturnType<typeof useAdminOptionsData>;
type Editing = ReturnType<typeof useEditingState>;

function useAdminOptionMutations(selection: Selection, data: Data, editing: Editing) {
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteValue, setPendingDeleteValue] = useState<DomainOptionValue | null>(null);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const label = selection.newValue.trim();
    const labels = selection.selectedCategory
      ? parseNewValueLabels(label, selection.selectedCategory)
      : [];
    if (!label) {
      return selection.setNewValueError("Informe o texto do novo valor.");
    }
    if (labels.length === 0) {
      return selection.setNewValueError("Informe ao menos um valor válido.");
    }
    if (!selection.selectedCategory) {
      return selection.setNewValueError("Selecione uma categoria.");
    }
    if (data.countryDependent && selection.selectedCountryIds.length === 0) {
      return selection.setNewValueError("Selecione ao menos um país de origem relacionado.");
    }
    selection.setNewValueError("");
    setSaving(true);
    try {
      await api.post<{ value: DomainOptionValue; values?: DomainOptionValue[] }>("/admin/options", {
        category: selection.selectedCategory,
        label,
        ...(data.countryDependent ? { dependsOnValueIds: selection.selectedCountryIds } : {}),
      });
      selection.clearNewValue();
      data.setPage(1);
      await data.fetchOptions(
        selection.selectedCategory,
        selection.debouncedSearchTerm,
        selection.order,
        1
      );
      toast.success(
        labels.length > 1 ? "Valores cadastrados com sucesso." : "Valor cadastrado com sucesso."
      );
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao cadastrar valor."));
    } finally {
      setSaving(false);
    }
  }

  async function saveEditing(value: DomainOptionValue) {
    const label = editing.editingValue.trim();
    if (!label) {
      return toast.error("Informe o texto do novo valor.");
    }
    if (data.countryDependent && editing.editingCountryIds.length === 0) {
      return toast.error("Selecione ao menos um país de origem relacionado.");
    }
    editing.setSavingEditId(value.id);
    try {
      await api.patch<{ value: DomainOptionValue }>(`/admin/options/${value.id}`, {
        label,
        ...(data.countryDependent ? { dependsOnValueIds: editing.editingCountryIds } : {}),
      });
      editing.cancelEditing();
      await data.fetchOptions(
        selection.selectedCategory,
        selection.debouncedSearchTerm,
        selection.order,
        data.page
      );
      toast.success("Valor atualizado com sucesso.");
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao atualizar valor."));
    } finally {
      editing.setSavingEditId(null);
    }
  }

  async function confirmDeleteValue() {
    if (!pendingDeleteValue) return;
    setDeletingId(pendingDeleteValue.id);
    try {
      await api.delete(`/admin/options/${pendingDeleteValue.id}`);
      setPendingDeleteValue(null);
      await data.fetchOptions(
        selection.selectedCategory,
        selection.debouncedSearchTerm,
        selection.order,
        data.page
      );
      toast.success("Valor excluído com sucesso.");
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao excluir valor."));
    } finally {
      setDeletingId(null);
    }
  }

  return {
    confirmDeleteValue,
    deletingId,
    handleCreate,
    pendingDeleteValue,
    saveEditing,
    saving,
    setPendingDeleteValue,
  };
}

export function useAdminOptionsPage() {
  const selection = useAdminOptionsSelection();
  const data = useAdminOptionsData(selection);
  const editing = useEditingState();
  const mutations = useAdminOptionMutations(selection, data, editing);
  const {
    setEditingCountryIds,
    setEditingId,
    setEditingValue,
  } = editing;

  useEffect(() => {
    setEditingId(null);
    setEditingValue("");
    setEditingCountryIds([]);
  }, [
    data.page,
    setEditingCountryIds,
    setEditingId,
    setEditingValue,
    selection.debouncedSearchTerm,
    selection.order,
    selection.selectedCategory,
  ]);

  function changeForm(formSlug: string) {
    selection.changeForm(formSlug);
    data.setValues([]);
    data.setPage(1);
    data.setPagination({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });
    editing.cancelEditing();
  }

  return {
    ...selection,
    ...data,
    ...editing,
    ...mutations,
    changeForm,
  };
}

export type AdminOptionsPageModel = ReturnType<typeof useAdminOptionsPage>;
