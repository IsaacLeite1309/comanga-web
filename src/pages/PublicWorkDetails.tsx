import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, BookOpen, Box, Library } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { CatalogCover } from "@/features/public-catalog/CatalogCover";
import { getPublicWorkDetails } from "@/features/public-catalog/publicCatalogService";
import type {
  PublicEditionDetails,
  PublicOption,
  PublicVolumePreview,
  PublicWorkDetails as PublicWorkDetailsData,
} from "@/features/public-catalog/publicCatalogTypes";
import { LoadingState } from "@/components/shared/AsyncState";
import { getApiError } from "@/lib/apiError";
import { formatPublicReleaseDate, publicVolumeLabel } from "@/features/public-catalog/publicCatalogFormatters";

function optionLabels(options: PublicOption[]) {
  return options.map(({ label }) => label).join(", ");
}

function publicationPeriod(work: PublicWorkDetailsData) {
  const start = work.originalPublicationStartYear;
  const end = work.originalPublicationEndYear;
  if (start && end) return start === end ? String(start) : `${start}–${end}`;
  if (start) return `${start}–`;
  if (end) return String(end);
  return "Não informado";
}

function MetaItem({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}

function Tags({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
          {item}
        </span>
      ))}
    </div>
  );
}

function VolumePreview({ volume, workTitle }: { volume: PublicVolumePreview; workTitle: string }) {
  const label = publicVolumeLabel(volume);
  return (
    <article className="min-w-0">
      <CatalogCover
        key={volume.coverUrl || "empty"}
        src={volume.coverUrl}
        alt={`Capa de ${label} de ${workTitle}`}
      />
      <h4 className="mt-2 truncate text-sm font-bold text-foreground">{label}</h4>
      <p className="text-xs text-muted-foreground">{formatPublicReleaseDate(volume)}</p>
    </article>
  );
}

function volumesCount(total: number) {
  return `${total} ${total === 1 ? "Volume" : "Volumes"}`;
}

function EditionCard({ edition, workTitle }: { edition: PublicEditionDetails; workTitle: string }) {
  const label = `${edition.chronologicalNumber}ª Edição`;
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-5 p-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:p-5">
        <CatalogCover
          key={edition.coverUrl || "empty"}
          src={edition.coverUrl}
          alt={`Capa da ${label} de ${workTitle}`}
          className="w-full max-w-40 justify-self-center sm:max-w-none"
        />
        <div className="min-w-0">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="text-xl font-bold text-foreground">{label}</h3>
              <p className="mt-1 font-semibold text-primary">{edition.brazilianPublisher.label}</p>
            </div>
            <span className="rounded-full border border-border bg-input px-3 py-1 text-xs font-bold text-muted-foreground">
              {edition.brazilPublicationStatus}
            </span>
          </div>
          <dl className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <MetaItem label="Tipo" value={edition.editionType.label} />
            <MetaItem label="Formato" value={edition.format.label} />
            <MetaItem label="Acabamento" value={edition.coverType.label} />
            <MetaItem label="Total" value={volumesCount(edition.volumesCount)} />
          </dl>
          {edition.volumes.length > 0 ? (
            <section className="mt-5" aria-label={`Prévia de Volumes da ${label}`}>
              <h4 className="mb-3 text-sm font-bold text-foreground">Primeiros Volumes</h4>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:max-w-xl">
                {edition.volumes.map((volume) => (
                  <VolumePreview key={volume.id} volume={volume} workTitle={workTitle} />
                ))}
              </div>
            </section>
          ) : (
            <p className="mt-5 text-sm text-muted-foreground">Nenhum Volume público cadastrado.</p>
          )}
          <Link
            to={`/edicoes/${edition.id}`}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            Ver detalhes da {label}
          </Link>
        </div>
      </div>
    </article>
  );
}

