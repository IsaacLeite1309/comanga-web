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

function renderPage(withState = false, slug = "joao") {
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

  it("usa o id recebido pela navegacao sem consultar a API", () => {
    renderPage(true, "naruto");

    expect(screen.getByText("edit|42|/admin/editar-mangas/obras/naruto")).toBeInTheDocument();
    expect(api.get).not.toHaveBeenCalled();
  });

  it("resolve o id diretamente pelo slug ao recarregar a rota", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: { work: { id: 7, slug: "joao", title: "João" } },
    });

    renderPage(false, "joao");

    expect(screen.getByText(/carregando dados da obra/i)).toBeInTheDocument();
    expect(await screen.findByText("edit|7|/admin/editar-mangas/obras/joao")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/admin/works/slug/joao");
  });

  it("informa quando o slug nao corresponde a uma obra", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { error: "Obra não encontrada." } },
    });

    renderPage(false, "inexistente");

    expect(await screen.findByText(/obra não encontrada/i)).toBeInTheDocument();
  });

  it("exibe erro amigavel quando a consulta falha", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("falha"));

    renderPage(false, "inexistente");

    expect(await screen.findByText(/erro ao carregar obra para edição/i)).toBeInTheDocument();
  });
});
