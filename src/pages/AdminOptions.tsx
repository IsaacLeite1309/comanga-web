import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, Check, ChevronDown, Edit3, Loader2, Plus, Save, Search, Trash2, X } from "lucide-react";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/services/api";
import { useDropdown } from "@/hooks/useDropdown";
import {
  getRememberedAdminOptionsCategory,
  getRememberedAdminOptionsCountryIds,
  getRememberedAdminOptionsNewValue,
  getRememberedAdminOptionsSearchTerm,
  rememberAdminOptionsCategory,
  rememberAdminOptionsCountryIds,
  rememberAdminOptionsNewValue,
  rememberAdminOptionsSearchTerm,
} from "./adminOptionsMemory";

interface OptionCategory {
  slug: string;
  name: string;
  form?: OptionForm;
}

type OptionForm = "obra" | "edicao";

interface DomainOptionValue {
  id: number;
  label: string;
  category: OptionCategory;
  depends_on?: DomainOptionValueDependency[];
}

interface DomainOptionValueDependency {
  id: number;
  label: string;
  category: OptionCategory;
}

interface OptionsResponse {
  category: OptionCategory;
  values: DomainOptionValue[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

type SortOrder = "ASC" | "DESC";

const DEFAULT_PAGE_SIZE = 6;
const COUNTRY_DEPENDENT_PAGE_SIZE = 5;

const FORM_OPTIONS: OptionCategory[] = [
  { slug: "obra", name: "Obra" },
  { slug: "edicao", name: "Edição" },
];

const CATEGORIES: OptionCategory[] = [
  { slug: "autores", name: "Autor", form: "obra" },
  { slug: "tipos-obra", name: "Tipo de obra", form: "obra" },
  { slug: "generos", name: "Gêneros", form: "obra" },
  { slug: "revistas-serializacao", name: "Pré-publicação", form: "obra" },
  { slug: "editoras-originais", name: "Editora original", form: "obra" },
  { slug: "editoras-brasileiras", name: "Editora brasileira", form: "edicao" },
  { slug: "tipos-edicao", name: "Tipo de edição", form: "edicao" },
  { slug: "tipos-capa", name: "Acabamento", form: "edicao" },
  { slug: "formatos-fisicos", name: "Formato", form: "edicao" },
  { slug: "miolos", name: "Miolo", form: "edicao" },
];

const COUNTRY_CATEGORY_SLUG = "paises-origem";
const COUNTRY_DEPENDENT_CATEGORY_SLUGS = new Set([
  "autores",
  "tipos-obra",
  "revistas-serializacao",
  "editoras-originais",
]);
const COMMA_LITERAL_CATEGORY_SLUGS = new Set(["formatos-fisicos"]);

function getPageSizeForCategory(categorySlug: string) {
  return COUNTRY_DEPENDENT_CATEGORY_SLUGS.has(categorySlug)
    ? COUNTRY_DEPENDENT_PAGE_SIZE
    : DEFAULT_PAGE_SIZE;
}

function getCategoryForm(categorySlug: string): OptionForm | undefined {
  return CATEGORIES.find((category) => category.slug === categorySlug)?.form;
}

function parseNewValueLabels(label: string, categorySlug: string) {
  if (COMMA_LITERAL_CATEGORY_SLUGS.has(categorySlug)) {
    return [label.trim()].filter(Boolean);
  }

  return label.split(",").map((item) => item.trim()).filter(Boolean);
}

function getApiError(error: unknown, fallback: string) {
  if (isAxiosError(error) && error.response?.data?.error) {
    return error.response.data.error;
  }

  return fallback;
}

interface CategoryDropdownProps {
  label: string;
  value: string;
  options: OptionCategory[];
  onChange: (value: string) => void;
  emptyMessage?: string;
}

function CategoryDropdown({
  label,
  value,
  options,
  onChange,
  emptyMessage = "Nenhuma categoria encontrada.",
}: CategoryDropdownProps) {
  const { isOpen, closeDropdown, toggleDropdown, rootProps } = useDropdown();
  const selectedOption = options.find((option) => option.slug === value);

  function selectOption(option: OptionCategory) {
    onChange(option.slug);
    closeDropdown();
  }

  return (
    <div {...rootProps} className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="mt-2 flex h-12 w-full items-center justify-between gap-3 rounded-xl border border-border bg-input px-3 text-left text-base font-semibold text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
        aria-expanded={isOpen}
        aria-label={label}
      >
        <span className={`truncate ${selectedOption ? "" : "text-muted-foreground"}`}>
          {selectedOption?.name || "Selecione"}
        </span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-30 w-full overflow-hidden rounded-lg border border-primary bg-background shadow-2xl">
          <div className="max-h-72 overflow-y-auto">
          {options.map((option) => {
            const selected = option.slug === value;

            return (
              <button
                key={option.slug}
                type="button"
                onClick={() => selectOption(option)}
                className={`flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-base font-semibold transition-colors ${
                  selected
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-primary hover:text-primary-foreground"
                }`}
              >
                <span>{option.name}</span>
                {selected && <Check className="h-4 w-4" />}
              </button>
            );
          })}
          {options.length === 0 && (
            <div className="px-3 py-4 text-sm font-semibold text-muted-foreground">
              {emptyMessage}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  );
}

const AdminOptions = () => {
  const [selectedForm, setSelectedForm] = useState<OptionForm>(() => (
    getCategoryForm(getRememberedAdminOptionsCategory()) || "obra"
  ));
  const [selectedCategory, setSelectedCategory] = useState(getRememberedAdminOptionsCategory);
  const [values, setValues] = useState<DomainOptionValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newValue, setNewValue] = useState(getRememberedAdminOptionsNewValue);
  const [newValueError, setNewValueError] = useState("");
  const [selectedCountryIds, setSelectedCountryIds] = useState<number[]>(getRememberedAdminOptionsCountryIds);
  const [countryOptions, setCountryOptions] = useState<DomainOptionValue[]>([]);
  const [countryLoading, setCountryLoading] = useState(false);
  const [countryError, setCountryError] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingCountryIds, setEditingCountryIds] = useState<number[]>([]);
  const [savingEditId, setSavingEditId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteValue, setPendingDeleteValue] = useState<DomainOptionValue | null>(null);
  const [searchTerm, setSearchTerm] = useState(getRememberedAdminOptionsSearchTerm);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(getRememberedAdminOptionsSearchTerm().trim());
  const [order, setOrder] = useState<SortOrder>("ASC");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });

