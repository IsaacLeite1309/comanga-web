import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { updatePersonalVolumeCache } from "@/features/public-catalog/updatePersonalVolumeCache";
import type { PublicCalendarResponse } from "@/features/public-catalog/publicCatalogTypes";
import { PUBLIC_CATALOG_QUERY_ROOT } from "@/lib/queryClient";

const scope = ["reader", false, "Usuário Padrão"] as const;
const key = [...PUBLIC_CATALOG_QUERY_ROOT, scope, "calendar", { page: 1, month: 11 }, ""];
const change = { workSlug: "monster", editionId: 20, editionNumber: 1, volumeId: 30, volumeNumber: 1,
  previous: { owned: false, read: null, wished: false }, next: { owned: false, read: null, wished: true } };
function calendar(wished: boolean): PublicCalendarResponse {
  return { year: 2026, month: 11, pagination: { page: 1, limit: 24, total: 2, totalPages: 1 }, volumes: [
    { id: 30, number: 1, singleVolume: false, releaseDatePrecision: "Ano", personal: { owned: false, read: null, wished },
      edition: { id: 20, chronologicalNumber: 1, brazilianPublisher: { id: 1, label: "Editora" }, work: { id: 10, slug: "monster", title: "Monster" } } },
    { id: 31, number: 2, singleVolume: false, releaseDatePrecision: "Ano",
      edition: { id: 20, chronologicalNumber: 1, brazilianPublisher: { id: 1, label: "Editora" }, work: { id: 10, slug: "monster", title: "Monster" } } },
  ] };
}

describe("sincronização dos dados pessoais em lançamentos", () => {
  it.each([true, false])("atualiza todas as páginas e filtros do leitor ao definir desejado=%s", wished => {
    const client = new QueryClient();
    const filteredKey = [...PUBLIC_CATALOG_QUERY_ROOT, scope, "calendar", { page: 2, term: "Monster" }, ""];
    const otherUserKey = [...PUBLIC_CATALOG_QUERY_ROOT, ["other-reader", false, "Usuário Padrão"], "calendar"];
    const before = calendar(!wished);
    for (const cacheKey of [key, filteredKey, otherUserKey]) client.setQueryData(cacheKey, before);
    updatePersonalVolumeCache(client, scope, { ...change, previous: before.volumes[0].personal!, next: { ...change.next, wished } });
    for (const cacheKey of [key, filteredKey]) {
      const result = client.getQueryData<PublicCalendarResponse>(cacheKey)!;
      expect(result.volumes[0].personal?.wished).toBe(wished);
      expect(result.volumes[1]).toBe(before.volumes[1]);
      expect(result.pagination).toEqual(before.pagination);
    }
    expect(client.getQueryData(otherUserKey)).toEqual(before);
    client.clear();
  });

  it("impede uma resposta anterior em andamento de restaurar os desejos antigos", async () => {
    const client = new QueryClient();
    client.setQueryData(key, calendar(false));
    let resolve!: (data: PublicCalendarResponse) => void;
    const pending = new Promise<PublicCalendarResponse>(done => { resolve = done; });
    const fetching = client.fetchQuery({ queryKey: key, queryFn: () => pending, staleTime: 0 }).catch(() => undefined);
    updatePersonalVolumeCache(client, scope, change);
    resolve(calendar(false));
    await pending;
    await fetching;
    expect(client.getQueryData<PublicCalendarResponse>(key)?.volumes[0].personal?.wished).toBe(true);
    client.clear();
  });
});
