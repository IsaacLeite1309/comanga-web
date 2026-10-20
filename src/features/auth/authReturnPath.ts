function suffix(from: object, key: "search" | "hash", prefix: string) {
  const value = (from as Record<string, unknown>)[key];
  return typeof value === "string" && value.startsWith(prefix) ? value : "";
}
function unsafePath(pathname: string) {
  return !/^\/(?![\\/])/.test(pathname) || pathname.includes("\\")
    || [...pathname].some((character) => character.charCodeAt(0) < 32)
    || /^\/(entrar|cadastrar)(?:\/|$)/.test(pathname);
}
export function authReturnPath(state: unknown, fallback: string) {
  if (!state || typeof state !== "object" || !("from" in state)) return fallback;
  const from = state.from;
  if (!from || typeof from !== "object" || !("pathname" in from) || typeof from.pathname !== "string") return fallback;
  const pathname = from.pathname;
  if (unsafePath(pathname)) return fallback;
  const search = suffix(from, "search", "?");
  const hash = suffix(from, "hash", "#");
  return `${pathname}${search}${hash}`;
}
