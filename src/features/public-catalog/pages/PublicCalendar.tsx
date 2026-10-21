import { useEffect, useRef, useState } from "react";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ArrowDownAZ, ArrowUpAZ, BookOpen, CalendarDays, ChevronLeft, ChevronRight, Heart, LibraryBig, LoaderCircle, Search } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/features/auth";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { EmptyState, FilteredEmptyState } from "@/components/shared/AsyncState";
import { addCollectionVolume, addWishlistVolume, CollectionChangeDialog, removeCollectionVolume, removeWishlistVolume, updateVolumeReading } from "@/features/personal-library";
import { getApiError } from "@/lib/apiError";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogResultsLoading } from "@/features/public-catalog/CatalogResultsLoading";
import { CatalogRefreshNotice } from "@/features/public-catalog/CatalogRefreshNotice";
import { useCatalogErrorToast } from "@/features/public-catalog/useCatalogErrorToast";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { publicVolumePath } from "@/features/public-catalog/publicCatalogPaths";
import { usePublicCatalogScope } from "@/features/public-catalog/usePublicCatalogScope";
import { updatePersonalVolumeCache } from "@/features/public-catalog/updatePersonalVolumeCache";
import type { PublicCalendarResponse, PublicCalendarVolume, PublicPersonalVolumeState } from "@/features/public-catalog/publicCatalogTypes";
import { usePublicCalendar, type CalendarState } from "./usePublicCalendar";
import { usePageScrollLock } from "@/hooks/usePageScrollLock";

const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-input px-3 text-sm font-bold text-foreground hover:border-primary focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";
const toolbarButtonClass = "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-sidebar-foreground/35 bg-sidebar px-3 text-sm font-bold text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";
const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

function isMonthNavigationDisabled(calendar: CalendarState, direction: -1 | 1) {
  return calendar.loading || !calendar.period || calendar.periodValue === (direction < 0 ? "1900-01" : "2200-12");
}

function isYearNavigationDisabled(loading: boolean, validYear: boolean, year: number, direction: -1 | 1) {
  return loading || !validYear || (direction < 0 ? year <= 1900 : year >= 2200);
}

function isMonthSelectionDisabled(loading: boolean, validYear: boolean) {
  return loading || !validYear;
}