function PublicWorkDetails() {
  const { slug = "" } = useParams();
  const [work, setWork] = useState<PublicWorkDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    getPublicWorkDetails(slug)
      .then((data) => {
        if (active) setWork(data);
      })
      .catch((requestError) => {
        if (!active) return;
        setWork(null);
        setError(getApiError(requestError, "Não foi possível carregar esta Obra."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [retry, slug]);

  if (loading) return <LoadingState message="Carregando Obra..." fullPage />;

  if (error || !work) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Obra indisponível</h1>
          <p className="mt-2 text-sm text-red-300">{error || "Obra não encontrada."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
              Tentar novamente
            </button>
            <Link to="/pesquisa?tab=works&sortBy=title&order=ASC&page=1" className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">
              Voltar à pesquisa
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Link to="/pesquisa?tab=works&sortBy=title&order=ASC&page=1" className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar à pesquisa
        </Link>

        <section className="mt-5 grid gap-7 rounded-2xl border border-border bg-card p-4 sm:p-6 md:grid-cols-[14rem_minmax(0,1fr)] lg:grid-cols-[18rem_minmax(0,1fr)]">
          <CatalogCover key={work.coverUrl || "empty"} src={work.coverUrl} alt={`Capa de ${work.title}`} eager className="w-full max-w-72 justify-self-center md:max-w-none" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-sm font-bold text-primary">
              <BookOpen className="h-4 w-4" aria-hidden="true" />
              <span>{work.type.label}</span>
              <span aria-hidden="true">·</span>
              <span>{work.country}</span>
            </div>
            <h1 className="mt-3 text-3xl font-bold text-foreground sm:text-4xl">{work.title}</h1>
            {work.originalTitle ? <p className="mt-1 text-lg font-semibold text-muted-foreground">{work.originalTitle}</p> : null}

            <section className="mt-6" aria-labelledby="authors-title">
              <h2 id="authors-title" className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Autoria</h2>
              <div className="mt-2 flex flex-wrap gap-3">
                {work.authors.map((author) => (
                  <div key={author.id} className="rounded-xl border border-border bg-input px-3 py-2">
                    <p className="text-sm font-bold text-foreground">{author.label}</p>
                    {author.roles.length > 0 ? <p className="text-xs text-muted-foreground">{author.roles.join(" · ")}</p> : null}
                  </div>
                ))}
              </div>
            </section>

            <dl className="mt-6 grid grid-cols-2 gap-x-5 gap-y-4 sm:grid-cols-3 lg:grid-cols-4">
              <MetaItem label="Publicação original" value={publicationPeriod(work)} />
              <MetaItem label="Status" value={work.originalPublicationStatus} />
              <MetaItem label="Volumes originais" value={work.originalVolumeCount} />
              <MetaItem label="Lançamento" value={work.directRelease ? "Direto" : "Serializado"} />
              <MetaItem label="Editoras originais" value={optionLabels(work.originalPublishers)} />
              <MetaItem label="Revistas" value={optionLabels(work.serializationMagazines)} />
            </dl>

            {work.demographics.length > 0 || work.genres.length > 0 ? (
              <div className="mt-6 space-y-3">
                {work.demographics.length > 0 ? <Tags items={work.demographics} /> : null}
                {work.genres.length > 0 ? <Tags items={work.genres.map(({ label }) => label)} /> : null}
              </div>
            ) : null}
          </div>
        </section>

        <section className="mt-9" aria-labelledby="editions-title">
          <div className="flex items-center gap-3">
            <Box className="h-6 w-6 text-primary" aria-hidden="true" />
            <div>
              <h2 id="editions-title" className="text-2xl font-bold text-foreground">Edições brasileiras</h2>
              <p className="text-sm text-muted-foreground">Publicações vinculadas a esta Obra</p>
            </div>
          </div>

          {work.editions.length > 0 ? (
            <div className="mt-5 space-y-5">
              {work.editions.map((edition) => (
                <EditionCard key={edition.id} edition={edition} workTitle={work.title} />
              ))}
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-border bg-card px-4 py-12 text-center">
              <Library className="mx-auto h-9 w-9 text-muted-foreground" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-muted-foreground">Nenhuma Edição pública cadastrada para esta Obra.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default PublicWorkDetails;
