import { describe, expect, it } from "vitest";
import { api } from "@/services/api";

describe("api service", () => {
  it("configura axios para usar cookies de sessao stateful", () => {
    expect(api.defaults.withCredentials).toBe(true);
    expect(api.defaults.baseURL).toBeTruthy();
  });
});
