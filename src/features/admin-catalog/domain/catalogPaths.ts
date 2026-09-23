export const adminCatalogPath = "/admin/gerenciar-mangas";

function workBaseAdminPath(slug: string) {
  return `${adminCatalogPath}/obras/${encodeURIComponent(decodeURIComponent(slug))}`;
}

export function workAdminPath(slug: string) {
  return `${workBaseAdminPath(slug)}/edicoes`;
}

export function workEditAdminPath(slug: string) {
  return `${workBaseAdminPath(slug)}/editar`;
}

export function editionAdminPath(workSlug: string, editionNumber: number | string) {
  return `${workBaseAdminPath(workSlug)}/edicoes/${editionNumber}/volumes`;
}

export function newEditionAdminPath(workSlug: string) {
  return `${workBaseAdminPath(workSlug)}/edicoes/nova`;
}

export function editionEditAdminPath(workSlug: string, editionNumber: number | string) {
  return `${workBaseAdminPath(workSlug)}/edicoes/${editionNumber}/editar`;
}

export function volumeAdminPath(workSlug: string, editionNumber: number | string, volumeNumber: number | string) {
  return `${editionAdminPath(workSlug, editionNumber)}/${volumeNumber}`;
}

export function newVolumeAdminPath(workSlug: string, editionNumber: number | string) {
  return `${editionAdminPath(workSlug, editionNumber)}/novo`;
}

export function volumeEditAdminPath(
  workSlug: string,
  editionNumber: number | string,
  volumeNumber: number | string,
) {
  return `${volumeAdminPath(workSlug, editionNumber, volumeNumber)}/editar`;
}