function MonthSelect({ calendar }: { calendar: CalendarState }) {
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedYear = calendar.period?.year;
  const selectedMonth = calendar.period?.month;
  const yearNumber = Number(year);
  const validYear = /^\d{4}$/.test(year) && yearNumber >= 1900 && yearNumber <= 2200;

  useEffect(() => { setYear(selectedYear ? String(selectedYear) : ""); }, [selectedYear]);
  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative w-full min-w-0 sm:w-auto sm:shrink-0">
      <span className="block text-xs font-bold uppercase tracking-wide">Mês e ano</span>
      <div className={`mt-2 flex h-12 w-full items-stretch overflow-hidden rounded-lg border border-sidebar-foreground/35 bg-sidebar transition-colors hover:border-primary focus-within:border-primary sm:w-auto ${open ? "border-primary" : ""}`}>
        <button type="button" aria-label="Mês anterior" className="inline-flex w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40" disabled={isMonthNavigationDisabled(calendar, -1)} onClick={() => calendar.moveMonth(-1)}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Mês e ano" aria-expanded={open} aria-haspopup="dialog" disabled={calendar.loading || !calendar.period} onClick={() => setOpen(current => !current)} className="flex min-w-0 flex-1 items-center gap-2 px-3 text-sm font-bold text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
          <span className="grid min-w-0 text-left">
            <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">novembro de 2200</span>
            <span className="col-start-1 row-start-1 truncate">{calendar.period ? `${months[calendar.period.month - 1]} de ${calendar.period.year}` : "Carregando..."}</span>
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Próximo mês" className="inline-flex w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40" disabled={isMonthNavigationDisabled(calendar, 1)} onClick={() => calendar.moveMonth(1)}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div role="dialog" aria-label="Selecionar mês e ano" className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-sidebar-foreground/35 bg-sidebar p-3 text-foreground shadow-2xl">
          <div className="flex items-center justify-center gap-3 border-b border-border pb-3">
            <button type="button" aria-label="Ano anterior" disabled={isYearNavigationDisabled(calendar.loading, validYear, yearNumber, -1)} onClick={() => setYear(String(yearNumber - 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
            <input type="text" inputMode="numeric" maxLength={4} aria-label="Ano" value={year} disabled={calendar.loading} onChange={event => setYear(event.target.value.replace(/\D/g, ""))} className="h-8 w-20 rounded-md border border-transparent bg-transparent px-1 text-center text-sm font-bold text-foreground outline-none hover:border-border focus:border-primary disabled:cursor-not-allowed disabled:opacity-50" />
            <button type="button" aria-label="Próximo ano" disabled={isYearNavigationDisabled(calendar.loading, validYear, yearNumber, 1)} onClick={() => setYear(String(yearNumber + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          {!validYear && <p className="mt-2 text-xs text-red-300">Escolha um ano entre 1900 e 2200.</p>}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {months.map((month, index) => (
              <button key={month} type="button" aria-label={`Selecionar ${month} de ${year}`} aria-pressed={validYear && yearNumber === selectedYear && index + 1 === selectedMonth} disabled={isMonthSelectionDisabled(calendar.loading, validYear)} onClick={() => { calendar.changeMonth(`${year}-${String(index + 1).padStart(2, "0")}`); setOpen(false); }} className={`h-10 min-w-0 rounded-md px-1 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 ${validYear && yearNumber === selectedYear && index + 1 === selectedMonth ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"}`}>
                {month}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CalendarPeriod({ calendar }: { calendar: CalendarState }) {
  return (
    <div className="flex flex-wrap items-end gap-2 xl:shrink-0 xl:flex-nowrap">
      <MonthSelect calendar={calendar} />
      <button type="button" className={toolbarButtonClass} disabled={calendar.loading} onClick={calendar.currentMonth}>Mês atual</button>
    </div>
  );
}

function CalendarFilters({ calendar }: { calendar: CalendarState }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end">
      <form className="min-w-0 flex-1" onSubmit={event => { event.preventDefault(); calendar.updateFilters({ term: calendar.searchTerm.trim() }); }}>
        <label className="block min-w-0 text-xs font-bold uppercase tracking-wide">
          Pesquisar nos lançamentos
          <span className="relative mt-2 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
            <input type="search" aria-label="Pesquisar nos lançamentos" placeholder="Título, título original ou autor" maxLength={255} value={calendar.searchTerm} disabled={calendar.loading} onChange={event => calendar.setSearchTerm(event.target.value)} className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
          </span>
        </label>
      </form>
      <div className="min-w-0 sm:w-64 sm:shrink-0 xl:w-48 2xl:w-56">
        <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
        <SearchableSelect ariaLabel="Editora brasileira" value={calendar.query.brazilianPublisherId ? String(calendar.query.brazilianPublisherId) : ""} options={calendar.publishers} onChange={value => calendar.updateFilters({ brazilianPublisherId: value })} disabled={calendar.loading || calendar.optionsLoading || calendar.optionsError} placeholder="Todas" searchable clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
      </div>
    </div>
  );
}

function updateCalendarPersonalCache(queryClient: QueryClient, scope: readonly [string, boolean, string], volumeId: number, personal: PublicPersonalVolumeState) {
  queryClient.setQueriesData<PublicCalendarResponse>(
    { queryKey: [...PUBLIC_CATALOG_QUERY_ROOT, scope, "calendar"] },
    (response) => response ? {
      ...response,
      volumes: response.volumes.map((volume) => volume.id === volumeId ? { ...volume, personal } : volume),
    } : response,
  );
}

async function saveCalendarPersonalState({ queryClient, scope, volume, previous, operation, successMessage, errorMessage }: {
  queryClient: QueryClient;
  scope: readonly [string, boolean, string];
  volume: PublicCalendarVolume;
  previous: PublicPersonalVolumeState;
  operation: () => Promise<PublicPersonalVolumeState>;
  successMessage: string;
  errorMessage: string;
}) {
  try {
    const next = await operation();
    updatePersonalVolumeCache(queryClient, scope, {
      workSlug: volume.edition.work.slug,
      editionId: volume.edition.id,
      editionNumber: volume.edition.chronologicalNumber,
      volumeId: volume.id,
      volumeNumber: volume.number,
      previous,
      next,
    });
    updateCalendarPersonalCache(queryClient, scope, volume.id, next);
    toast.success(successMessage);
  } catch (error) {
    toast.error(getApiError(error, errorMessage));
  }
}

type CalendarActionButtonProps = {
  personal: PublicPersonalVolumeState;
  busy: boolean;
  busyAction: "collection" | "reading" | "wishlist" | null;
  label: string;
};

const calendarActionClass = "inline-flex h-10 min-w-0 items-center justify-center gap-1 rounded-lg border px-2 text-xs font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-60 sm:text-sm";
const calendarInactiveClass = "border-sidebar-foreground/30 bg-sidebar text-white hover:bg-sidebar-accent";
const calendarActiveClass = "border-primary bg-primary text-primary-foreground";

function CalendarCollectionButton({ personal, busy, busyAction, label, onClick }: CalendarActionButtonProps & { onClick: () => void }) {
  return (
    <button type="button" disabled={busy} aria-label={`${personal.owned ? "Remover" : "Adicionar"} ${label} ${personal.owned ? "da" : "à"} coleção`} aria-pressed={personal.owned} onClick={onClick} className={`${calendarActionClass} ${personal.owned ? calendarActiveClass : calendarInactiveClass}`}>
      {busy && busyAction === "collection" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LibraryBig className="h-4 w-4" fill={personal.owned ? "currentColor" : "none"} aria-hidden="true" />}
    </button>
  );
}

function CalendarReadingButton({ personal, busy, busyAction, label, onClick }: CalendarActionButtonProps & { onClick: () => void }) {
  return (
    <button type="button" disabled={busy} aria-label={`Marcar ${label} como ${personal.read ? "não lido" : "lido"}`} aria-pressed={personal.read ?? false} aria-disabled={!personal.owned} onClick={onClick} className={`${calendarActionClass} ${!personal.owned ? "cursor-not-allowed opacity-60" : ""} ${personal.read ? calendarActiveClass : calendarInactiveClass}`}>
      {busy && busyAction === "reading" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <BookOpen className="h-4 w-4" fill={personal.read ? "currentColor" : "none"} aria-hidden="true" />}
    </button>
  );
}

function CalendarWishlistButton({ personal, busy, busyAction, label, onClick }: CalendarActionButtonProps & { onClick: () => void }) {
  return (
    <button type="button" disabled={busy} aria-label={`${personal.wished ? "Remover" : "Adicionar"} ${label} ${personal.wished ? "da" : "à"} lista de desejos`} aria-pressed={personal.wished} aria-disabled={personal.owned} onClick={onClick} className={`${calendarActionClass} ${personal.owned ? "cursor-not-allowed opacity-60" : ""} ${personal.wished ? calendarActiveClass : calendarInactiveClass}`}>
      {busy && busyAction === "wishlist" ? <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Heart className="h-4 w-4" fill={personal.wished ? "currentColor" : "none"} aria-hidden="true" />}
    </button>
  );
}

function CalendarVolumeActionButtons({ personal, busy, busyAction, label, onCollectionClick, onReadingClick, onWishlistClick }: CalendarActionButtonProps & {
  onCollectionClick: () => void;
  onReadingClick: () => void;
  onWishlistClick: () => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-3 gap-2">
      <CalendarCollectionButton personal={personal} busy={busy} busyAction={busyAction} label={label} onClick={onCollectionClick} />
      <CalendarReadingButton personal={personal} busy={busy} busyAction={busyAction} label={label} onClick={onReadingClick} />
      <CalendarWishlistButton personal={personal} busy={busy} busyAction={busyAction} label={label} onClick={onWishlistClick} />
    </div>
  );
}

function CalendarVolumeActions({ volume }: { volume: PublicCalendarVolume }) {
  const queryClient = useQueryClient();
  const scope = usePublicCatalogScope();
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const [busyAction, setBusyAction] = useState<"collection" | "reading" | "wishlist" | null>(null);
  const [confirmingCollection, setConfirmingCollection] = useState(false);
  const personal = volume.personal ?? { owned: false, read: null, wished: false };
  const label = publicVolumeLabel(volume);

  async function updateCollection() {
    setBusy(true);
    setBusyAction("collection");
    setConfirmingCollection(false);
    const operation = personal.owned
      ? async () => { await removeCollectionVolume(volume.id); return { owned: false, read: null, wished: personal.wished }; }
      : () => addCollectionVolume(volume.id);
    await saveCalendarPersonalState({ queryClient, scope, volume, previous: personal, operation,
      successMessage: personal.owned ? "Volume removido da coleção." : "Volume adicionado à coleção.",
      errorMessage: "Não foi possível atualizar sua coleção." });
    setBusy(false);
    setBusyAction(null);
    setConfirmingCollection(false);
  }

  async function toggleWishlist() {
    setBusy(true);
    setBusyAction("wishlist");
    const operation = personal.wished
      ? async () => { await removeWishlistVolume(volume.id); return { owned: false, read: null, wished: false }; }
      : () => addWishlistVolume(volume.id);
    await saveCalendarPersonalState({ queryClient, scope, volume, previous: personal, operation,
      successMessage: personal.wished ? "Volume removido da lista de desejos." : "Volume adicionado à lista de desejos.",
      errorMessage: "Não foi possível atualizar sua lista de desejos." });
    setBusy(false);
    setBusyAction(null);
  }

  async function toggleReading() {
    if (!personal.owned) return;
    setBusy(true);
    setBusyAction("reading");
    await saveCalendarPersonalState({ queryClient, scope, volume, previous: personal,
      operation: () => updateVolumeReading(volume.id, !personal.read),
      successMessage: personal.read ? "Volume marcado como não lido." : "Volume marcado como lido.",
      errorMessage: "Não foi possível atualizar o estado de leitura." });
    setBusy(false);
    setBusyAction(null);
  }

  function handleCollectionClick() {
    if (!user) {
      toast.warning("Faça login para poder adicionar este volume à sua coleção.");
      return;
    }
    if (personal.owned && personal.read || !personal.owned && personal.wished) {
      setConfirmingCollection(true);
      return;
    }
    void updateCollection();
  }

  function handleWishlistClick() {
    if (personal.owned) {
      toast.warning("Remova o volume da coleção para adicioná-lo à lista de desejos.");
      return;
    }
    if (!user) {
      toast.warning("Faça login para poder adicionar este volume à sua lista de desejos.");
      return;
    }
    void toggleWishlist();
  }

  function handleReadingClick() {
    if (!personal.owned) {
      toast.warning("Adicione o volume à coleção para poder marcá-lo como lido.");
      return;
    }
    if (!user) {
      toast.warning("Faça login para atualizar sua coleção.");
      return;
    }
    void toggleReading();
  }

  return (
    <>
      <CalendarVolumeActionButtons personal={personal} busy={busy} busyAction={busyAction} label={label} onCollectionClick={handleCollectionClick} onReadingClick={handleReadingClick} onWishlistClick={handleWishlistClick} />
      {confirmingCollection && <CollectionChangeDialog
        wishlistVolumes={personal.wished && !personal.owned ? [label] : []}
        readVolumes={personal.owned && personal.read ? [label] : []}
        confirmLabel={personal.owned ? "Remover" : "Adicionar"}
        onCancel={() => setConfirmingCollection(false)}
        onConfirm={() => void updateCollection()}
      />}
    </>
  );
}

function CalendarVolumeCard({ volume }: { volume: PublicCalendarVolume }) {
  const location = useLocation();
  const { edition } = volume;
  const label = publicVolumeLabel(volume);
  return (
    <article className="min-w-0">
      <Link to={publicVolumePath(edition.work.slug, edition.chronologicalNumber, volume.number)} state={{ catalogOrigin: "checklist", returnTo: `${location.pathname}${location.search}` }} aria-label={`Ver ${label.toLowerCase()} de ${edition.work.title}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <CatalogCover key={volume.coverUrl || "empty"} src={volume.coverUrl} alt={`Capa de ${edition.work.title} — ${label}`} className="transition-transform group-hover:-translate-y-1" />
        <h3 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base" title={edition.work.title}>{edition.work.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{label} da {edition.chronologicalNumber}ª edição</p>
      </Link>
      <CalendarVolumeActions volume={volume} />
    </article>
  );
}

function CalendarSummary({ calendar, total }: { calendar: CalendarState; total: number }) {
  const SortIcon = calendar.query.order === "DESC" ? ArrowUpAZ : ArrowDownAZ;
  return (
    <div className="catalog-menu-divider-space flex min-h-5 items-center gap-3 text-sm text-primary" role="status">
      <span className="shrink-0">{total} {total === 1 ? "volume encontrado" : "volumes encontrados"}</span>
      <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
      <button type="button" onClick={calendar.toggleTitleSort} aria-label={calendar.query.order === "DESC" ? "Ordenar por título de A a Z" : "Ordenar por título de Z a A"} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
        Título <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span className="h-px flex-1 bg-border" aria-hidden="true" />
    </div>
  );
}

function CalendarResults({ calendar }: { calendar: CalendarState }) {
  if (calendar.loading) return (
    <>
      <div className="catalog-menu-divider-space flex min-h-5 items-center" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
      </div>
      <CatalogResultsLoading label="Carregando lançamentos..." className="catalog-menu-covers-space" cardActions="calendar" />
    </>
  );
  if (calendar.error) {
    return null;
  }
  if (!calendar.data) return null;
  const { volumes, pagination } = calendar.data;
  if (!volumes.length) {
    return (
      <>
        <CatalogRefreshNotice message={calendar.refreshError} onRetry={calendar.retryResults} />
        <CalendarSummary calendar={calendar} total={pagination.total} />
        <div className="catalog-menu-covers-space">
          {pagination.total === 0
            ? <FilteredEmptyState message="Nenhum volume encontrado neste mês com os filtros selecionados." onClear={calendar.resetCalendar} />
            : <>
              <EmptyState message="Nenhum volume nesta página. Consulte a primeira página para ver os resultados." />
              {calendar.query.page > 1 && <div className="flex justify-center px-4 pb-10"><button type="button" className={buttonClass} onClick={() => calendar.changePage(1)}>Voltar à primeira página</button></div>}
            </>}
        </div>
      </>
    );
  }
  return (
    <>
      <CatalogRefreshNotice message={calendar.refreshError} onRetry={calendar.retryResults} />
      <CalendarSummary calendar={calendar} total={pagination.total} />
      <section className="catalog-menu-covers-space grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label="Volumes encontrados neste mês">
        {volumes.map(volume => <CalendarVolumeCard key={volume.id} volume={volume} />)}
      </section>
      <CatalogPagination pagination={pagination} onPageChange={calendar.changePage} ariaLabel="Paginação dos lançamentos" />
    </>
  );
}

export default function PublicChecklist() {
  const calendar = usePublicCalendar();
  usePageScrollLock(calendar.loading);
  useCatalogErrorToast(calendar.error, calendar.validationError ? calendar.resetCalendar : calendar.retryResults, "calendar-results");
  useCatalogErrorToast(calendar.optionsError ? "Não foi possível carregar as editoras." : "", calendar.retryOptions, "calendar-publishers");
  return (
    <div className="page-gutter catalog-menu-top-space min-w-0 flex-1 pb-7 sm:pb-9">
      <div className="mx-auto w-full max-w-[100rem]">
        <h1 className="sr-only">Lançamentos</h1>
        <fieldset className="min-w-0 border-0 p-0">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
            <CalendarPeriod calendar={calendar} />
            <CalendarFilters calendar={calendar} />
          </div>
        </fieldset>
        <CalendarResults calendar={calendar} />
      </div>
    </div>
  );
}
