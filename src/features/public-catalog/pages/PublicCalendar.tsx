import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { SearchableSelect } from "@/components/forms/SearchableSelect";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { formatPublicReleaseDate, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";
import { publicVolumePath } from "@/features/public-catalog/publicCatalogPaths";
import type { PublicCalendarVolume } from "@/features/public-catalog/publicCatalogTypes";
import { usePublicCalendar, type CalendarState } from "./usePublicCalendar";

const buttonClass = "inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-input px-3 text-sm font-bold text-foreground hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-40";

function CalendarPeriod({ calendar }: { calendar: CalendarState }) {
  return (
    <div className="flex flex-wrap items-end gap-2">
      <button type="button" aria-label="Mês anterior" className={buttonClass} disabled={!calendar.period || calendar.periodValue === "1900-01"} onClick={() => calendar.moveMonth(-1)}>
        <ChevronLeft className="h-5 w-5" aria-hidden="true" />
      </button>
      <label className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide sm:flex-none">
        Mês e ano
        <input type="month" min="1900-01" max="2200-12" aria-label="Mês e ano" value={calendar.periodValue} onChange={event => calendar.changeMonth(event.target.value)} className="mt-2 block h-11 w-full rounded-lg border border-border bg-input px-3 text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
      </label>
      <button type="button" aria-label="Próximo mês" className={buttonClass} disabled={!calendar.period || calendar.periodValue === "2200-12"} onClick={() => calendar.moveMonth(1)}>
        <ChevronRight className="h-5 w-5" aria-hidden="true" />
      </button>
      <button type="button" className={buttonClass} onClick={calendar.currentMonth}>Mês atual</button>
    </div>
  );
}

function CalendarFilters({ calendar }: { calendar: CalendarState }) {
  const [term, setTerm] = useState(calendar.query.term ?? "");
  useEffect(() => { setTerm(calendar.query.term ?? ""); }, [calendar.query.term]);
  return (
    <div className="mt-6 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-[1fr_16rem]">
      <form className="flex min-w-0 items-end gap-2" onSubmit={event => { event.preventDefault(); calendar.updateFilters({ term: term.trim() }); }}>
        <label className="min-w-0 flex-1 text-xs font-bold uppercase tracking-wide">
          Pesquisar por título ou autor
          <input type="search" aria-label="Pesquisar no calendário" placeholder="Título, título original ou autor" maxLength={255} value={term} onChange={event => setTerm(event.target.value)} className="mt-2 block h-12 w-full rounded-xl border border-border bg-input px-3 text-sm font-semibold text-foreground outline-none focus:ring-2 focus:ring-primary" />
        </label>
        <button type="submit" className={`${buttonClass} h-12`} aria-label="Pesquisar"><Search className="h-5 w-5" aria-hidden="true" /></button>
      </form>
      <div className="min-w-0">
        <span className="text-xs font-bold uppercase tracking-wide">Editora brasileira</span>
        <SearchableSelect ariaLabel="Editora brasileira" value={calendar.query.brazilianPublisherId ? String(calendar.query.brazilianPublisherId) : ""} options={calendar.publishers} onChange={value => calendar.updateFilters({ brazilianPublisherId: value })} disabled={calendar.optionsLoading || calendar.optionsError} placeholder="Todas" searchable clearable allowEmptyOption={false} textSize="sm" />
        {calendar.optionsError ? <p role="alert" className="mt-2 text-sm text-red-300">Não foi possível carregar as editoras. <button type="button" className="underline" onClick={calendar.retryOptions}>Tentar carregar editoras</button></p> : null}
      </div>
      {(calendar.query.term || calendar.query.brazilianPublisherId) ? <button type="button" className="justify-self-start text-sm font-bold text-primary underline" onClick={calendar.clearFilters}>Limpar filtros</button> : null}
    </div>
  );
}

function CalendarVolumeCard({ volume }: { volume: PublicCalendarVolume }) {
  const { edition } = volume;
  const label = publicVolumeLabel(volume);
  return (
    <article className="min-w-0">
      <Link to={publicVolumePath(edition.work.slug, edition.chronologicalNumber, volume.number)} aria-label={`Ver ${label.toLowerCase()} de ${edition.work.title}`} className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-primary">
        <CatalogCover key={volume.coverUrl || "empty"} src={volume.coverUrl} alt={`Capa de ${edition.work.title} — ${label}`} />
        <h3 className="mt-2 truncate text-sm font-bold group-hover:text-primary" title={edition.work.title}>{edition.work.title}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{label} · {edition.chronologicalNumber}ª edição</p>
        <p className="mt-1 truncate text-xs text-muted-foreground">{edition.brazilianPublisher.label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{formatPublicReleaseDate(volume)}</p>
      </Link>
    </article>
  );
}

function CalendarResults({ calendar }: { calendar: CalendarState }) {
  if (calendar.loading) return <LoadingState message="Carregando calendário..." />;
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
        <EmptyState message={pagination.total > 0 ? "Nenhum Volume nesta página. Consulte a primeira página para ver os resultados." : "Nenhum Volume encontrado neste mês com os filtros selecionados."} />
        {calendar.query.page > 1 ? <div className="text-center"><button type="button" className={buttonClass} onClick={() => calendar.changePage(1)}>Voltar à primeira página</button></div> : null}
      </div>
    );
  }
  const groups = new Map<string, PublicCalendarVolume[]>();
  volumes.forEach(volume => {
    const group = volume.releaseDatePrecision === "Completa" && volume.releaseDay ? formatPublicReleaseDate(volume) : "Dia não informado";
    groups.set(group, [...(groups.get(group) ?? []), volume]);
  });
  return (
    <>
      <p className="mt-6 text-sm text-muted-foreground" role="status">{pagination.total} {pagination.total === 1 ? "Volume encontrado" : "Volumes encontrados"}</p>
      {Array.from(groups, ([date, items]) => (
        <section key={date} className="mt-7" aria-label={`Publicações: ${date}`}>
          <h2 className="mb-4 border-b border-border pb-2 text-lg font-bold">{date}</h2>
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">{items.map(volume => <CalendarVolumeCard key={volume.id} volume={volume} />)}</div>
        </section>
      ))}
      <CatalogPagination pagination={pagination} onPageChange={calendar.changePage} ariaLabel="Paginação do calendário" />
    </>
  );
}

export default function PublicCalendar() {
  const calendar = usePublicCalendar();
  return (
    <div className="min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <header className="mb-6 border-b border-border pb-6">
          <h1 className="flex items-center gap-3 text-3xl font-bold sm:text-4xl"><CalendarDays className="h-8 w-8 text-primary" aria-hidden="true" />Calendário</h1>
          <p className="mt-2 text-sm text-muted-foreground">Consulte as publicações por mês. Volumes sem dia definido aparecem em um grupo próprio.</p>
        </header>
        <CalendarPeriod calendar={calendar} />
        <CalendarFilters calendar={calendar} />
        <CalendarResults calendar={calendar} />
      </div>
    </div>
  );
}