  const currentCategory = useMemo(
    () => CATEGORIES.find((category) => category.slug === selectedCategory),
    [selectedCategory]
  );
  const categoryOptions = useMemo(
    () => CATEGORIES.filter((category) => category.form === selectedForm),
    [selectedForm]
  );

  useEffect(() => {
    if (!selectedCategory) return;

    const categoryStillExists = categoryOptions.some((category) => category.slug === selectedCategory);

    if (!categoryStillExists) {
      rememberAdminOptionsCategory("");
      setSelectedCategory("");
      setValues([]);
      setError("");
      setNewValue("");
      rememberAdminOptionsNewValue("");
      setNewValueError("");
      setSelectedCountryIds([]);
      rememberAdminOptionsCountryIds([]);
      setSearchTerm("");
      rememberAdminOptionsSearchTerm("");
      setDebouncedSearchTerm("");
      setPage(1);
    }
  }, [categoryOptions, selectedCategory]);

  const totalPages = Math.max(1, pagination.totalPages);
  const isCountryDependentCategory = selectedCategory
    ? COUNTRY_DEPENDENT_CATEGORY_SLUGS.has(selectedCategory)
    : false;
  const selectedCategoryPageSize = selectedCategory
    ? getPageSizeForCategory(selectedCategory)
    : DEFAULT_PAGE_SIZE;

  function handleSelectedCategoryChange(categorySlug: string) {
    rememberAdminOptionsCategory(categorySlug);
    setSelectedCategory(categorySlug);
  }

  function handleSelectedFormChange(formSlug: string) {
    const nextForm = formSlug as OptionForm;

    setSelectedForm(nextForm);
    rememberAdminOptionsCategory("");
    setSelectedCategory("");
    setValues([]);
    setError("");
    setNewValue("");
    rememberAdminOptionsNewValue("");
    setNewValueError("");
    setSelectedCountryIds([]);
    rememberAdminOptionsCountryIds([]);
    setSearchTerm("");
    rememberAdminOptionsSearchTerm("");
    setDebouncedSearchTerm("");
    setPage(1);
    cancelEditing();
    setPagination({
      page: 1,
      limit: DEFAULT_PAGE_SIZE,
      total: 0,
      totalPages: 1,
    });
  }

  function toggleNewValueCountry(countryId: number) {
    setSelectedCountryIds((current) => {
      const nextCountryIds = current.includes(countryId)
        ? current.filter((id) => id !== countryId)
        : [...current, countryId];

      rememberAdminOptionsCountryIds(nextCountryIds);
      return nextCountryIds;
    });
  }

