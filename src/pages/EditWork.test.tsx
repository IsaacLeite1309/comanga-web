import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditWork from "@/pages/EditWork";
import { api } from "@/services/api";
import { toast } from "sonner";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const workDetail = {
  work: {
    id: 10,
    slug: "naruto",
    title: "Naruto",
    originalTitle: "Naruto",
    coverUrl: "https://cdn.comanga.test/naruto.jpg",
    visibility: "Privado",
    type: { id: 1, label: "Mangá" },
    country: "Japão",
    authors: [
      {
        author: { id: 4, label: "Masashi Kishimoto" },
        roles: ["História e Arte"],
      },
    ],
  },
};

const editionsResponse = {
  editions: [
    {
      id: 20,
      workId: 10,
      chronologicalNumber: 1,
      coverUrl: "https://cdn.comanga.test/edicao.jpg",
      visibility: "Privado",
      brazilianPublisher: { id: 30, label: "Panini" },
      editionType: { id: 31, label: "Tankobon" },
      brazilPublicationStatus: "Completo",
      volumesCount: 0,
    },
  ],
  pagination: {
    total: 1,
  },
};

function renderEditWork() {
  return render(
    <MemoryRouter
      initialEntries={["/admin/editar-mangas/obras/naruto"]}
    >
      <Routes>
        <Route path="/admin/editar-mangas/obras/:workSlug" element={<EditWork />} />
        <Route path="/admin/editar-mangas/obras/:workSlug/editar" element={<div>Formulário de Obra</div>} />
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/nova" element={<div>Formulário de Edição</div>} />
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId" element={<div>Gerenciamento da Edição</div>} />
        <Route path="/admin/editar-mangas" element={<div>Listagem de Obras</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EditWork", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra a previa estatica da obra e suas edicoes em tabela", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });

    renderEditWork();

    expect(await screen.findByRole("heading", { name: "Naruto" })).toBeInTheDocument();
    expect(screen.getByText("Masashi Kishimoto")).toBeInTheDocument();
    expect(screen.getByText("Mangá")).toBeInTheDocument();
    expect(screen.getAllByText("1ª Edição")[0]).toBeInTheDocument();
    expect(screen.getAllByText("0 volumes")[0]).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /editar obra/i })).toHaveAttribute("href", "/admin/editar-mangas/obras/naruto/editar");
    expect(screen.getByRole("link", { name: /adicionar edição/i })).toHaveAttribute("href", "/admin/editar-mangas/obras/naruto/edicoes/nova");
    expect(screen.getByRole("link", { name: /gerenciar 1ª edição/i })).toHaveAttribute("href", "/admin/editar-mangas/obras/naruto/edicoes/20");
  });

  it("resolve a obra diretamente pelo slug quando a pagina e recarregada", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });

    renderEditWork();

    expect(await screen.findByRole("heading", { name: "Naruto" })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/admin/works/slug/naruto");
    expect(api.get).toHaveBeenCalledWith("/admin/works/10/editions", {
      params: { order: "DESC", page: 1, limit: 50 },
    });
    expect(api.get).not.toHaveBeenCalledWith("/admin/works", expect.anything());
  });

  it("volta para a listagem geral de obras", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });

    renderEditWork();

    fireEvent.click(await screen.findByRole("link", { name: /voltar/i }));

    expect(screen.getByText("Listagem de Obras")).toBeInTheDocument();
  });

  it("nao mostra paginacao da lista de obras enquanto carrega", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });

    renderEditWork();

    expect(screen.queryByText(/Exibindo/i)).not.toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole("heading", { name: "Naruto" })).toBeInTheDocument());
  });

  it("alterna para grade e mostra fallbacks de metadados", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { work: { ...workDetail.work, originalTitle: null, coverUrl: null } } })
      .mockResolvedValueOnce({
        data: {
          editions: [{
            ...editionsResponse.editions[0],
            coverUrl: null,
            brazilianPublisher: null,
            editionType: null,
            brazilPublicationStatus: { label: "Completo" },
            volumesCount: 1,
          }],
          pagination: { total: 1 },
        },
      });

    renderEditWork();
    await screen.findByRole("heading", { name: "Naruto" });
    expect(screen.getAllByText("1 volume").length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    expect(screen.getAllByText("Sem capa")).toHaveLength(2);
  });

  it("altera a visibilidade de uma edicao", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: { edition: { ...editionsResponse.editions[0], visibility: "Público" } },
    });

    renderEditWork();
    fireEvent.click(await screen.findByRole("button", { name: /alterar visibilidade da 1/i }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/admin/editions/20/visibility", { visibility: "Público" }));
    expect(toast.success).toHaveBeenCalledWith("Visibilidade da Edição atualizada com sucesso.");
  });

  it("exibe erro da API ao alterar visibilidade", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });
    vi.mocked(api.patch).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "A Obra precisa estar pública." } },
    });

    renderEditWork();
    fireEvent.click(await screen.findByRole("button", { name: /alterar visibilidade da 1/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("A Obra precisa estar pública."));
  });

  it("exclui uma edicao depois da confirmacao", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    renderEditWork();
    fireEvent.click(await screen.findByRole("button", { name: /excluir 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/admin/editions/20"));
    expect(toast.success).toHaveBeenCalledWith("Edição excluída com sucesso.");
    expect(screen.queryByText(/1.*edi/i)).not.toBeInTheDocument();
  });

  it("permite cancelar a exclusao da edicao", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });

    renderEditWork();
    fireEvent.click(await screen.findByRole("button", { name: /excluir 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(api.delete).not.toHaveBeenCalled();
    expect(screen.queryByRole("heading", { name: /excluir edi/i })).not.toBeInTheDocument();
  });

  it("exibe erro amigavel quando os dados da obra nao carregam", async () => {
    vi.mocked(api.get).mockRejectedValueOnce(new Error("Falha de rede"));

    renderEditWork();

    expect(await screen.findByText("Falha de rede")).toBeInTheDocument();
  });

  it("preserva a rota por slug e exibe o 404 seguro sem consultar Edições", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 404, data: { error: "Obra não encontrada." } },
    });

    renderEditWork();

    expect(await screen.findByText("Obra não encontrada.")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledTimes(1);
    expect(api.get).toHaveBeenCalledWith("/admin/works/slug/naruto");
  });
});
