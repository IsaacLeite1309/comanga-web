export function publicWorkPath(workSlug: string) {
  return `/obras/${encodeURIComponent(workSlug)}`;
}

export function publicEditionPath(workSlug: string, editionId: number | string) {
  return `${publicWorkPath(workSlug)}/edicao/${editionId}`;
}

export function publicVolumePath(
  workSlug: string,
  editionId: number | string,
  volumeId: number | string,
) {
  return `${publicEditionPath(workSlug, editionId)}/volume/${volumeId}`;
}
