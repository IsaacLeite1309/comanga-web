import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SearchableSelect } from "@/components/forms/SearchableSelect";

const options = [
  { value: "jp", label: "Japão" },
  { value: "kr", label: "Coreia do Sul" },
];

describe("SearchableSelect", () => {
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
    fireEvent.keyDown(screen.getByPlaceholderText("Digite para buscar..."), { key: "Escape" });
    expect(screen.queryByPlaceholderText("Digite para buscar...")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tipo de obra" }));
    fireEvent.pointerDown(screen.getByRole("button", { name: "Fora" }));
    expect(screen.queryByPlaceholderText("Digite para buscar...")).not.toBeInTheDocument();
  });
});
