import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { UnsavedChangesPrompt } from "./useUnsavedChangesWarning";

afterEach(() => vi.restoreAllMocks());

describe("proteção de alterações não salvas", () => {
  it("permite cancelar a saída e só retoma a navegação após confirmar", () => {
    render(<><UnsavedChangesPrompt when /><a href="/outra-pagina">Navegar</a></>);
    const link = screen.getByRole("link", { name: "Navegar" });
    fireEvent.click(link);
    expect(screen.getByText("Alterações não salvas")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continuar editando" }));
    expect(screen.queryByText("Alterações não salvas")).not.toBeInTheDocument();
    fireEvent.click(link);
    // Observe the resumed click without asking jsdom to navigate.
    const resumed = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener("click", resumed);
    fireEvent.click(screen.getByRole("button", { name: "Sair sem salvar" }));
    expect(resumed).toHaveBeenCalledOnce();
    expect(screen.queryByText("Alterações não salvas")).not.toBeInTheDocument();
  });

  it("bloqueia fechar a página somente enquanto há alterações", () => {
    const { rerender } = render(<UnsavedChangesPrompt when />);
    const dirty = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(dirty);
    expect(dirty.defaultPrevented).toBe(true);
    rerender(<UnsavedChangesPrompt when={false} />);
    const clean = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(clean);
    expect(clean.defaultPrevented).toBe(false);
  });

  it.each([
    ["#ancora", undefined, {}],
    ["/outra", "_blank", {}],
    ["https://example.com", undefined, {}],
    ["/outra", undefined, { ctrlKey: true }],
  ])("preserva navegação especial para %s", (href, target, options) => {
    render(<><UnsavedChangesPrompt when /><a href={href} target={target}>Navegar</a></>);
    const link = screen.getByRole("link", { name: "Navegar" });
    link.addEventListener("click", (event) => event.preventDefault());
    fireEvent.click(link, options);
    expect(screen.queryByText("Alterações não salvas")).not.toBeInTheDocument();
  });
});
