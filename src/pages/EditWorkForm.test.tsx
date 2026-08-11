import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditWorkForm from "@/pages/EditWorkForm";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: { get: vi.fn() },
}));

vi.mock("@/pages/NewManga", () => ({
  default: ({ mode, workId, returnPath }: { mode: string; workId: string; returnPath: string }) => (
    <div>{`${mode}|${workId}|${returnPath}`}</div>
  ),
}));

function renderPage(withState = false, slug = "Jo%C3%A3o") {
  return render(
    <MemoryRouter initialEntries={[
      withState
        ? { pathname: `/admin/editar-mangas/obras/${slug}/editar`, state: { workId: 42 } }
        : `/admin/editar-mangas/obras/${slug}/editar`,
    ]}>
      <Routes>
        <Route path="/admin/editar-mangas/obras/:workSlug/editar" element={<EditWorkForm />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditWorkForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("usa o id recebido pela navegacao sem consultar a listagem", () => {
    renderPage(true, "Naruto");

    expect(screen.getByText("edit|42|/admin/editar-mangas/obras/Naruto")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("resolve o id por titulo normalizado ao recarregar a rota", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { works: [{ id: 7, title: "Joao" }] } });

    renderPage();

    expect(screen.getByText(/carregando dados da obra/i)).toBeInTheDocument();
    expect(await screen.findByText("edit|7|/admin/editar-mangas/obras/Jo%C3%A3o")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/admin/works", {
      params: { term: "João", order: "ASC", page: 1, limit: 50 },
    });
  });

  it("informa quando nenhuma obra corresponde ao titulo", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: { works: [] } });

    renderPage(false, "Inexistente");

    expect(await screen.findByText(/obra n.o encontrada/i)).toBeInTheDocument();
  });

  it("exibe erro amigavel quando a consulta falha", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("falha"));

    renderPage(false, "Inexistente");

    expect(await screen.findByText(/erro ao carregar obra para edi..o/i)).toBeInTheDocument();
  });
});
