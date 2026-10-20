import { useEffect, useRef, useState } from "react";
import { ArrowDownAZ, ArrowUpAZ, CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { publicVolumePath } from "@/features/public-catalog/publicCatalogPaths";
import type { PublicCalendarVolume } from "@/features/public-catalog/publicCatalogTypes";
import { usePublicCalendar, type CalendarState } from "./usePublicCalendar";

const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-input px-3 text-sm font-bold text-foreground hover:border-primary focus-visible:border-primary focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40";
const toolbarButtonClass = "inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-sidebar-foreground/35 bg-sidebar px-3 text-sm font-bold text-foreground transition-colors hover:border-primary focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-40";
const months = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

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
        <button type="button" aria-label="Mês anterior" className="inline-flex w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40" disabled={!calendar.period || calendar.periodValue === "1900-01"} onClick={() => calendar.moveMonth(-1)}>
          <ChevronLeft className="h-5 w-5" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Mês e ano" aria-expanded={open} aria-haspopup="dialog" disabled={!calendar.period} onClick={() => setOpen(current => !current)} className="flex min-w-0 flex-1 items-center gap-2 px-3 text-sm font-bold text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none">
          <span className="grid min-w-0 text-left">
            <span className="invisible col-start-1 row-start-1 whitespace-nowrap" aria-hidden="true">novembro de 2200</span>
            <span className="col-start-1 row-start-1 truncate">{calendar.period ? `${months[calendar.period.month - 1]} de ${calendar.period.year}` : "Carregando..."}</span>
          </span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
        </button>
        <button type="button" aria-label="Próximo mês" className="inline-flex w-11 shrink-0 items-center justify-center text-foreground transition-colors hover:bg-sidebar-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40" disabled={!calendar.period || calendar.periodValue === "2200-12"} onClick={() => calendar.moveMonth(1)}>
          <ChevronRight className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div role="dialog" aria-label="Selecionar mês e ano" className="absolute inset-x-0 top-full z-50 mt-2 rounded-xl border border-sidebar-foreground/35 bg-sidebar p-3 text-foreground shadow-2xl">
          <div className="flex items-center justify-center gap-3 border-b border-border pb-3">
            <button type="button" aria-label="Ano anterior" disabled={!validYear || yearNumber <= 1900} onClick={() => setYear(String(yearNumber - 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"><ChevronLeft className="h-4 w-4" aria-hidden="true" /></button>
            <input type="text" inputMode="numeric" maxLength={4} aria-label="Ano" value={year} onChange={event => setYear(event.target.value.replace(/\D/g, ""))} className="h-8 w-20 rounded-md border border-transparent bg-transparent px-1 text-center text-sm font-bold text-foreground outline-none hover:border-border focus:border-primary" />
            <button type="button" aria-label="Próximo ano" disabled={!validYear || yearNumber >= 2200} onClick={() => setYear(String(yearNumber + 1))} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40"><ChevronRight className="h-4 w-4" aria-hidden="true" /></button>
          </div>
          {!validYear && <p className="mt-2 text-xs text-red-300">Escolha um ano entre 1900 e 2200.</p>}
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            {months.map((month, index) => (
              <button key={month} type="button" aria-label={`Selecionar ${month} de ${year}`} aria-pressed={validYear && yearNumber === selectedYear && index + 1 === selectedMonth} disabled={!validYear} onClick={() => { calendar.changeMonth(`${year}-${String(index + 1).padStart(2, "0")}`); setOpen(false); }} className={`h-10 min-w-0 rounded-md px-1 text-xs font-semibold capitalize transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-40 ${validYear && yearNumber === selectedYear && index + 1 === selectedMonth ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-sidebar-accent"}`}>
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
      <button type="button" className={toolbarButtonClass} onClick={calendar.currentMonth}>Mês atual</button>
    </div>
  );
}

function CalendarFilters({ calendar }: { calendar: CalendarState }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-end">
      <form className="min-w-0 flex-1" onSubmit={event => { event.preventDefault(); calendar.updateFilters({ term: calendar.searchTerm.trim() }); }}>
        <label className="block min-w-0 text-xs font-bold uppercase tracking-wide">
          Pesquisar
          <span className="relative mt-2 block">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground" aria-hidden="true" />
            <input type="search" aria-label="Pesquisar nos lançamentos" placeholder="Título, título original ou autor" maxLength={255} value={calendar.searchTerm} onChange={event => calendar.setSearchTerm(event.target.value)} className="catalog-search-input block h-12 w-full appearance-none rounded-lg border border-sidebar-foreground/35 bg-sidebar pl-12 pr-3 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-muted-foreground hover:border-primary focus:border-primary disabled:cursor-not-allowed disabled:opacity-60" />
          </span>
        </label>
      </form>
      <div className="min-w-0 sm:w-64 sm:shrink-0 xl:w-48 2xl:w-56">
        <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
        <SearchableSelect ariaLabel="Editora brasileira" value={calendar.query.brazilianPublisherId ? String(calendar.query.brazilianPublisherId) : ""} options={calendar.publishers} onChange={value => calendar.updateFilters({ brazilianPublisherId: value })} disabled={calendar.optionsLoading || calendar.optionsError} placeholder="Todas" searchable clearable allowEmptyOption={false} tone="sidebar" textSize="sm" focusStyle="border" />
        {calendar.optionsError ? <p role="alert" className="mt-2 text-sm text-red-300">Não foi possível carregar as editoras. <button type="button" className="underline" onClick={calendar.retryOptions}>Tentar carregar editoras</button></p> : null}
      </div>
    </div>
  );
}

function CalendarVolumeCard({ volume }: { volume: PublicCalendarVolume }) {
  const { edition } = volume;
  const label = publicVolumeLabel(volume);
  return (
    <article className="min-w-0">
      <Link to={publicVolumePath(edition.work.slug, edition.chronologicalNumber, volume.number)} state={{ catalogOrigin: "checklist" }} aria-label={`Ver ${label.toLowerCase()} de ${edition.work.title}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <CatalogCover key={volume.coverUrl || "empty"} src={volume.coverUrl} alt={`Capa de ${edition.work.title} — ${label}`} className="transition-transform group-hover:-translate-y-1" />
        <h3 className="mt-2 truncate text-sm font-normal text-foreground group-hover:text-primary sm:text-base" title={edition.work.title}>{edition.work.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{label} · {edition.chronologicalNumber}ª edição</p>
      </Link>
    </article>
  );
}

function CalendarResults({ calendar }: { calendar: CalendarState }) {
  if (calendar.loading) return (
    <>
      <div className="mt-7 flex min-h-5 items-center" aria-hidden="true">
        <span className="h-px flex-1 bg-border" />
      </div>
      <LoadingState message="Carregando lançamentos..." />
    </>
  );
  if (calendar.error) {
    return (
      <div role="alert" className="mt-6 rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
        <p className="mb-4 text-sm text-red-300">{calendar.error}</p>
        <button type="button" className={buttonClass} onClick={calendar.validationError ? calendar.resetCalendar : calendar.retryResults}>{calendar.validationError ? "Voltar ao mês atual" : "Tentar novamente"}</button>
      </div>
    );
  }
  if (!calendar.data) return null;
  const { volumes, pagination } = calendar.data;
  if (!volumes.length) {
    return (
      <div>
        <EmptyState message={pagination.total > 0 ? "Nenhum volume nesta página. Consulte a primeira página para ver os resultados." : "Nenhum volume encontrado neste mês com os filtros selecionados."} />
        {calendar.query.page > 1 ? <div className="text-center"><button type="button" className={buttonClass} onClick={() => calendar.changePage(1)}>Voltar à primeira página</button></div> : null}
      </div>
    );
  }
  const SortIcon = calendar.query.order === "DESC" ? ArrowUpAZ : ArrowDownAZ;
  return (
    <>
      <div className="mt-7 flex min-h-5 items-center gap-3 text-sm text-primary" role="status">
        <span className="shrink-0">{pagination.total} {pagination.total === 1 ? "volume encontrado" : "volumes encontrados"}</span>
        <span className="h-4 w-px shrink-0 bg-border" aria-hidden="true" />
        <button type="button" onClick={calendar.toggleTitleSort} aria-label={calendar.query.order === "DESC" ? "Ordenar por título de A a Z" : "Ordenar por título de Z a A"} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary">
          Título <SortIcon className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <span className="h-px flex-1 bg-border" aria-hidden="true" />
      </div>
      <section className="mt-6 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label="Volumes encontrados neste mês">
        {volumes.map(volume => <CalendarVolumeCard key={volume.id} volume={volume} />)}
      </section>
      <CatalogPagination pagination={pagination} onPageChange={calendar.changePage} ariaLabel="Paginação dos lançamentos" />
    </>
  );
}

export default function PublicChecklist() {
  const calendar = usePublicCalendar();
  return (
    <div className="min-w-0 flex-1 px-4 pb-7 pt-7 sm:px-6 sm:pb-9 xl:px-10">
      <div className="mx-auto w-full max-w-[100rem]">
        <h1 className="sr-only">Lançamentos</h1>
        <fieldset disabled={calendar.loading} className="min-w-0 border-0 p-0">
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
