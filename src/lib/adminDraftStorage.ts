const DRAFT_PREFIX = "comanga:admin-draft:v1:";
const rememberedDrafts = new Map<string, unknown>();

export function readAdminDraft<T>(key: string): T | null {
  const remembered = rememberedDrafts.get(key);
  if (remembered) return structuredClone(remembered) as T;
  try {
    const value = sessionStorage.getItem(`${DRAFT_PREFIX}${key}`);
    return value ? JSON.parse(value) as T : null;
  } catch {
    return null;
  }
}

export function writeAdminDraft(key: string, draft: unknown) {
  rememberedDrafts.set(key, structuredClone(draft));
  try {
    sessionStorage.setItem(`${DRAFT_PREFIX}${key}`, JSON.stringify(draft));
  } catch {
    // O rascunho continua disponível na memória enquanto a aba permanecer aberta.
  }
}

export function removeAdminDraft(key: string) {
  rememberedDrafts.delete(key);
  try {
    sessionStorage.removeItem(`${DRAFT_PREFIX}${key}`);
  } catch {
    // O armazenamento pode estar indisponível no navegador.
  }
}

export function clearAdminDraftStorage(prefix = "") {
  for (const key of rememberedDrafts.keys()) {
    if (key.startsWith(prefix)) rememberedDrafts.delete(key);
  }
  try {
    for (let index = sessionStorage.length - 1; index >= 0; index -= 1) {
      const key = sessionStorage.key(index);
      if (key?.startsWith(`${DRAFT_PREFIX}${prefix}`)) sessionStorage.removeItem(key);
    }
  } catch {
    // O armazenamento pode estar indisponível no navegador.
  }
}
