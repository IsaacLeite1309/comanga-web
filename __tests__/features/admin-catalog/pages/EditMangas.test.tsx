import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetEditMangasMemoryForTests } from "@/features/admin-catalog/hooks/useEditMangasPage";
import EditMangas from "@/features/admin-catalog/pages/EditMangas";
import { MemoryRouter } from "react-router-dom";
import { api } from "@/services/api";
import { toast } from "sonner";
import { clearAdminCache } from "@/lib/queryClient";

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
      slug: "naruto",
      title: "Naruto",
      originalTitle: "Naruto",
      coverUrl: "https://cdn.comanga.test/naruto.jpg",
      visibility: "Privado",
      type: { id: 1, label: "Mangá" },

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

function mockPagedWorks(total: number) {
  vi.mocked(api.get).mockImplementation(async (url, config) => {
    if (url === "/admin/options/tipos-obra") return { data: workTypeOptions };
    const { page = 1, limit = 8 } = (config?.params as { page?: number; limit?: number } | undefined) ?? {};
    const start = (page - 1) * limit;
    return { data: {
      works: Array.from({ length: Math.min(limit, total - start) }, (_, i) => ({ ...worksResponse.works[0], id: start + i + 1, slug: `obra-${start + i + 1}`, title: `Obra ${start + i + 1}` })),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    } };
  });
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
    resetEditMangasMemoryForTests("list");
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

  it("começa pela grade com 24 obras e coloca Grade antes de Lista", async () => {
    resetEditMangasMemoryForTests();
    mockPagedWorks(30);
    renderEditMangas();
    await screen.findByText("Exibindo 24 de 30 Obras");
    const grid = screen.getByRole("button", { name: "Grade" });
    const list = screen.getByRole("button", { name: "Lista" });
    expect(grid).toHaveAttribute("aria-pressed", "true");
    expect(list).toHaveAttribute("aria-pressed", "false");
    expect(grid.nextElementSibling).toBe(list);
    expect(screen.getAllByRole("heading", { name: /^Obra \d+$/ })).toHaveLength(24);
  });

  it("lista obras com capa, metadados e filtros iniciais", async () => {
    mockInitialLoad();

    renderEditMangas();

    expect(await screen.findByRole("heading", { name: /gerenciar mang.s/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Nova obra" })).toHaveAttribute("href", "/admin/novo-manga");
    expect((await screen.findAllByText("Naruto"))[0]).toBeInTheDocument();
    expect(screen.getByText("Masashi Kishimoto")).toBeInTheDocument();
    expect(screen.queryByText("Japão")).not.toBeInTheDocument();
    expect(screen.getAllByText("Mangá")[0]).toBeInTheDocument();
    expect(screen.getByAltText("Capa de Naruto")).toHaveAttribute("src", "https://cdn.comanga.test/naruto.jpg");
    expect(screen.getByRole("link", { name: /editar naruto/i })).toHaveAttribute("href", "/admin/gerenciar-mangas/obras/naruto/editar");
    expect(screen.getByRole("link", { name: /gerenciar edições de naruto/i })).toHaveAttribute("href", "/admin/gerenciar-mangas/obras/naruto/edicoes");
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

  it("filtra por demografia, volta à primeira página e preserva a seleção ao retornar", async () => {
    mockInitialLoad({ ...worksResponse, pagination: { page: 1, limit: 8, total: 9, totalPages: 2 } });
    vi.mocked(api.get).mockResolvedValue({ data: worksResponse });
    const view = renderEditMangas();
    await screen.findAllByText("Naruto");
    fireEvent.click(screen.getByRole("button", { name: /próxima/i }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith("/admin/works", expect.objectContaining({ params: expect.objectContaining({ page: 2 }) })));
    fireEvent.click(screen.getByRole("button", { name: "Filtrar por demografia" }));
    fireEvent.click(screen.getByRole("button", { name: "Seinen" }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith("/admin/works", expect.objectContaining({ params: expect.objectContaining({ demography: "Seinen", page: 1 }) })));
    view.unmount();
    renderEditMangas();
    expect(screen.getByRole("button", { name: "Filtrar por demografia" })).toHaveTextContent("Seinen");
    clearAdminCache();
    fireEvent.click(screen.getByRole("button", { name: "Filtrar por demografia" }));
    fireEvent.click(screen.getByRole("button", { name: "Todas as demografias" }));
    await waitFor(() => expect(api.get).toHaveBeenLastCalledWith("/admin/works", expect.objectContaining({ params: expect.not.objectContaining({ demography: expect.anything() }) })));
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
    const fallbackResponse = {
      ...worksResponse,
      works: [{
        ...worksResponse.works[0],
        originalTitle: null,
        coverUrl: null,
        type: null,
        authors: [],
        editionsCount: 1,
        visibility: "Público",
      }],
    };
    mockInitialLoad(fallbackResponse);
    vi.mocked(api.get).mockResolvedValue({ data: fallbackResponse });
    renderEditMangas();

    await screen.findAllByText("Naruto");
    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    expect(await screen.findByText("Sem capa")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Naruto" })).toBeInTheDocument();
  });

  it("carrega até 24 obras por página na grade e mantém 8 na lista", async () => {
    mockPagedWorks(30);
    renderEditMangas();
    await screen.findByText("Exibindo 8 de 30 Obras");
    fireEvent.click(screen.getByRole("button", { name: /próxima/i }));
    await screen.findByRole("heading", { name: "Obra 9" });
    fireEvent.click(screen.getByRole("button", { name: "Grade" }));
    await screen.findByText("Exibindo 24 de 30 Obras");
    expect(screen.getAllByRole("heading", { name: /^Obra \d+$/ })).toHaveLength(24);
    expect(api.get).toHaveBeenLastCalledWith("/admin/works", expect.objectContaining({ params: expect.objectContaining({ page: 1, limit: 24 }) }));
    fireEvent.click(screen.getByRole("button", { name: /próxima/i }));
    await screen.findByText("Exibindo 6 de 30 Obras");
    expect(screen.getAllByRole("heading", { name: /^Obra \d+$/ })).toHaveLength(6);
    expect(screen.queryByRole("heading", { name: "Obra 1" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Lista" }));
    await screen.findByText("Exibindo 8 de 30 Obras");
    expect(screen.getAllByRole("heading", { name: /^Obra \d+$/ })).toHaveLength(8);
  });

  it("navega na grade pelos números e pelos pontos, respeitando a última página", async () => {
    mockPagedWorks(300);
    renderEditMangas();
    await screen.findByText("Exibindo 8 de 300 Obras");
    fireEvent.click(screen.getByRole("button", { name: "Grade" }));
    await screen.findByText("Exibindo 24 de 300 Obras");
    const navigation = screen.getByRole("navigation", { name: "Paginação de Obras" });
    expect(within(navigation).getByRole("button", { name: "Página anterior de Obras" })).toBeDisabled();
    fireEvent.click(within(navigation).getByRole("button", { name: "Página 3" }));
    await screen.findByRole("heading", { name: "Obra 49" });
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "auto" });
    fireEvent.click(screen.getByRole("button", { name: "Ir para outra página" }));
    const input = screen.getByRole("textbox", { name: "Número da página" });
    fireEvent.change(input, { target: { value: "999" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await screen.findByText("Exibindo 12 de 300 Obras");
    expect(api.get).toHaveBeenLastCalledWith("/admin/works", expect.objectContaining({ params: expect.objectContaining({ page: 13, limit: 24 }) }));
    expect(screen.getByRole("button", { name: "Próxima página de Obras" })).toBeDisabled();
  });

  it("usa o limite de 24 desde a primeira requisição na grade mobile", async () => {
    const originalMatchMedia = window.matchMedia;
    const media = vi.spyOn(window, "matchMedia").mockImplementation(query => ({ ...originalMatchMedia(query), matches: true }));
    try {
      mockInitialLoad(worksResponse);
      renderEditMangas();
      await screen.findByRole("heading", { name: "Naruto" });
      const workRequests = vi.mocked(api.get).mock.calls.filter(([url]) => url === "/admin/works");
      expect(workRequests).toHaveLength(1);
      expect(workRequests[0][1]).toEqual(expect.objectContaining({ params: expect.objectContaining({ page: 1, limit: 24 }) }));
    } finally { media.mockRestore(); }
  });

  it("aplica filtros de tipo e visibilidade sem país", async () => {
    mockInitialLoad();
    vi.mocked(api.get).mockResolvedValue({ data: worksResponse });
    renderEditMangas();
    await screen.findAllByText("Naruto");

    fireEvent.click(screen.getByLabelText(/filtrar por tipo/i));
    fireEvent.click(screen.getByRole("button", { name: /^mangá$/i }));
    fireEvent.click(screen.getByLabelText(/filtrar por visibilidade/i));
    fireEvent.click(screen.getByRole("button", { name: /^privado$/i }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
      params: expect.objectContaining({ typeId: 1, visibility: "Privado" }),
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
