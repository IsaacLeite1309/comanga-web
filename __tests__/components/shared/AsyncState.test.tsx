import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EmptyState, LoadingState } from "@/components/shared/AsyncState";

describe("estados assíncronos compartilhados", () => {
  it("anuncia o carregamento para tecnologias assistivas", () => {
    render(<LoadingState message="Carregando Obras..." />);
    expect(screen.getByRole("status")).toHaveTextContent("Carregando Obras...");
  });

  it("centraliza o carregamento que ocupa a pagina", () => {
    render(<LoadingState message="Carregando dados da Obra..." fullPage />);

    expect(screen.getByRole("status")).toHaveClass("min-h-[calc(100dvh-5rem)]", "flex-1");
  });

  it("apresenta a mensagem de estado vazio", () => {
    render(<EmptyState message="Nenhuma Obra cadastrada." />);
    expect(screen.getByText("Nenhuma Obra cadastrada.")).toBeInTheDocument();
  });
});
