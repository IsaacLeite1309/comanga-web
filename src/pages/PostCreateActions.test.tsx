import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";
import PostCreateActions from "@/pages/PostCreateActions";

function renderPage(state?: Record<string, unknown>) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/admin/pos-cadastro", state }]}>
      <Routes>
        <Route path="/admin/pos-cadastro" element={<PostCreateActions />} />
        <Route path="/admin/editar-mangas" element={<div>Gerenciar mangas</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PostCreateActions", () => {
  it("redireciona quando nao recebe dados da operacao concluida", () => {
    renderPage();

    expect(screen.getByText("Gerenciar mangas")).toBeInTheDocument();
  });

  it("exibe titulo, descricao e duas acoes preservando o estado", () => {
    renderPage({
      title: "Volume cadastrado com sucesso",
      description: "Escolha o proximo passo.",
      actions: [
        { label: "Gerenciar este Volume", to: "/volumes/1", state: { volumeId: 1 } },
        { label: "Cadastrar novo Volume", to: "/volumes/novo" },
      ],
    });

    expect(screen.getByRole("heading", { name: "Volume cadastrado com sucesso!" })).toBeInTheDocument();
    expect(screen.getByText("Escolha o proximo passo.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /gerenciar este volume/i })).toHaveAttribute("href", "/volumes/1");
    expect(screen.getByRole("link", { name: /cadastrar novo volume/i })).toHaveAttribute("href", "/volumes/novo");
  });

  it("nao duplica exclamacao e aceita tres acoes sem descricao", () => {
    renderPage({
      title: "Obra cadastrada com sucesso!",
      actions: [
        { label: "Gerenciar esta Obra", to: "/obras/1" },
        { label: "Cadastrar nova Obra", to: "/obras/nova" },
        { label: "Cadastrar Edicao", to: "/edicoes/nova" },
      ],
    });

    expect(screen.getByRole("heading", { name: "Obra cadastrada com sucesso!" })).toBeInTheDocument();
    expect(screen.queryByText(/escolha o proximo passo/i)).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(3);
  });
});
