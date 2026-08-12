import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { CatalogVisibilityAction } from "@/components/catalog/CatalogVisibility";

describe("CatalogVisibilityAction", () => {
  it("representa item privado com cadeado e executa a acao", () => {
    const onClick = vi.fn();
    render(
      <CatalogVisibilityAction
        visibility="Privado"
        ariaLabel="Alterar visibilidade da Obra"
        onClick={onClick}
      />,
    );

    const button = screen.getByRole("button", { name: /alterar visibilidade da obra/i });
    expect(button).toHaveTextContent("Privado");
    fireEvent.click(button);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("mostra apenas o icone durante carregamento", () => {
    render(
      <CatalogVisibilityAction
        visibility="Público"
        ariaLabel="Alterar visibilidade"
        onClick={vi.fn()}
        loading
      />,
    );

    expect(screen.getByRole("button", { name: /alterar visibilidade/i })).toBeDisabled();
    expect(screen.queryByText("Público")).not.toBeInTheDocument();
  });
});
