import { adminCachedGet, readAdminCachedResponse } from "@/services/adminCachedGet";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import { clearAdminCache } from "@/lib/queryClient";

import {
  getRememberedAdminOptionsCategory,
  getRememberedAdminOptionsForm,
  getRememberedAdminOptionsNewValue,
  getRememberedAdminOptionsSearchTerm,
  rememberAdminOptionsCategory,
  rememberAdminOptionsForm,
  rememberAdminOptionsNewValue,
  rememberAdminOptionsSearchTerm,
} from "../pages/adminOptionsMemory";
import {
  CATEGORIES,
  DEFAULT_PAGE_SIZE,
  DomainOptionValue,
  getCategoryForm,
  getPageSizeForCategory,
  isSystemManagedCategory,
  OptionForm,
  OptionsPagination,
  OptionsResponse,
  parseNewValueLabels,
  SortOrder,
} from "../pages/adminOptionsModel";

let rememberedOptionsPage = 1;

function useAdminOptionsSelection() {
  const rememberedCategory = getRememberedAdminOptionsCategory();
  const [selectedForm, setSelectedForm] = useState<OptionForm>(() => (
    getCategoryForm(rememberedCategory) || getRememberedAdminOptionsForm()
  ));
  const [selectedCategory, setSelectedCategory] = useState(getRememberedAdminOptionsCategory);
  const [newValue, setNewValue] = useState(getRememberedAdminOptionsNewValue);
  const [newValueError, setNewValueError] = useState("");
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


  function clearCategoryState() {
    rememberAdminOptionsCategory("");
    setSelectedCategory("");
    setNewValue("");
    rememberAdminOptionsNewValue("");
    setNewValueError("");
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

  function clearNewValue() {
    setNewValue("");
    rememberAdminOptionsNewValue("");
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
    selectedForm,
    setNewValueError,
    setOrder,
  };
}

type Selection = ReturnType<typeof useAdminOptionsSelection>;

function useAdminOptionsData(selection: Selection) {
  const initialCategory = selection.selectedCategory;
  const initialParams = initialCategory ? {
    ...(selection.debouncedSearchTerm ? { term: selection.debouncedSearchTerm } : {}),
    ...(isSystemManagedCategory(initialCategory) ? { includeInactive: "true" } : {}),
    order: selection.order, page: rememberedOptionsPage, limit: getPageSizeForCategory(),
  } : null;
  const initial = initialParams
    ? readAdminCachedResponse<OptionsResponse>(`/admin/options/${initialCategory}`, { params: initialParams })?.data
    : undefined;
  const [values, setValues] = useState<DomainOptionValue[]>(initial?.values ?? []);
  const [loading, setLoading] = useState(!initial);
  const [error, setError] = useState("");
  const [page, setPage] = useState(rememberedOptionsPage);
  const [pagination, setPagination] = useState<OptionsPagination>(initial?.pagination ?? {
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const systemManagedCategory = isSystemManagedCategory(selection.selectedCategory);
  const pageSize = selection.selectedCategory
    ? getPageSizeForCategory()
    : DEFAULT_PAGE_SIZE;

  const fetchOptions = useCallback(async (
    categorySlug: string,
    term: string,
    sortOrder: SortOrder,
    currentPage: number
  ) => {
    const params = {
      ...(term ? { term } : {}),
      ...(isSystemManagedCategory(categorySlug) ? { includeInactive: "true" } : {}),
      order: sortOrder, page: currentPage, limit: getPageSizeForCategory(),
    };
    const cached = readAdminCachedResponse<OptionsResponse>(`/admin/options/${categorySlug}`, { params })?.data;
    if (cached) {
      setValues(cached.values);
      setPagination(cached.pagination);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await adminCachedGet<OptionsResponse>(`/admin/options/${categorySlug}`, { params });
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

  const filterKey = `${pageSize}|${selection.debouncedSearchTerm}|${selection.order}|${selection.selectedCategory}`;
  const previousFilterKey = useRef(filterKey);
  useEffect(() => {
    if (previousFilterKey.current === filterKey) return;
    previousFilterKey.current = filterKey;
    setPage(1);
    setPagination((current) => ({ ...current, limit: pageSize }));
  }, [filterKey, pageSize]);
  useEffect(() => { rememberedOptionsPage = page; }, [page]);


  return {
    systemManagedCategory,
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
  const [savingEditId, setSavingEditId] = useState<number | null>(null);

  function cancelEditing() {
    setEditingId(null);
    setEditingValue("");
  }

  function startEditing(value: DomainOptionValue) {
    setEditingId(value.id);
    setEditingValue(value.label);
  }

  return {
    cancelEditing,
    editingId,
    editingValue,
    savingEditId,
    setEditingId,
    setEditingValue,
    setSavingEditId,
    startEditing,
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
    selection.setNewValueError("");
    setSaving(true);
    try {
      await api.post<{ value: DomainOptionValue; values?: DomainOptionValue[] }>("/admin/options", {
        category: selection.selectedCategory,
        label,
      });
      clearAdminCache();
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
    editing.setSavingEditId(value.id);
    try {
      await api.patch<{ value: DomainOptionValue }>(`/admin/options/${value.id}`, {
        label,
      });
      clearAdminCache();
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
      clearAdminCache();
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

// Ativar/desativar é a única alteração permitida nas listas controladas.
function useOptionStatusMutations(selection: Selection, data: Data) {
  const [togglingId, setTogglingId] = useState<number | null>(null);

  function refreshCurrentPage() {
    return data.fetchOptions(
      selection.selectedCategory,
      selection.debouncedSearchTerm,
      selection.order,
      data.page
    );
  }

  async function toggleActive(value: DomainOptionValue) {
    setTogglingId(value.id);
    try {
      await api.patch<{ value: DomainOptionValue }>(`/admin/options/${value.id}`, {
        active: value.active === false,
      });
      clearAdminCache();
      await refreshCurrentPage();
      toast.success(value.active === false ? "Valor ativado." : "Valor desativado.");
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao alterar a situação do valor."));
    } finally {
      setTogglingId(null);
    }
  }

  return { toggleActive, togglingId };
}

export function useAdminOptionsPage() {
  const selection = useAdminOptionsSelection();
  const data = useAdminOptionsData(selection);
  const editing = useEditingState();
  const mutations = useAdminOptionMutations(selection, data, editing);
  const statusMutations = useOptionStatusMutations(selection, data);
  const {
    setEditingId,
    setEditingValue,
  } = editing;

  useEffect(() => {
    setEditingId(null);
    setEditingValue("");
  }, [
    data.page,
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
    ...statusMutations,
    changeForm,
  };
}

export type AdminOptionsPageModel = ReturnType<typeof useAdminOptionsPage>;
