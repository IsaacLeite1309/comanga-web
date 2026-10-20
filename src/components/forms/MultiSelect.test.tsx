import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MultiSelect } from "@/components/forms/MultiSelect";

const options = [
  { id: 1, label: "Shueisha" },
  { id: 2, label: "Shogakukan" },
  { id: 3, label: "Coamix" },
];

describe("MultiSelect", () => {
  it("alinha o rótulo aos demais filtros da mesma linha", () => {
    render(<MultiSelect label="Demografia" options={options} selectedIds={[]} onToggle={vi.fn()} />);
    expect(screen.getByText("Demografia")).toHaveClass("block", "text-xs");
  });

  it("mantém a borda fina no hover e no foco", () => {
    const { rerender } = render(
      <MultiSelect label="Gêneros" options={options} selectedIds={[]} onToggle={vi.fn()} focusStyle="border" />,
    );

    expect(screen.getByRole("button", { name: "Selecionar Gêneros" })).toHaveClass("rounded-lg", "hover:border-primary");
    expect(screen.getByRole("button", { name: "Selecionar Gêneros" })).toHaveClass("focus:border-primary");
    expect(screen.getByRole("button", { name: "Selecionar Gêneros" })).not.toHaveClass("focus:ring-2");

    rerender(<MultiSelect label="Gêneros" options={options} selectedIds={[]} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Selecionar Gêneros" })).toHaveClass("rounded-xl", "focus:border-primary");
    expect(screen.getByRole("button", { name: "Selecionar Gêneros" })).not.toHaveClass("focus:ring-2");
  });

  it("usa o tom do placeholder da pesquisa no texto de busca e lista vazia", () => {
    render(
      <MultiSelect
        label="Gêneros"
        options={options}
        selectedIds={[]}
        onToggle={vi.fn()}
        searchable
        tone="panel"
        focusStyle="border"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Selecionar Gêneros" }));
    const input = screen.getByPlaceholderText("Digite para buscar...");
    expect(input.parentElement).toHaveClass("border-primary");
    expect(input.parentElement).not.toHaveClass("border-sidebar-foreground/35");
    expect(input).toHaveClass("placeholder:text-muted-foreground");
    fireEvent.change(input, { target: { value: "inexistente" } });
    expect(screen.getByText("Nenhum resultado encontrado.")).toHaveClass("text-muted-foreground");
  });

  it("diminui o destaque do placeholder quando não há seleção", () => {
    render(
      <MultiSelect
        label="Gêneros"
        options={options}
        selectedIds={[]}
        onToggle={vi.fn()}
        placeholder="Todos"
        tone="panel"
      />,
    );

    expect(screen.getByText("Todos")).toHaveClass("text-muted-foreground");
  });

  it("mantém os defaults quando props opcionais são explicitamente undefined", () => {
    render(
      <MultiSelect
        label="Gêneros"
        options={[]}
        selectedIds={[]}
        onToggle={vi.fn()}
        emptyMessage={undefined}
        maxVisibleItems={undefined}
        placeholder={undefined}
        textSize={undefined}
        tone={undefined}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Selecionar Gêneros" });
    expect(trigger).toHaveTextContent("Selecione");
    expect(trigger).toHaveClass("text-base", "bg-input");
    fireEvent.click(trigger);

    const emptyMessage = screen.getByText("Nenhum valor cadastrado para esta lista.");
    expect(emptyMessage.parentElement).toHaveStyle({ maxHeight: "266px" });
  });

  it("filtra, seleciona e mantem a opcao selecionada disponivel", () => {
    const onToggle = vi.fn();
    const onClear = vi.fn();
    render(
      <MultiSelect
        label="Editoras originais"
        options={options}
        selectedIds={[1]}
        onToggle={onToggle}
        onClear={onClear}
        searchable
      />,
    );

    fireEvent.click(screen.getByLabelText(/selecionar editoras originais/i));
    expect(screen.getByRole("button", { name: "Limpar Editoras originais" })).toBeInTheDocument();
    const searchInput = screen.getByLabelText(/selecionar editoras originais/i);
    expect(searchInput).toHaveFocus();
    fireEvent.change(searchInput, {
      target: { value: "Shuei" },
    });

    expect(screen.getByRole("button", { name: "Shueisha" })).toHaveAttribute("title", "Shueisha");
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
