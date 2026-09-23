import { Link } from "react-router-dom";
import { Calendar, DollarSign, FileText, Hash, Pencil } from "lucide-react";
import { VisibilityIcon } from "./CatalogVisibility";
import { visibilityActionClassName } from "./catalogVisibilityStyles";
import { DetailInfoBlock } from "./AdminCatalogDetailShared";
import { volumeEditAdminPath } from "../domain/catalogPaths";
import {
  formatPrice,
  formatReleaseDate,
  formatVolumeNumber,
  type VolumeDetail,
} from "../domain/adminCatalogDetails";

export function VolumeSummary({
  volume,
  workSlug,
  editionId,
  workId,
  stateEditionId,
}: {
  volume: VolumeDetail;
  workSlug: string;
  editionId: string;
  workId?: number;
  stateEditionId?: number;
}) {
  const label = formatVolumeNumber(volume.number, volume.singleVolume);

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid gap-5 p-4 sm:grid-cols-[180px_1fr] sm:p-5">
        <div className="mx-auto aspect-[2/3] w-40 overflow-hidden rounded-xl border border-border bg-input sm:mx-0 sm:w-full">
          {volume.coverUrl ? (
            <img src={volume.coverUrl} alt={`Capa do ${label}`} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm font-semibold text-muted-foreground">
              Sem capa
            </div>
          )}
        </div>
        <div className="flex min-w-0 flex-col">
          <div className="min-w-0">
            <h1 className="truncate text-3xl font-bold text-foreground">{label}</h1>
            <p className="mt-1 truncate text-lg font-semibold text-muted-foreground">
              {volume.isbn13 || volume.isbn10 || "ISBN não informado"}
            </p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailInfoBlock
              label="Páginas"
              value={volume.pages ? String(volume.pages) : "-"}
              icon={<FileText className="h-4 w-4" />}
            />
            <DetailInfoBlock
              label="Preço"
              value={formatPrice(volume.price, volume.priceCurrency || "R$")}
              icon={<DollarSign className="h-4 w-4" />}
            />
            <DetailInfoBlock
              label="Lançamento"
              value={formatReleaseDate(volume)}
              icon={<Calendar className="h-4 w-4" />}
            />
            <DetailInfoBlock
              label="ISBN-10"
              value={volume.isbn10 || "-"}
              icon={<Hash className="h-4 w-4" />}
            />
            <DetailInfoBlock
              label="ISBN-13"
              value={volume.isbn13 || "-"}
              icon={<Hash className="h-4 w-4" />}
            />
            <DetailInfoBlock
              label="Visibilidade"
              value={volume.visibility}
              badgeClassName={visibilityActionClassName(volume.visibility)}
              icon={<VisibilityIcon visibility={volume.visibility} />}
            />
          </div>
          {volume.synopsis && (
            <div className="mt-5 rounded-xl border border-border bg-input px-4 py-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Sinopse</p>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{volume.synopsis}</p>
            </div>
          )}
          <div className="mt-6 flex justify-end">
            <Link
              to={volumeEditAdminPath(workSlug, editionId, volume.number)}
              state={{ workId, editionId: stateEditionId || volume.editionId, volumeId: volume.id }}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition-opacity hover:opacity-90"
            >
              <Pencil className="h-4 w-4" />
              Editar Volume
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
