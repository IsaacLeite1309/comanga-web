import type { PublicPersonalSummary, PublicPersonalVolumeState } from "./publicCatalogTypes";

export function PersonalVolumeStatus({ personal }: { personal?: PublicPersonalVolumeState }) {
  if (!personal || (!personal.owned && !personal.wished)) return null;
  return (
    <p className="mt-1 text-xs font-semibold text-primary">
      {personal.owned ? `Na coleção · ${personal.read ? "Lido" : "Não lido"}` : "Na Lista de Desejos"}
    </p>
  );
}

export function PersonalCatalogSummary({ personal }: { personal?: PublicPersonalSummary }) {
  if (!personal) return null;
  return <p className="mt-2 text-sm font-semibold text-primary">Sua coleção: {personal.ownedCount} · Lidos: {personal.readCount} · Desejados: {personal.wishedCount}</p>;
}
