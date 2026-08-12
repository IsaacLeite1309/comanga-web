import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = process.cwd();
const packageJson = JSON.parse(
  readFileSync(resolve(projectRoot, "package.json"), "utf8"),
) as {
  dependencies: Record<string, string>;
};

describe("toolchain do frontend", () => {
  it("mantem o npm como unica fonte de resolucao das dependencias", () => {
    expect(existsSync(`${projectRoot}/package-lock.json`)).toBe(true);
    expect(existsSync(`${projectRoot}/bun.lock`)).toBe(false);

    const workflow = readFileSync(
      resolve(projectRoot, ".github/workflows/quality.yml"),
      "utf8",
    );

    expect(workflow).toContain("cache: npm");
    expect(workflow).toContain("run: npm ci");
  });

  it("nao declara dependencias abandonadas", () => {
    expect(packageJson.dependencies).not.toHaveProperty(
      "class-variance-authority",
    );
    expect(packageJson.dependencies).not.toHaveProperty(
      "@radix-ui/react-tooltip",
    );
    expect(packageJson.dependencies).not.toHaveProperty(
      "tailwindcss-animate",
    );
  });
});
