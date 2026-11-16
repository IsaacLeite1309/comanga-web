import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLoadingScrollReset } from "@/hooks/useLoadingScrollReset";

describe("rolagem durante o carregamento público", () => {
  afterEach(() => vi.restoreAllMocks());

  it("volta ao topo uma vez por carregamento sem bloquear ou insistir na posição", () => {
    const scroll = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const { rerender } = renderHook(({ loading }) => useLoadingScrollReset(loading), { initialProps: { loading: false } });

    expect(scroll).not.toHaveBeenCalled();
    rerender({ loading: true });
    expect(scroll).toHaveBeenCalledExactlyOnceWith({ top: 0, behavior: "instant" });
    expect(document.documentElement.style.overflow).toBe(previousHtmlOverflow);
    expect(document.body.style.overflow).toBe(previousBodyOverflow);

    rerender({ loading: true });
    expect(scroll).toHaveBeenCalledTimes(1);
    rerender({ loading: false });
    expect(scroll).toHaveBeenCalledTimes(1);
    rerender({ loading: true });
    expect(scroll).toHaveBeenCalledTimes(2);
  });
});
