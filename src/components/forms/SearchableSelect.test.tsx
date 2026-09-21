import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "@/components/forms/SearchableSelect";

const options = [
  { value: "jp", label: "Japão" },
  { value: "kr", label: "Coreia do Sul" },
];

describe("SearchableSelect", () => {
  it("diminui o destaque do placeholder quando não há seleção", () => {
    render(
      <SearchableSelect
        ariaLabel="País de origem"
        value=""
        options={options}
        onChange={vi.fn()}
        placeholder="Todos"
        tone="sidebar"
      />,
    );

    expect(screen.getByText("Todos")).toHaveClass("text-muted-foreground");
  });

  it("mantém os defaults quando props opcionais são explicitamente undefined", () => {
    render(
      <SearchableSelect
        ariaLabel="País de origem"
        value=""
        options={[]}
        onChange={vi.fn()}
        allowEmptyOption={undefined}
        emptyMessage={undefined}
        maxVisibleItems={undefined}
        placeholder={undefined}
        textSize={undefined}
        tone={undefined}
      />,
    );

    const trigger = screen.getByRole("button", { name: "País de origem" });
    expect(trigger).toHaveTextContent("Selecione");
    expect(trigger).toHaveClass("text-base", "bg-input");
    fireEvent.click(trigger);

    const emptyMessage = screen.getByText("Nenhum resultado encontrado.");
    expect(screen.getByRole("button", { name: "Selecione" })).toBeInTheDocument();
    expect(emptyMessage.parentElement).toHaveStyle({ maxHeight: "266px" });
  });

  it("pesquisa, seleciona e fecha a lista com interacao consistente", () => {
    const onChange = vi.fn();

    render(
      <SearchableSelect
        ariaLabel="País de origem"
        value=""
        options={options}
        onChange={onChange}
        searchable
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "País de origem" }));
    fireEvent.change(screen.getByPlaceholderText("Digite para buscar..."), {
      target: { value: "coreia" },
    });

    expect(screen.queryByText("Japão")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Coreia do Sul" })).toHaveAttribute("title", "Coreia do Sul");
    fireEvent.click(screen.getByRole("button", { name: "Coreia do Sul" }));

    expect(onChange).toHaveBeenCalledWith("kr");
    expect(screen.queryByPlaceholderText("Digite para buscar...")).not.toBeInTheDocument();
  });

  it("fecha ao pressionar Escape e ao clicar fora", () => {
    render(
      <div>
        <SearchableSelect
          ariaLabel="Tipo de obra"
          value=""
          options={options}
          onChange={vi.fn()}
          searchable
        />
        <button type="button">Fora</button>
      </div>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Tipo de obra" }));
    const searchInput = screen.getByPlaceholderText("Digite para buscar...");
    expect(searchInput).toHaveFocus();
    fireEvent.keyDown(searchInput, { key: "Escape" });
    expect(screen.queryByPlaceholderText("Digite para buscar...")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tipo de obra" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByPlaceholderText("Digite para buscar...")).not.toBeInTheDocument();
  });

  it("desmarca uma opção selecionada quando o campo é alternável", () => {
    const onChange = vi.fn();

    render(
      <SearchableSelect
        ariaLabel="País de origem"
        value="jp"
        options={options}
        onChange={onChange}
        searchable
        clearable
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "País de origem" }));
    expect(screen.getByRole("button", { name: "Limpar País de origem" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Japão" }));

    expect(onChange).toHaveBeenCalledWith("");
  });
});
