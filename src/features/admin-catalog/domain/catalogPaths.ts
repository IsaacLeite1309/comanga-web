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

export function editionAdminPath(workSlug: string, editionId: number | string) {
  return `${workBaseAdminPath(workSlug)}/edicoes/${editionId}/volumes`;
}

export function newEditionAdminPath(workSlug: string) {
  return `${workBaseAdminPath(workSlug)}/edicoes/nova`;
}

export function editionEditAdminPath(workSlug: string, editionId: number | string) {
  return `${workBaseAdminPath(workSlug)}/edicoes/${editionId}/editar`;
}

export function volumeAdminPath(workSlug: string, editionId: number | string, volumeId: number | string) {
  return `${editionAdminPath(workSlug, editionId)}/${volumeId}`;
}

export function newVolumeAdminPath(workSlug: string, editionId: number | string) {
  return `${editionAdminPath(workSlug, editionId)}/novo`;
}

export function volumeEditAdminPath(
  workSlug: string,
  editionId: number | string,
  volumeId: number | string,
) {
  return `${volumeAdminPath(workSlug, editionId, volumeId)}/editar`;
}
