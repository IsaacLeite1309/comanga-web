export function publicWorkPath(workSlug: string) {
  return `/obra/${encodeURIComponent(workSlug)}`;
}

export function publicAuthorPath(authorSlug: string) {
  return `/autor/${encodeURIComponent(authorSlug)}`;
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
