import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { InputField, SelectField, ToggleField } from "@/components/forms/FormFields";

describe("campos compartilhados de formulário", () => {
  it("mantém atributos numéricos e apresenta a validação contextual", () => {
    render(
      <InputField
        label="Preço de capa"
        value=""
        onChange={vi.fn()}
        type="number"
        step="0.01"
        required
        invalid
        errorMessage="Informe um valor válido."
      />,
    );

    const input = screen.getByRole("spinbutton", { name: /preço de capa/i });
    expect(input).toHaveAttribute("step", "0.01");
    expect(input).toHaveClass("border-red-500");
    expect(screen.getByText("Informe um valor válido.")).toBeInTheDocument();
  });

  it("expõe o toggle com semântica de switch", () => {
    const onChange = vi.fn();
    render(<ToggleField label="Volume único" checked={false} onChange={onChange} />);

    const toggle = screen.getByRole("switch", { name: "Volume único" });
    expect(toggle).toHaveAttribute("aria-checked", "false");
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("explica um seletor obrigatório incompatível sem permitir interação", () => {
    render(
      <SelectField
        label="Demografia"
        value=""
        onChange={vi.fn()}
        options={[]}
        required
        disabled
        invalid
        errorMessage="Preencha o campo obrigatório."
      />,
    );

    expect(screen.getByRole("button", { name: "Demografia" })).toBeDisabled();
    expect(screen.getByText("Incompatível")).toBeInTheDocument();
    expect(screen.getByText("Preencha o campo obrigatório.")).toBeInTheDocument();
  });
});
