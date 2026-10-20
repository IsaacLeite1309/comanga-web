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

  it("mantém a borda fina no hover e ao abrir filtros", () => {
    render(
      <SearchableSelect
        ariaLabel="Editora brasileira"
        value="jp"
        options={options}
        onChange={vi.fn()}
        searchable
        clearable
        focusStyle="border"
      />,
    );

    const selectedControl = screen.getByRole("button", { name: "Editora brasileira" }).parentElement;
    expect(selectedControl).toHaveClass("hover:border-primary", "rounded-lg");
    expect(selectedControl).toHaveClass("focus-within:border-primary");
    expect(selectedControl).not.toHaveClass("focus-within:ring-2");
    fireEvent.click(screen.getByRole("button", { name: "Editora brasileira" }));
    const openControl = screen.getByRole("textbox", { name: "Editora brasileira" }).parentElement;
    expect(openControl).toHaveClass("border-primary", "rounded-lg");
    expect(openControl).not.toHaveClass("border-sidebar-foreground/35");
    expect(openControl).not.toHaveClass("ring-2");
  });

  it("usa o tom do placeholder da pesquisa no texto de busca e lista vazia", () => {
    render(
      <SearchableSelect
        ariaLabel="Editora brasileira"
        value=""
        options={options}
        onChange={vi.fn()}
        searchable
        tone="sidebar"
        focusStyle="border"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Editora brasileira" }));
    const input = screen.getByPlaceholderText("Digite para buscar...");
    expect(input).toHaveClass("placeholder:text-muted-foreground");
    fireEvent.change(input, { target: { value: "inexistente" } });
    expect(screen.getByText("Nenhum resultado encontrado.")).toHaveClass("text-muted-foreground");
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

  it("desmarca uma opção selecionada ao clicar nela novamente", () => {
    const onChange = vi.fn();

    render(
      <SearchableSelect
        ariaLabel="País de origem"
        value="jp"
        options={options}
        onChange={onChange}
        searchable
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "País de origem" }));
    fireEvent.click(screen.getByRole("button", { name: "Japão" }));

    expect(onChange).toHaveBeenCalledWith("");
  });

  it("mantém a seleção quando a desseleção é desabilitada", () => {
    const onChange = vi.fn();

    render(
      <SearchableSelect
        ariaLabel="Perfil ativo"
        value="Administrador"
        options={[{ value: "Administrador", label: "Administrador" }]}
        onChange={onChange}
        deselectable={false}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Perfil ativo" }));
    fireEvent.click(screen.getByRole("button", { name: "Administrador" }));

    expect(onChange).toHaveBeenCalledWith("Administrador");
  });
});
