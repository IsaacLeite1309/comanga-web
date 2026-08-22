import { useEffect, useState } from "react";
import { AlertCircle, ArrowLeft, UserRound } from "lucide-react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";
import { CatalogPagination } from "@/features/public-catalog/CatalogPagination";
import { PublicWorkCard } from "@/features/public-catalog/PublicWorkCard";
import { getPublicAuthorWorks } from "@/features/public-catalog/publicCatalogService";
import type { PublicAuthorWorksResponse } from "@/features/public-catalog/publicCatalogTypes";
import { getApiError } from "@/lib/apiError";

const PAGE_SIZE = 24;
const CATALOG_PATH = "/pesquisa?tab=works&sortBy=title&order=ASC&page=1";

function positiveInteger(value: string | null, fallback = 1) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function worksCount(total: number) {
  return `${total} ${total === 1 ? "obra pública" : "obras públicas"}`;
}

function PublicAuthorWorks() {
  const { authorId = "" } = useParams();
  const numericAuthorId = Number(authorId);
  const [searchParams, setSearchParams] = useSearchParams();
  const page = positiveInteger(searchParams.get("page"));
  const [data, setData] = useState<PublicAuthorWorksResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    if (!Number.isInteger(numericAuthorId) || numericAuthorId <= 0) {
      setData(null);
      setError("Autor não encontrado.");
      setLoading(false);
      return () => { active = false; };
    }

    setLoading(true);
    setError("");
    getPublicAuthorWorks(numericAuthorId, {
      page,
      limit: PAGE_SIZE,
      sortBy: "title",
      order: "ASC",
    })
      .then((result) => {
        if (active) setData(result);
      })
      .catch((requestError) => {
        if (!active) return;
        setData(null);
        setError(getApiError(requestError, "Não foi possível carregar as Obras deste Autor."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, [numericAuthorId, page, retry]);

  const changePage = (nextPage: number) => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  if (loading) return <LoadingState message="Carregando Obras do Autor..." fullPage />;

  if (error || !data) {
    return (
      <div className="flex min-h-[calc(100dvh-5rem)] items-center justify-center px-4 py-12">
        <section className="w-full max-w-lg rounded-2xl border border-red-500/20 bg-red-500/5 px-6 py-10 text-center">
          <AlertCircle className="mx-auto h-9 w-9 text-red-400" aria-hidden="true" />
          <h1 className="mt-4 text-xl font-bold text-foreground">Autor indisponível</h1>
          <p className="mt-2 text-sm text-red-300">{error || "Autor não encontrado."}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => setRetry((value) => value + 1)} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Tentar novamente</button>
            <Link to={CATALOG_PATH} className="rounded-lg border border-border bg-input px-4 py-2 text-sm font-bold text-foreground">Voltar ao catálogo</Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-w-0 flex-1 px-4 py-7 sm:px-6 sm:py-9 xl:px-10">
      <div className="mx-auto w-full max-w-7xl">
        <Link to={CATALOG_PATH} className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Voltar ao catálogo
        </Link>

        <header className="mt-6 flex items-center gap-4 border-b border-border pb-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <UserRound className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-foreground sm:text-4xl">Mangás de {data.author.label}</h1>
            <p className="mt-1 text-sm font-medium text-muted-foreground">{worksCount(data.pagination.total)}</p>
          </div>
        </header>

        {data.works.length > 0 ? (
          <>
            <section className="mt-7 grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6" aria-label={`Obras de ${data.author.label}`}>
              {data.works.map((work) => <PublicWorkCard key={work.id} work={work} />)}
            </section>
            <CatalogPagination pagination={data.pagination} onPageChange={changePage} ariaLabel="Paginação das Obras do Autor" />
          </>
        ) : (
          <div className="mt-7 rounded-2xl border border-border bg-card">
            <EmptyState message="Nenhuma Obra pública disponível para este Autor." />
          </div>
        )}
      </div>
    </div>
  );
}

export default PublicAuthorWorks;
