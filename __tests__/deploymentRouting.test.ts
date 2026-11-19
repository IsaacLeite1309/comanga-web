import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const spaRewrite = { source: "/(.*)", destination: "/index.html" };

describe("roteamento da SPA na Vercel", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("VERCEL_TARGET_ENV", undefined);
    vi.stubEnv("VERCEL_ENV", undefined);
    vi.stubEnv("COMANGA_PREVIEW_API_ORIGIN", undefined);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("preserva o destino de produção e as URLs profundas da SPA", async () => {
    vi.stubEnv("VERCEL_ENV", "production");
    vi.stubEnv("COMANGA_PREVIEW_API_ORIGIN", "https://api-homologacao.example");
    const { config } = await import("../vercel");

    expect(config.buildCommand).toBeUndefined();
    assert("rewrites" in config);
    expect(config.rewrites).toEqual([
      { source: "/api/:path*", destination: "https://comanga-api.onrender.com/api/:path*" },
      spaRewrite,
    ]);
  });

  it("encaminha o Preview apenas para a homologação e força o cliente a usar /api", async () => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("COMANGA_PREVIEW_API_ORIGIN", "https://api-homologacao.example/");
    const { config } = await import("../vercel");

    expect(config.buildCommand).toBe("VITE_API_URL=/api npm run build");
    assert("rewrites" in config);
    expect(config.rewrites).toEqual([
      { source: "/api/:path*", destination: "https://api-homologacao.example/api/:path*" },
      spaRewrite,
    ]);
  });

  it.each(["preview", "homologacao", undefined])("publica a SPA estática e responde 503 localmente na API quando falta a origem em %s", async (environment) => {
    vi.stubEnv("VERCEL_TARGET_ENV", environment);

    const { config } = await import("../vercel");

    expect(config.buildCommand).toBe("VITE_API_URL=/api npm run build");
    expect(config).not.toHaveProperty("rewrites");
    assert("routes" in config);
    const [unavailable, ...spa] = config.routes;
    expect(unavailable).toEqual({ src: expect.any(String), status: 503, headers: { "Cache-Control": "no-store" } });
    const apiPath = new RegExp(unavailable.src!);
    expect(["/api", "/api/", "/api/auth/register/v1"].every(path => apiPath.test(path))).toBe(true);
    expect(["/apicultura", "/assets/app.js", "/termos-de-uso"].some(path => apiPath.test(path))).toBe(false);
    expect(spa).toEqual([{ handle: "filesystem" }, { src: "/(.*)", dest: "/index.html" }]);
  });

  it.each([
    "https://comanga-api.onrender.com",
    "https://comanga-api.onrender.com.:443/",
    "https://api-homologacao.example/api",
    "http://api-homologacao.example",
  ])("rejeita o destino incompatível de Preview %s", async (origin) => {
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("COMANGA_PREVIEW_API_ORIGIN", origin);

    await expect(import("../vercel")).rejects.toThrow("Configure COMANGA_PREVIEW_API_ORIGIN");
  });
});
