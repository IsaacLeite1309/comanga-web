export function workAdminPath(slug: string) {
  return `/admin/editar-mangas/obras/${encodeURIComponent(decodeURIComponent(slug))}`;
}

export function workEditAdminPath(slug: string) {
  return `${workAdminPath(slug)}/editar`;
}

export function editionAdminPath(workSlug: string, editionId: number | string) {
  return `${workAdminPath(workSlug)}/edicoes/${editionId}`;
}

export function newEditionAdminPath(workSlug: string) {
  return `${workAdminPath(workSlug)}/edicoes/nova`;
}

export function editionEditAdminPath(workSlug: string, editionId: number | string) {
  return `${editionAdminPath(workSlug, editionId)}/editar`;
}

export function volumeAdminPath(workSlug: string, editionId: number | string, volumeId: number | string) {
  return `${editionAdminPath(workSlug, editionId)}/volumes/${volumeId}`;
}

export function newVolumeAdminPath(workSlug: string, editionId: number | string) {
  return `${editionAdminPath(workSlug, editionId)}/volumes/novo`;
}

export function volumeEditAdminPath(
  workSlug: string,
  editionId: number | string,
  volumeId: number | string,
) {
  return `${volumeAdminPath(workSlug, editionId, volumeId)}/editar`;
}
