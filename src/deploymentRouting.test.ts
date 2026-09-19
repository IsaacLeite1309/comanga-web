import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("roteamento da SPA na Vercel", () => {
  it("preserva chamadas da API e redireciona URLs profundas ao React Router", () => {
    const vercelConfig = JSON.parse(
      fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf8"),
    ) as { rewrites: Array<{ source: string; destination: string }> };

    expect(vercelConfig.rewrites[0]).toEqual({
      source: "/api/:path*",
      destination: "https://comanga-api.onrender.com/api/:path*",
    });
    expect(vercelConfig.rewrites.at(-1)).toEqual({
      source: "/(.*)",
      destination: "/index.html",
    });
  });
});
