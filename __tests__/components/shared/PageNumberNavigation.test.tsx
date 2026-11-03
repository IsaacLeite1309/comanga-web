import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { PageNumberNavigation } from "@/components/shared/PageNumberNavigation";

it("permite abrir diretamente uma página visível", () => {
  const onPageChange = vi.fn();
  render(<PageNumberNavigation page={1} totalPages={11} onPageChange={onPageChange} />);

  expect(screen.getByRole("button", { name: "Página 1" })).toHaveAttribute("aria-current", "page");
  fireEvent.click(screen.getByRole("button", { name: "Página 3" }));
  expect(onPageChange).toHaveBeenCalledWith(3);
});

it("aceita apenas números inteiros no salto e limita à última página", () => {
  const onPageChange = vi.fn();
  render(<PageNumberNavigation page={1} totalPages={11} onPageChange={onPageChange} />);

  fireEvent.click(screen.getByRole("button", { name: "Ir para outra página" }));
  const input = screen.getByRole("textbox", { name: "Número da página" });
  fireEvent.change(input, { target: { value: "999abc" } });
  expect(input).toHaveValue("999");
  fireEvent.keyDown(input, { key: "Enter" });

  expect(onPageChange).toHaveBeenCalledWith(11);
  expect(screen.queryByRole("textbox", { name: "Número da página" })).not.toBeInTheDocument();
});

it("permite cancelar o salto sem mudar a página", () => {
  const onPageChange = vi.fn();
  render(<PageNumberNavigation page={6} totalPages={11} onPageChange={onPageChange} />);

  expect(screen.getAllByRole("button", { name: "Ir para outra página" })).toHaveLength(2);
  fireEvent.click(screen.getAllByRole("button", { name: "Ir para outra página" })[0]);
  const input = screen.getByRole("textbox", { name: "Número da página" });
  fireEvent.change(input, { target: { value: "4" } });
  fireEvent.keyDown(input, { key: "Escape" });

  expect(onPageChange).not.toHaveBeenCalled();
});
