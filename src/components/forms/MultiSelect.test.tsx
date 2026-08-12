import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MultiSelect } from "@/components/forms/MultiSelect";

const options = [
  { id: 1, label: "Shueisha" },
  { id: 2, label: "Shogakukan" },
  { id: 3, label: "Coamix" },
];

describe("MultiSelect", () => {
  it("filtra, seleciona e mantem a opcao selecionada disponivel", () => {
    const onToggle = vi.fn();
    render(
      <MultiSelect
        label="Editoras originais"
        options={options}
        selectedIds={[1]}
        onToggle={onToggle}
        searchable
      />,
    );

    fireEvent.click(screen.getByLabelText(/selecionar editoras originais/i));
    fireEvent.change(screen.getByLabelText(/selecionar editoras originais/i), {
      target: { value: "Shuei" },
    });

    expect(screen.getByRole("button", { name: "Shueisha" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Shueisha" }));
    expect(onToggle).toHaveBeenCalledWith(1);
  });

  it("fecha com Enter sem alterar a selecao", () => {
    const onToggle = vi.fn();
    render(
      <MultiSelect
        label="Generos"
        options={options}
        selectedIds={[]}
        onToggle={onToggle}
        searchable
      />,
    );

    fireEvent.click(screen.getByLabelText(/selecionar generos/i));
    fireEvent.keyDown(screen.getByLabelText(/selecionar generos/i), { key: "Enter" });

    expect(screen.getByLabelText(/selecionar generos/i)).toHaveAttribute("aria-expanded", "false");
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("oferece controles de reordenacao para valores selecionados", () => {
    const onMove = vi.fn();
    render(
      <MultiSelect
        label="Editoras originais"
        options={options}
        selectedIds={[1, 2]}
        onToggle={vi.fn()}
        reorderable
        onMove={onMove}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /mover Shogakukan para cima/i }));
    expect(onMove).toHaveBeenCalledWith(1, 0);
  });
});
