export function publicWorkPath(workSlug: string) {
  return `/obras/${encodeURIComponent(workSlug)}`;
}

export function publicAuthorPath(authorSlug: string) {
  return `/autores/${encodeURIComponent(authorSlug)}`;
}

export function publicEditionPath(workSlug: string, editionNumber: number | string) {
  return `${publicWorkPath(workSlug)}/edicao/${editionNumber}`;
}

export function publicVolumePath(
  workSlug: string,
  editionNumber: number | string,
  volumeNumber: number | string,
) {
  return `${publicEditionPath(workSlug, editionNumber)}/volume/${volumeNumber}`;
}
