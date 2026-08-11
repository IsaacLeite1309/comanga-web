import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditMangas from "@/pages/EditMangas";
import { MemoryRouter } from "react-router-dom";
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

const workTypeOptions = {
  values: [{ id: 1, label: "Mangá" }],
};

const worksResponse = {
  works: [
    {
      id: 10,
      title: "Naruto",
      originalTitle: "Naruto",
      coverUrl: "https://cdn.comanga.test/naruto.jpg",
      visibility: "Privado",
      type: { id: 1, label: "Mangá" },
      country: "Japão",
      authors: [{ id: 4, label: "Masashi Kishimoto" }],
      editionsCount: 0,
    },
  ],
  pagination: {
    page: 1,
    limit: 8,
    total: 1,
    totalPages: 1,
  },
};

function mockInitialLoad(response = worksResponse) {
  vi.mocked(api.get)
    .mockResolvedValueOnce({ data: workTypeOptions })
    .mockResolvedValueOnce({ data: response });
}

function renderEditMangas() {
  return render(
    <MemoryRouter>
      <EditMangas />
    </MemoryRouter>
  );
}

describe("EditMangas", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("oculta rodape de paginacao enquanto a tabela carrega", () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => undefined));

    renderEditMangas();

    expect(screen.getByText("Carregando Obras...")).toBeInTheDocument();
    expect(screen.queryByText(/Exibindo/i)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /anterior/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /próxima/i })).not.toBeInTheDocument();
  });

  it("lista obras com capa, metadados e filtros iniciais", async () => {
    mockInitialLoad();

    renderEditMangas();

    expect(await screen.findByRole("heading", { name: /gerenciar mang.s/i })).toBeInTheDocument();
    expect((await screen.findAllByText("Naruto"))[0]).toBeInTheDocument();
    expect(screen.getByText("Masashi Kishimoto")).toBeInTheDocument();
    expect(screen.getAllByText("Japão")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Mangá")[0]).toBeInTheDocument();
    expect(screen.getByAltText("Capa de Naruto")).toHaveAttribute("src", "https://cdn.comanga.test/naruto.jpg");
    expect(screen.getByRole("link", { name: /gerenciar naruto/i })).toHaveAttribute("href", "/admin/editar-mangas/obras/Naruto");
    expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
      params: expect.objectContaining({ order: "ASC", page: 1, limit: 8 }),
    }));
    expect(api.get).toHaveBeenCalledWith("/admin/options/tipos-obra", {
      params: { order: "ASC", page: 1, limit: 100 },
    });
  });

  it("envia busca textual e alterna ordenacao por titulo", async () => {
    mockInitialLoad();
    vi.mocked(api.get).mockResolvedValue({ data: worksResponse });

    renderEditMangas();

    await screen.findAllByText("Naruto");

    fireEvent.change(screen.getByPlaceholderText("Buscar por título ou autor"), {
      target: { value: "nar" },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        params: expect.objectContaining({ term: "nar" }),
      }));
    });

    fireEvent.click(screen.getByRole("button", { name: /t.tulo/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        params: expect.objectContaining({ order: "DESC" }),
      }));
    });
  });

  it("altera visibilidade e atualiza a lista", async () => {
    mockInitialLoad();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: {
        work: {
          ...worksResponse.works[0],
          visibility: "Público",
        },
      },
    });

    renderEditMangas();

    await screen.findAllByText("Naruto");
    fireEvent.click(screen.getByRole("button", { name: /alterar visibilidade de naruto/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/admin/works/10/visibility", {
        visibility: "Público",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Visibilidade atualizada com sucesso.");
    expect(screen.getAllByText("Público")[0]).toBeInTheDocument();
  });

  it("exibe mensagem exata quando exclusao e recusada pela API", async () => {
    mockInitialLoad();
    vi.mocked(api.delete).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: "Essa Obra está pública, não pode ser excluída!",
        },
      },
    });

    renderEditMangas();

    await screen.findAllByText("Naruto");
    fireEvent.click(screen.getByRole("button", { name: /excluir naruto/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Essa Obra está pública, não pode ser excluída!");
    });
  });

  it("mostra estado vazio sem filtros", async () => {
    mockInitialLoad({
      works: [],
      pagination: { page: 1, limit: 8, total: 0, totalPages: 1 },
    });

    renderEditMangas();

    expect(await screen.findByText(/nenhuma obra cadastrada/i)).toBeInTheDocument();
    expect(screen.queryByText(/exibindo/i)).not.toBeInTheDocument();
  });

  it("mostra estado vazio especifico quando ha busca ativa", async () => {
    mockInitialLoad();
    vi.mocked(api.get).mockResolvedValue({
      data: { works: [], pagination: { page: 1, limit: 8, total: 0, totalPages: 1 } },
    });
    renderEditMangas();
    await screen.findAllByText("Naruto");

    fireEvent.change(screen.getByPlaceholderText("Buscar por título ou autor"), { target: { value: "inexistente" } });

    expect(await screen.findByText(/nenhuma obra encontrada com os filtros/i, {}, { timeout: 2000 })).toBeInTheDocument();
  });

  it("alterna para grade e renderiza fallbacks", async () => {
    mockInitialLoad({
      ...worksResponse,
      works: [{
        ...worksResponse.works[0],
        originalTitle: null,
        coverUrl: null,
        type: null,
        country: null,
        authors: [],
        editionsCount: 1,
        visibility: "Público",
      }],
    });
    renderEditMangas();

    await screen.findAllByText("Naruto");
    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    expect(screen.getByText("Sem capa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Naruto" })).toBeInTheDocument();
  });

  it("aplica filtros de tipo, pais e visibilidade", async () => {
    mockInitialLoad();
    vi.mocked(api.get).mockResolvedValue({ data: worksResponse });
    renderEditMangas();
    await screen.findAllByText("Naruto");

    fireEvent.click(screen.getByLabelText(/filtrar por tipo/i));
    fireEvent.click(screen.getByRole("button", { name: /^mangá$/i }));
    fireEvent.click(screen.getByLabelText(/filtrar por pa.s/i));
    fireEvent.click(screen.getByRole("button", { name: /^japão$/i }));
    fireEvent.click(screen.getByLabelText(/filtrar por visibilidade/i));
    fireEvent.click(screen.getByRole("button", { name: /^privado$/i }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
      params: expect.objectContaining({ typeId: 1, country: "Japão", visibility: "Privado" }),
    })));
  });

  it("exibe erros ao carregar filtros e obras", async () => {
    vi.mocked(api.get)
      .mockRejectedValueOnce(new Error("filtros"))
      .mockRejectedValueOnce({ isAxiosError: true, response: { data: { error: "Catálogo indisponível." } } });

    renderEditMangas();

    expect(await screen.findByText("Catálogo indisponível.")).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Erro ao carregar filtros de Obras.");
  });

  it("exibe erro padrao quando a visibilidade nao pode ser alterada", async () => {
    mockInitialLoad();
    vi.mocked(api.patch).mockRejectedValueOnce(new Error("falha"));
    renderEditMangas();

    fireEvent.click(await screen.findByRole("button", { name: /alterar visibilidade de naruto/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao alterar visibilidade da Obra."));
  });

  it("exclui obra e permite cancelar a confirmacao", async () => {
    mockInitialLoad();
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });
    renderEditMangas();

    fireEvent.click(await screen.findByRole("button", { name: /excluir naruto/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));
    expect(api.delete).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /excluir naruto/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/admin/works/10"));
    expect(toast.success).toHaveBeenCalledWith("Obra excluída com sucesso.");
  });

  it("navega entre paginas respeitando os limites", async () => {
    const firstPage = {
      ...worksResponse,
      pagination: { page: 1, limit: 8, total: 9, totalPages: 2 },
    };
    mockInitialLoad(firstPage);
    vi.mocked(api.get).mockResolvedValue({ data: { ...firstPage, pagination: { ...firstPage.pagination, page: 2 } } });
    renderEditMangas();

    await screen.findAllByText("Naruto");
    fireEvent.click(screen.getByRole("button", { name: /próxima/i }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
      params: expect.objectContaining({ page: 2 }),
    })));
    fireEvent.click(screen.getByRole("button", { name: /anterior/i }));
    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
      params: expect.objectContaining({ page: 1 }),
    })));
  });

});