  function toggleEditingCountry(countryId: number) {
    setEditingCountryIds((current) => (
      current.includes(countryId)
        ? current.filter((id) => id !== countryId)
        : [...current, countryId]
    ));
  }

  const fetchOptions = useCallback(async (categorySlug: string, term: string, sortOrder: SortOrder, currentPage: number) => {
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
    const timer = window.setTimeout(() => {
      setDebouncedSearchTerm(searchTerm.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (!selectedCategory) {
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

    fetchOptions(selectedCategory, debouncedSearchTerm, order, page);
  }, [debouncedSearchTerm, fetchOptions, order, page, selectedCategory]);

  useEffect(() => {
    if (!isCountryDependentCategory) {
      setSelectedCountryIds([]);
      rememberAdminOptionsCountryIds([]);
      setCountryError("");
      return;
    }

    async function fetchCountryOptions() {
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
        setCountryOptions(response.data.values);
      } catch (requestError) {
        setCountryError(getApiError(requestError, "Erro ao carregar países de origem."));
      } finally {
        setCountryLoading(false);
      }
    }

    fetchCountryOptions();
  }, [isCountryDependentCategory]);

  useEffect(() => {
    setPage(1);
    setEditingId(null);
    setEditingValue("");
    setEditingCountryIds([]);
    setPagination((current) => ({
      ...current,
      limit: selectedCategoryPageSize,
    }));
  }, [debouncedSearchTerm, order, selectedCategory, selectedCategoryPageSize]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const label = newValue.trim();
    const labels = selectedCategory ? parseNewValueLabels(label, selectedCategory) : [];
    if (!label) {
      setNewValueError("Informe o texto do novo valor.");
      return;
    }

    if (labels.length === 0) {
      setNewValueError("Informe ao menos um valor válido.");
      return;
    }

    if (!selectedCategory) {
      setNewValueError("Selecione uma categoria.");
      return;
    }

    if (isCountryDependentCategory && selectedCountryIds.length === 0) {
      setNewValueError("Selecione ao menos um país de origem relacionado.");
      return;
    }

    setNewValueError("");
    setSaving(true);

    try {
      await api.post<{ value: DomainOptionValue; values?: DomainOptionValue[] }>("/admin/options", {
        category: selectedCategory,
        label,
        ...(isCountryDependentCategory ? { dependsOnValueIds: selectedCountryIds } : {}),
      });
      setNewValue("");
      rememberAdminOptionsNewValue("");
      setSelectedCountryIds([]);
      rememberAdminOptionsCountryIds([]);
      setPage(1);
      await fetchOptions(selectedCategory, debouncedSearchTerm, order, 1);
      toast.success(labels.length > 1 ? "Valores cadastrados com sucesso." : "Valor cadastrado com sucesso.");
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao cadastrar valor."));
    } finally {
      setSaving(false);
    }
  }

  function startEditing(value: DomainOptionValue) {
    setEditingId(value.id);
    setEditingValue(value.label);
    setEditingCountryIds(value.depends_on?.map((dependency) => dependency.id) || []);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditingValue("");
    setEditingCountryIds([]);
  }

  async function saveEditing(value: DomainOptionValue) {
    const label = editingValue.trim();
    if (!label) {
      toast.error("Informe o texto do novo valor.");
      return;
    }

    if (isCountryDependentCategory && editingCountryIds.length === 0) {
      toast.error("Selecione ao menos um país de origem relacionado.");
      return;
    }

    setSavingEditId(value.id);

    try {
      await api.patch<{ value: DomainOptionValue }>(`/admin/options/${value.id}`, {
        label,
        ...(isCountryDependentCategory ? { dependsOnValueIds: editingCountryIds } : {}),
      });
      cancelEditing();
      await fetchOptions(selectedCategory, debouncedSearchTerm, order, page);
      toast.success("Valor atualizado com sucesso.");
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao atualizar valor."));
    } finally {
      setSavingEditId(null);
    }
  }

  function requestDelete(value: DomainOptionValue) {
    setPendingDeleteValue(value);
  }

  async function confirmDeleteValue() {
    if (!pendingDeleteValue) return;

    setDeletingId(pendingDeleteValue.id);

    try {
      await api.delete(`/admin/options/${pendingDeleteValue.id}`);
      setPendingDeleteValue(null);
      await fetchOptions(selectedCategory, debouncedSearchTerm, order, page);
      toast.success("Valor excluído com sucesso.");
    } catch (requestError) {
      toast.error(getApiError(requestError, "Erro ao excluir valor."));
    } finally {
      setDeletingId(null);
    }
  }

  function toggleOrder() {
    setOrder((current) => current === "ASC" ? "DESC" : "ASC");
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Gerenciar Opções</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Mantenha as listas padronizadas usadas no cadastro de obras, edições e volumes.
            <br />
            {selectedCategory === "formatos-fisicos"
              ? "Em Formato, vírgulas fazem parte do valor e não separam cadastros múltiplos."
              : "Para adicionar mais de um valor ao mesmo tempo, separe os novos valores por vírgulas."}
          </p>
        </div>

        <section className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[150px_260px_1fr]">
          <div className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Formulário</span>
            <CategoryDropdown
              label="Selecionar formulário"
              value={selectedForm}
              options={FORM_OPTIONS}
              onChange={handleSelectedFormChange}
              emptyMessage="Nenhum formulário encontrado."
            />
          </div>

          <div className="block">
            <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Categoria</span>
            <CategoryDropdown
              label="Selecionar categoria"
              value={selectedCategory}
              options={categoryOptions}
              onChange={handleSelectedCategoryChange}
            />
          </div>

          <form className="flex flex-col gap-2 sm:grid sm:grid-cols-[minmax(0,1fr)_150px] sm:items-start" onSubmit={handleCreate}>
            <label className="min-w-0 flex-1">
              <span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Novo valor</span>
              <input
                value={newValue}
                onChange={(event) => {
                  const value = event.target.value;
                  setNewValue(value);
                  rememberAdminOptionsNewValue(value);
                  if (newValueError) setNewValueError("");
                }}
                disabled={!selectedCategory}
                placeholder={currentCategory ? `Adicionar em ${currentCategory.name}` : "Selecione uma categoria"}
                className={`mt-2 h-12 w-full rounded-xl border bg-input px-3 text-base text-foreground outline-none transition-colors focus:ring-2 focus:ring-primary/40 ${
                  newValueError ? "border-red-500 focus:border-red-500" : "border-border focus:border-primary"
                }`}
              />
              {newValueError && <span className="mt-1 ml-1 block text-xs text-red-500">{newValueError}</span>}
            </label>
            <div className="sm:pt-[30px]">
              <button
                type="submit"
                disabled={saving || !selectedCategory}
                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Adicionar
              </button>
            </div>
            {isCountryDependentCategory && (
              <div className="sm:col-span-2">
                <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">País de origem relacionado</p>
                {countryLoading && (
                  <p className="mt-2 text-sm text-muted-foreground">Carregando países...</p>
                )}
                {countryError && (
                  <p className="mt-2 text-sm text-red-400">{countryError}</p>
                )}
                {!countryLoading && !countryError && countryOptions.length === 0 && (
                  <p className="mt-2 text-sm text-muted-foreground">Cadastre países de origem antes de relacionar valores.</p>
                )}
                {!countryLoading && !countryError && countryOptions.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {countryOptions.map((country) => {
                      const selected = selectedCountryIds.includes(country.id);

                      return (
                        <button
                          key={country.id}
                          type="button"
                          onClick={() => toggleNewValueCountry(country.id)}
                          className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                            selected
                              ? "border-primary bg-primary text-primary-foreground"
                              : "border-border bg-input text-foreground hover:border-primary"
                          }`}
                        >
                          {country.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </form>
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={toggleOrder}
                disabled={!selectedCategory}
                className="inline-flex items-center gap-2 text-base font-bold text-foreground hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                aria-label={order === "ASC" ? "Ordenar valores de Z-A" : "Ordenar valores de A-Z"}
              >
                {currentCategory?.name || "Selecione uma categoria"}
                {order === "ASC" ? <ArrowDownAZ className="h-4 w-4" /> : <ArrowUpAZ className="h-4 w-4" />}
              </button>
            </div>

            <label className="relative block sm:w-80">
              <span className="sr-only">Pesquisar valores</span>
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <input
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  rememberAdminOptionsSearchTerm(event.target.value);
                }}
                disabled={!selectedCategory}
                placeholder="Pesquisar valores desta categoria"
                className="h-11 w-full rounded-xl border border-border bg-input pl-11 pr-4 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
              />
            </label>
          </div>

          {!selectedCategory && (
            <div className="px-4 py-10 text-center">
              <p className="font-bold text-foreground">Selecione uma categoria</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Escolha uma lista para consultar e gerenciar os valores cadastrados.
              </p>
            </div>
          )}

          {selectedCategory && loading && (
            <div className="flex items-center justify-center gap-2 px-4 py-10 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Carregando opções...
            </div>
          )}

          {selectedCategory && !loading && error && (
            <div className="px-4 py-10 text-center text-red-400">
              {error}
            </div>
          )}

          {selectedCategory && !loading && !error && values.length === 0 && (
            <div className="px-4 py-10 text-center">
              <p className="font-bold text-foreground">
                {debouncedSearchTerm ? "Nenhum valor encontrado" : "Nenhum valor cadastrado"}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {debouncedSearchTerm
                  ? "Tente ajustar o termo pesquisado."
                  : "Adicione o primeiro valor para esta categoria."}
              </p>
            </div>
          )}

          {selectedCategory && !loading && !error && values.length > 0 && (
            <>
            <div className="divide-y divide-border">
              {values.map((value) => {
                const isEditing = editingId === value.id;
                const isDeleting = deletingId === value.id;
                const isSavingEdit = savingEditId === value.id;

                return (
                  <div
                    key={value.id}
                    className={`flex flex-col gap-3 px-4 py-3 sm:flex-row ${isEditing ? "sm:items-start" : "sm:items-center"}`}
                  >
                    <div className="min-w-0 flex-1">
                      {isEditing ? (
                        <div className="space-y-3">
                          <input
                            value={editingValue}
                            onChange={(event) => setEditingValue(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" && !isSavingEdit) {
                                event.preventDefault();
                                saveEditing(value);
                              }
                            }}
                            className="h-10 w-full rounded-lg border border-border bg-input px-3 text-base text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/40"
                            aria-label={`Editar ${value.label}`}
                          />
                          {isCountryDependentCategory && countryOptions.length > 0 && (
                            <div>
                              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">País de origem relacionado</p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                {countryOptions.map((country) => {
                                  const selected = editingCountryIds.includes(country.id);

                                  return (
                                    <button
                                      key={country.id}
                                      type="button"
                                      onClick={() => toggleEditingCountry(country.id)}
                                      className={`rounded-lg border px-3 py-2 text-sm font-bold transition-colors ${
                                        selected
                                          ? "border-primary bg-primary text-primary-foreground"
                                          : "border-border bg-input text-foreground hover:border-primary"
                                      }`}
                                    >
                                      {country.label}
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <p className="break-words text-base font-semibold text-foreground">{value.label}</p>
                          {isCountryDependentCategory && value.depends_on && value.depends_on.length > 0 && (
                            <p className="mt-1 text-xs font-semibold text-muted-foreground">
                              Países: {value.depends_on.map((dependency) => dependency.label).join(", ")}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className={`flex items-center gap-2 ${isEditing ? "sm:pt-0" : ""}`}>
                      {isEditing ? (
                        <>
                          <button
                            type="button"
                            onClick={() => saveEditing(value)}
                            disabled={isSavingEdit}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-primary-foreground hover:opacity-90 disabled:opacity-60"
                          >
                            {isSavingEdit ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                            Salvar
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="inline-flex h-10 items-center justify-center rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
                            aria-label="Cancelar edição"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => startEditing(value)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted"
                          >
                            <Edit3 className="h-4 w-4" />
                            Editar
                          </button>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => requestDelete(value)}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-500 px-3 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
                          >
                            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Excluir
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Exibindo {values.length} de {pagination.total} valores
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page === 1}
                  className="h-9 rounded-lg border border-border px-3 font-bold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Anterior
                </button>
                <span className="font-semibold text-foreground">
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                  disabled={page === totalPages}
                  className="h-9 rounded-lg border border-border px-3 font-bold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Próxima
                </button>
              </div>
            </div>
            </>
          )}
        </section>
      </div>

      {pendingDeleteValue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white">
                <Trash2 className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg font-bold text-foreground">Excluir valor</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Tem certeza que deseja excluir "{pendingDeleteValue.label}"? Esta ação não poderá ser desfeita.
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setPendingDeleteValue(null)}
                disabled={deletingId === pendingDeleteValue.id}
                className="h-11 rounded-lg border border-border px-4 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-60"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDeleteValue}
                disabled={deletingId === pendingDeleteValue.id}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-red-500 px-4 text-sm font-bold text-white hover:bg-red-600 disabled:opacity-60"
              >
                {deletingId === pendingDeleteValue.id && <Loader2 className="h-4 w-4 animate-spin" />}
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOptions;
