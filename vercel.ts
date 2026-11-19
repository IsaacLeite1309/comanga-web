import { URL } from "node:url";

const productionApi = new URL("https://comanga-api.onrender.com");
const production = (process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV) === "production";

function previewApiOrigin(): string | undefined {
  const origin = process.env.COMANGA_PREVIEW_API_ORIGIN?.trim() || "";
  if (!origin) return undefined;
  const api = URL.canParse(origin) ? new URL(origin) : undefined;
  if (!api || api.protocol !== "https:" || api.username || api.password || api.pathname !== "/"
    || api.search || api.hash || api.hostname.replace(/\.$/, "") === productionApi.hostname) {
    throw new Error("Configure COMANGA_PREVIEW_API_ORIGIN com a origem HTTPS da API isolada de homologação.");
  }
  return api.origin;
}

const apiOrigin = production ? productionApi.origin : previewApiOrigin();

export const config = {
  ...(!production && { buildCommand: "VITE_API_URL=/api npm run build" }),
  ...(apiOrigin ? {
    rewrites: [
      { source: "/api/:path*", destination: `${apiOrigin}/api/:path*` },
      { source: "/(.*)", destination: "/index.html" },
    ],
  } : {
    routes: [
      { src: "^/api(?:/.*)?$", status: 503, headers: { "Cache-Control": "no-store" } },
      { handle: "filesystem" },
      { src: "/(.*)", dest: "/index.html" },
    ],
  }),
};
