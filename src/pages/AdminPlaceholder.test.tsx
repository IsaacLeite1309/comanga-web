import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import AdminPlaceholder from "@/pages/AdminPlaceholder";

describe("AdminPlaceholder", () => {
  it("exibe o titulo e informa que a funcionalidade esta em desenvolvimento", () => {
    render(<AdminPlaceholder title="Relatorios" />);

    expect(screen.getByRole("heading", { name: "Relatorios" })).toBeInTheDocument();
    expect(screen.getByText(/funcionalidade administrativa em desenvolvimento/i)).toBeInTheDocument();
  });
});
