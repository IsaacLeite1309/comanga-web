import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AdminOptions from "@/pages/AdminOptions";
import { resetAdminOptionsMemoryForTests } from "@/pages/adminOptionsMemory";
import { api } from "@/services/api";
import { toast } from "sonner";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
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

function mockOptionsResponse(values = [
  {
    id: 1,
    label: "Ação",
    category: {
      slug: "generos",
      name: "Gêneros",
    },
  },
], paginationOverrides = {}) {
  vi.mocked(api.get).mockResolvedValueOnce({
    data: {
      category: {
        slug: "generos",
        name: "Gêneros",
      },
      values,
      pagination: {
        page: 1,
        limit: 6,
        total: values.length,
        totalPages: Math.max(1, Math.ceil(values.length / 6)),
        ...paginationOverrides,
      },
    },
  });
}

function selectCategory(name: RegExp = /g.neros/i) {
  fireEvent.click(screen.getByLabelText(/selecionar categoria/i));
  fireEvent.click(screen.getByRole("button", { name }));
}

function selectForm(name: RegExp) {
  fireEvent.click(screen.getByLabelText(/selecionar formulário/i));
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("AdminOptions", () => {
  beforeEach(() => {
    resetAdminOptionsMemoryForTests();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
    vi.clearAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("consulta e exibe valores da categoria selecionada", async () => {
    mockOptionsResponse();

    render(<AdminOptions />);
    selectCategory();

    expect(screen.getByText("Carregando opções...")).toBeInTheDocument();
    expect(await screen.findByText("Ação")).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/admin/options/generos", {
      params: {
        order: "ASC",
        page: 1,
        limit: 6,
      },
    });
  });

  it("usa 5 valores por pagina nas categorias vinculadas a pais", async () => {
    mockOptionsResponse([], {
      limit: 5,
      total: 0,
      totalPages: 1,
    });
    mockOptionsResponse([
      {
        id: 20,
        label: "Japão",
        category: {
          slug: "paises-origem",
          name: "País de Origem",
        },
      },
    ], {
      limit: 100,
      total: 1,
      totalPages: 1,
    });

    render(<AdminOptions />);
    selectCategory(/tipo de obra/i);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/options/tipos-obra", {
        params: {
          order: "ASC",
          page: 1,
          limit: 5,
        },
      });
    });
  });

  it("troca categoria e busca nova lista", async () => {
    mockOptionsResponse([]);
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        category: {
          slug: "generos",
          name: "Gêneros",
        },
        values: [],
        pagination: {
          page: 1,
          limit: 6,
          total: 0,
          totalPages: 1,
        },
      },
    });

    render(<AdminOptions />);

    fireEvent.click(screen.getByLabelText(/selecionar categoria/i));
    fireEvent.click(screen.getByRole("button", { name: /g.neros/i }));

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/options/generos", {
        params: {
          order: "ASC",
          page: 1,
          limit: 6,
        },
      });
    });
  });

  it("cadastra novo valor e exibe toast de sucesso", async () => {
    mockOptionsResponse([]);
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        value: {
          id: 2,
          label: "Comédia",
          category: {
            slug: "generos",
            name: "Gêneros",
          },
        },
      },
    });
    mockOptionsResponse([
      {
        id: 2,
        label: "Comédia",
        category: {
          slug: "generos",
          name: "Gêneros",
        },
      },
    ]);

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Nenhum valor cadastrado");
    fireEvent.change(screen.getByPlaceholderText(/Adicionar em Gêneros/i), {
      target: { value: "Comédia" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/options", {
        category: "generos",
        label: "Comédia",
      });
    });
    expect(await screen.findByText(/com.*dia/i)).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Valor cadastrado com sucesso.");
  });

  it("cadastra multiplos valores separados por virgula e exibe toast no plural", async () => {
    mockOptionsResponse([]);
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        values: [
          {
            id: 2,
            label: "Comédia",
            category: {
              slug: "generos",
              name: "Gêneros",
            },
          },
          {
            id: 3,
            label: "Drama",
            category: {
              slug: "generos",
              name: "Gêneros",
            },
          },
        ],
      },
    });
    mockOptionsResponse([
      {
        id: 2,
        label: "Comédia",
        category: {
          slug: "generos",
          name: "Gêneros",
        },
      },
      {
        id: 3,
        label: "Drama",
        category: {
          slug: "generos",
          name: "Gêneros",
        },
      },
    ]);

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Nenhum valor cadastrado");
    fireEvent.change(screen.getByPlaceholderText(/Adicionar em Gêneros/i), {
      target: { value: "Comédia, Drama" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/options", {
        category: "generos",
        label: "Comédia, Drama",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Valores cadastrados com sucesso.");
  });

  it("preserva virgula decimal como parte do valor na categoria formato", async () => {
    mockOptionsResponse([]);
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        value: {
          id: 4,
          label: "13,7 x 20 cm",
          category: {
            slug: "formatos-fisicos",
            name: "Formato",
          },
        },
      },
    });
    mockOptionsResponse([
      {
        id: 4,
        label: "13,7 x 20 cm",
        category: {
          slug: "formatos-fisicos",
          name: "Formato",
        },
      },
    ]);

    render(<AdminOptions />);
    selectForm(/edição/i);
    selectCategory(/formato/i);

    await screen.findByText("Nenhum valor cadastrado");
    expect(screen.getByText(/vírgulas fazem parte do valor/i)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Adicionar em Formato/i), {
      target: { value: "13,7 x 20 cm" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/options", {
        category: "formatos-fisicos",
        label: "13,7 x 20 cm",
      });
    });
    expect(toast.success).toHaveBeenCalledWith("Valor cadastrado com sucesso.");
  });

  it("exibe erro contextual quando novo valor esta vazio", async () => {
    mockOptionsResponse([]);

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Nenhum valor cadastrado");
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    expect(screen.getByText("Informe o texto do novo valor.")).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });

  it("exibe erro exato da API ao cadastrar valor duplicado", async () => {
    mockOptionsResponse([]);
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: {
          error: "Essa lista já tem esse valor cadastrado!",
        },
      },
    });

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Nenhum valor cadastrado");
    fireEvent.change(screen.getByPlaceholderText(/Adicionar em Gêneros/i), {
      target: { value: "Ação" },
    });
    fireEvent.click(screen.getByRole("button", { name: /adicionar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Essa lista já tem esse valor cadastrado!");
    });
  });

  it("edita valor inline", async () => {
    mockOptionsResponse();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: {
        value: {
          id: 1,
          label: "Aventura",
          category: {
            slug: "generos",
            name: "Gêneros",
          },
        },
      },
    });
    mockOptionsResponse([
      {
        id: 1,
        label: "Aventura",
        category: {
          slug: "generos",
          name: "Gêneros",
        },
      },
    ]);

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Ação");
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    fireEvent.change(screen.getByLabelText("Editar Ação"), {
      target: { value: "Aventura" },
    });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/admin/options/1", { label: "Aventura" });
    });
    expect(await screen.findByText("Aventura")).toBeInTheDocument();
  });

  it("salva edicao inline ao pressionar enter", async () => {
    mockOptionsResponse();
    vi.mocked(api.patch).mockResolvedValueOnce({
      data: {
        value: {
          id: 1,
          label: "Aventura",
          category: {
            slug: "generos",
            name: "Gêneros",
          },
        },
      },
    });
    mockOptionsResponse([
      {
        id: 1,
        label: "Aventura",
        category: {
          slug: "generos",
          name: "Gêneros",
        },
      },
    ]);

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Ação");
    fireEvent.click(screen.getByRole("button", { name: /editar/i }));
    fireEvent.change(screen.getByLabelText("Editar Ação"), {
      target: { value: "Aventura" },
    });
    fireEvent.keyDown(screen.getByLabelText("Editar Ação"), {
      key: "Enter",
      code: "Enter",
    });

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/admin/options/1", { label: "Aventura" });
    });
    expect(await screen.findByText("Aventura")).toBeInTheDocument();
  });

  it("filtra valores pela barra de pesquisa", async () => {
    mockOptionsResponse([
      {
        id: 1,
        label: "Ação",
        category: { slug: "generos", name: "Gêneros" },
      },
      {
        id: 2,
        label: "Drama",
        category: { slug: "generos", name: "Gêneros" },
      },
    ]);
    mockOptionsResponse([
      {
        id: 2,
        label: "Drama",
        category: { slug: "generos", name: "Gêneros" },
      },
    ]);

    render(<AdminOptions />);
    selectCategory();

    expect(await screen.findByText("Ação")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/pesquisar valores/i), {
      target: { value: "Drama" },
    });

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("/admin/options/generos", {
        params: {
          term: "Drama",
          order: "ASC",
          page: 1,
          limit: 6,
        },
      });
    });
    expect(await screen.findByText("Drama")).toBeInTheDocument();
    expect(screen.queryByText("Ação")).not.toBeInTheDocument();
  });

  it("pagina valores quando a categoria tem muitos registros", async () => {
    mockOptionsResponse(Array.from({ length: 6 }, (_, index) => ({
      id: index + 1,
      label: `Valor ${index + 1}`,
      category: { slug: "generos", name: "Gêneros" },
    })), { total: 9, totalPages: 2 });
    mockOptionsResponse([
      {
        id: 9,
        label: "Valor 9",
        category: { slug: "generos", name: "Gêneros" },
      },
    ], { page: 2, total: 9, totalPages: 2 });

    render(<AdminOptions />);
    selectCategory();

    expect(await screen.findByText("Valor 1")).toBeInTheDocument();
    expect(screen.getByText("Exibindo 6 de 9 valores")).toBeInTheDocument();
    expect(screen.queryByText("Valor 9")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /próxima/i }));

    expect(await screen.findByText("Valor 9")).toBeInTheDocument();
  });

  it("exibe categorias do formulario selecionado sem busca interna", async () => {
    mockOptionsResponse([]);

    render(<AdminOptions />);

    fireEvent.click(screen.getByLabelText(/selecionar categoria/i));

    expect(screen.queryByPlaceholderText(/pesquisar categoria/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^autor$/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /tipo de obra/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /tipo de edição/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /acabamento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /demografia/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /país de origem/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /papel do autor/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /status de publicação original/i })).not.toBeInTheDocument();
  });

  it("filtra categorias pelo formulario selecionado", async () => {
    mockOptionsResponse([]);

    render(<AdminOptions />);

    fireEvent.click(screen.getByLabelText(/selecionar categoria/i));
    expect(screen.getByRole("button", { name: /^autor$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /editora brasileira/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/selecionar categoria/i));
    fireEvent.click(screen.getByLabelText(/selecionar formulário/i));
    fireEvent.click(screen.getByRole("button", { name: /edição/i }));

    fireEvent.click(screen.getByLabelText(/selecionar categoria/i));
    expect(screen.getByRole("button", { name: /editora brasileira/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /acabamento/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /formato/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /miolo/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^autor$/i })).not.toBeInTheDocument();
  });

  it("preserva o formulario selecionado ao sair e voltar durante a sessao SPA", () => {
    const firstRender = render(<AdminOptions />);

    selectForm(/edição/i);
    firstRender.unmount();

    render(<AdminOptions />);

    expect(screen.getByLabelText(/selecionar formulário/i)).toHaveTextContent("Edição");
    expect(screen.getByLabelText(/selecionar categoria/i)).toHaveTextContent("Selecione");
  });

  it("exclui valor apos confirmacao", async () => {
    mockOptionsResponse();
    vi.mocked(api.delete).mockResolvedValueOnce({
      data: { message: "Valor excluído com sucesso." },
    });

    render(<AdminOptions />);
    selectCategory();

    await screen.findByText("Ação");
    fireEvent.click(screen.getByRole("button", { name: /excluir/i }));
    expect(screen.getByText("Excluir valor")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /excluir/i }).at(-1)!);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith("/admin/options/1");
    });
    expect(screen.queryByText("Ação")).not.toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith("Valor excluído com sucesso.");
  });
});
