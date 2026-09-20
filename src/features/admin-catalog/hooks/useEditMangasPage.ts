import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import {
  COUNTRY_OPTIONS,
  FilterOption,
  OptionValue,
  WORKS_PAGE_SIZE,
  WorkFilterVisibility,
  WorksPagination,
  WorksResponse,
  WorkSummary,
  WorkTypeOptionsResponse,
  WorkVisibility,
} from "../pages/editMangasModel";

function useWorkFilters() {
  const [workTypes, setWorkTypes] = useState<OptionValue[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const [typeId, setTypeId] = useState("Todos");
  const [countryId, setCountryId] = useState("Todos");
  const [visibility, setVisibility] = useState<WorkFilterVisibility>("Todos");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [isMobileGrid, setIsMobileGrid] = useState(false);
  const [order, setOrder] = useState<"ASC" | "DESC">("ASC");
  const [page, setPage] = useState(1);

  useEffect(() => {
    async function loadFilterOptions() {
      try {
        const response = await api.get<WorkTypeOptionsResponse>("/admin/options/tipos-obra", {
          params: {
            order: "ASC",
            page: 1,
            limit: 100,
          },
        });
        setWorkTypes(response.data.values || []);
      } catch {
        toast.error("Erro ao carregar filtros de Obras.");
      }
    }
    void loadFilterOptions();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedTerm(searchTerm.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 767px)");
    const syncMobileView = () => setIsMobileGrid(mediaQuery.matches);
    syncMobileView();
    mediaQuery.addEventListener("change", syncMobileView);
    return () => mediaQuery.removeEventListener("change", syncMobileView);
  }, []);

  const typeFilterOptions = useMemo<FilterOption[]>(() => [
    { value: "Todos", label: "Todos os tipos" },
    ...workTypes.map((type) => ({ value: String(type.id), label: type.label })),
  ], [workTypes]);
  const countryFilterOptions = useMemo<FilterOption[]>(() => [
    { value: "Todos", label: "Todos os países" },
    ...COUNTRY_OPTIONS,
  ], []);
  const visibilityFilterOptions = useMemo<FilterOption[]>(() => (
    ["Todos", "Privado", "Público"].map((option) => ({
      value: option,
      label: option === "Todos" ? "Todas as visibilidades" : option,
    }))
  ), []);
  const requestParams = useMemo(() => ({
    ...(debouncedTerm ? { term: debouncedTerm } : {}),
    ...(typeId !== "Todos" ? { typeId: Number(typeId) } : {}),
    ...(countryId !== "Todos" ? { country: countryId } : {}),
    ...(visibility !== "Todos" ? { visibility } : {}),
    order,
    page,
    limit: WORKS_PAGE_SIZE,
  }), [countryId, debouncedTerm, order, page, typeId, visibility]);

  function changeCountry(value: string) {
    setCountryId(value);
    setPage(1);
  }

  function changeType(value: string) {
    setTypeId(value);
    setPage(1);
  }

  function changeVisibility(value: string) {
    setVisibility(value as WorkFilterVisibility);
    setPage(1);
  }

  function toggleTitleSort() {
    setOrder((current) => current === "ASC" ? "DESC" : "ASC");
    setPage(1);
  }

  return {
    changeCountry,
    changeType,
    changeVisibility,
    countryFilterOptions,
    countryId,
    debouncedTerm,
    isMobileGrid,
    order,
    page,
    requestParams,
    searchTerm,
    setPage,
    setSearchTerm,
    setViewMode,
    toggleTitleSort,
    typeFilterOptions,
    typeId,
    viewMode,
    visibility,
    visibilityFilterOptions,
  };
}

type Filters = ReturnType<typeof useWorkFilters>;

function useWorksData(filters: Filters) {
  const [works, setWorks] = useState<WorkSummary[]>([]);
  const [pagination, setPagination] = useState<WorksPagination>({
    page: 1,
    limit: WORKS_PAGE_SIZE,
    total: 0,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;
    async function loadWorks() {
      setLoading(true);
      setError("");
      try {
        const response = await api.get<WorksResponse>("/admin/works", {
          params: filters.requestParams,
        });
        if (!isMounted) return;
        setWorks(response.data.works);
        setPagination(response.data.pagination);
      } catch (loadError) {
        if (isMounted) setError(getApiError(loadError, "Erro ao listar Obras."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    void loadWorks();
    return () => {
      isMounted = false;
    };
  }, [filters.requestParams]);

  return {
    error,
    loading,
    pagination,
    setWorks,
    works,
  };
}

type WorksData = ReturnType<typeof useWorksData>;

function useWorkMutations(data: WorksData) {
  const [updatingVisibilityId, setUpdatingVisibilityId] = useState<number | null>(null);
  const [deletingWork, setDeletingWork] = useState<WorkSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  async function toggleVisibility(work: WorkSummary) {
    if (updatingVisibilityId) return;
    const visibility: WorkVisibility = work.visibility === "Público" ? "Privado" : "Público";
    setUpdatingVisibilityId(work.id);
    try {
      const response = await api.patch(`/admin/works/${work.id}/visibility`, { visibility });
      const updatedWork = response.data.work as WorkSummary;
      data.setWorks((current) => current.map((item) => (
        item.id === work.id ? { ...item, visibility: updatedWork.visibility } : item
      )));
      toast.success("Visibilidade atualizada com sucesso.");
    } catch (visibilityError) {
      toast.error(getApiError(visibilityError, "Erro ao alterar visibilidade da Obra."));
    } finally {
      setUpdatingVisibilityId(null);
    }
  }

  async function confirmDeleteWork() {
    if (!deletingWork || isDeleting) return;
    setIsDeleting(true);
    try {
      await api.delete(`/admin/works/${deletingWork.id}`);
      data.setWorks((current) => current.filter((work) => work.id !== deletingWork.id));
      toast.success("Obra excluída com sucesso.");
      setDeletingWork(null);
    } catch (deleteError) {
      toast.error(getApiError(deleteError, "Erro ao excluir Obra."));
    } finally {
      setIsDeleting(false);
    }
  }

  return {
    confirmDeleteWork,
    deletingWork,
    isDeleting,
    setDeletingWork,
    toggleVisibility,
    updatingVisibilityId,
  };
}

export function useEditMangasPage() {
  const filters = useWorkFilters();
  const data = useWorksData(filters);
  const mutations = useWorkMutations(data);
  const hasWorks = data.works.length > 0;
  const hasActiveFilters = Boolean(filters.debouncedTerm)
    || filters.typeId !== "Todos"
    || filters.countryId !== "Todos"
    || filters.visibility !== "Todos";
  const emptyWorksMessage = hasActiveFilters
    ? "Nenhuma Obra encontrada com os filtros aplicados."
    : "Nenhuma Obra cadastrada. Cadastre novas obras no menu Novo mangá.";
  const showPagination = !data.loading && !data.error && hasWorks;
  const showGridView = hasWorks
    && !data.loading
    && !data.error
    && (filters.isMobileGrid || filters.viewMode === "grid");

  return {
    ...filters,
    ...data,
    ...mutations,
    emptyWorksMessage,
    hasWorks,
    showGridView,
    showListView: !showGridView,
    showPagination,
  };
}

export type EditMangasPageModel = ReturnType<typeof useEditMangasPage>;
