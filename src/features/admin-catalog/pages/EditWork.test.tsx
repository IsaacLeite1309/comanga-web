import { resetCatalogPagesForTests } from "../domain/catalogPagination";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditWork from "./EditWork";
import { api } from "@/services/api";
import { toast } from "sonner";
import { EDITIONS_PAGE_SIZE } from "../domain/catalogPagination";

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
      brazilPublicationStatus: "Completa",
      volumesCount: 0,
    },
  ],
  pagination: {
    page: 1,
    limit: EDITIONS_PAGE_SIZE,
    total: 1,
    totalPages: 1,
  },
};

const emptyEditionsResponse = {
  editions: [],
  pagination: {
    page: 1,
    limit: EDITIONS_PAGE_SIZE,
    total: 0,
    totalPages: 0,
  },
};

function editionsPage(page: number, total: number) {
  const firstIndex = (page - 1) * EDITIONS_PAGE_SIZE;
  const size = Math.max(Math.min(EDITIONS_PAGE_SIZE, total - firstIndex), 0);

  return {
    editions: Array.from({ length: size }, (_, offset) => ({
      ...editionsResponse.editions[0],
      id: 1000 + firstIndex + offset,
      chronologicalNumber: total - firstIndex - offset,
    })),
    pagination: {
      page,
      limit: EDITIONS_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / EDITIONS_PAGE_SIZE),
    },
  };
}

type EditionsRequestConfig = { params?: { page?: number; limit?: number; order?: string } };

function arrangeEditions(respond: (page: number) => Promise<unknown>) {
  vi.mocked(api.get).mockImplementation((url: string, config?: EditionsRequestConfig) => {
    if (url === "/admin/works/slug/naruto") return Promise.resolve({ data: workDetail });
    if (url === "/admin/works/10/editions") return respond(config?.params?.page ?? 0);
    return Promise.reject(new Error(`URL inesperada: ${url}`));
  });
}

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
    resetCatalogPagesForTests();
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
    expect((await screen.findAllByText("1ª edição"))[0]).toBeInTheDocument();
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
      params: { order: "DESC", page: 1, limit: EDITIONS_PAGE_SIZE },
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
            brazilPublicationStatus: { label: "Completa" },
            volumesCount: 1,
          }],
          pagination: editionsResponse.pagination,
        },
      });

    renderEditWork();
    await screen.findByRole("heading", { name: "Naruto" });
    expect((await screen.findAllByText("1 volume")).length).toBeGreaterThan(0);
    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    // A Obra mantém capa própria; a Edição mostra a origem da capa derivada.
    expect(screen.getAllByText("Sem capa")).toHaveLength(1);
    expect(screen.getAllByText("Sem capa (cadastre o Volume 1)")).toHaveLength(1);
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

  it("mostra a recusa da API quando a Edição não tem o Volume 1 com capa", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });
    vi.mocked(api.patch).mockRejectedValueOnce({
      isAxiosError: true,
      response: {
        data: { error: "Essa Edição não possui o Volume 1 com capa interna válida, não pode ser publicada!" },
      },
    });

    renderEditWork();
    fireEvent.click(await screen.findByRole("button", { name: /alterar visibilidade da 1/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith(
      "Essa Edição não possui o Volume 1 com capa interna válida, não pode ser publicada!",
    ));
    expect(screen.getAllByText("Privado").length).toBeGreaterThan(0);
  });

  it("exibe a capa derivada do Volume 1 na lista de Edições", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse });

    renderEditWork();

    const cover = await screen.findByAltText("Capa da 1ª edição");
    expect(cover).toHaveAttribute("src", "https://cdn.comanga.test/edicao.jpg");
    expect(screen.queryByText("Sem capa (cadastre o Volume 1)")).not.toBeInTheDocument();
  });

  it("exclui uma edicao depois da confirmacao", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: workDetail })
      .mockResolvedValueOnce({ data: editionsResponse })
      .mockResolvedValueOnce({ data: emptyEditionsResponse });
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

describe("EditWork - paginação de Edições", () => {
  beforeEach(() => {
    resetCatalogPagesForTests();
    vi.resetAllMocks();
  });

  it("solicita a primeira página com o tamanho de página administrativo e a ordem decrescente", async () => {
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, 10) }));

    renderEditWork();
    await screen.findByRole("heading", { name: "Naruto" });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works/10/editions", {
      params: { order: "DESC", page: 1, limit: EDITIONS_PAGE_SIZE },
    }));
    expect(await screen.findByText("Exibindo 8 de 10 Edições")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("navega para a próxima página sem acumular os registros da página anterior", async () => {
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, 10) }));

    renderEditWork();
    expect(await screen.findByText("Exibindo 8 de 10 Edições")).toBeInTheDocument();
    expect(screen.getAllByText("10ª edição").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works/10/editions", {
      params: { order: "DESC", page: 2, limit: EDITIONS_PAGE_SIZE },
    }));
    expect(await screen.findByText("Exibindo 2 de 10 Edições")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.queryByText("10ª edição")).not.toBeInTheDocument();
    expect(screen.getAllByText("1ª edição").length).toBeGreaterThan(0);
  });

  it("desabilita Anterior na primeira página e Próxima na última", async () => {
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, 10) }));

    renderEditWork();
    await screen.findByText("Exibindo 8 de 10 Edições");

    expect(screen.getByRole("button", { name: "Página anterior de Edições" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página de Edições" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    await screen.findByText("Exibindo 2 de 10 Edições");

    expect(screen.getByRole("button", { name: "Página anterior de Edições" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Próxima página de Edições" })).toBeDisabled();
  });

  it("volta para a página anterior preservando a ordenação determinística", async () => {
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, 10) }));

    renderEditWork();
    await screen.findByText("Exibindo 8 de 10 Edições");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    await screen.findByText("Exibindo 2 de 10 Edições");

    fireEvent.click(screen.getByRole("button", { name: "Página anterior de Edições" }));

    expect(await screen.findByText("Exibindo 8 de 10 Edições")).toBeInTheDocument();
    expect(screen.getAllByText("10ª edição").length).toBeGreaterThan(0);
    expect(screen.queryByText("1ª edição")).not.toBeInTheDocument();
  });

  it("mantém a página atual ao alternar entre lista e grade", async () => {
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, 10) }));

    renderEditWork();
    await screen.findByText("Exibindo 8 de 10 Edições");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    await screen.findByText("Exibindo 2 de 10 Edições");
    const requestsBeforeToggle = vi.mocked(api.get).mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    expect(screen.getByText("Exibindo 2 de 10 Edições")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Próxima página de Edições" })).toBeDisabled();
    expect(vi.mocked(api.get).mock.calls.length).toBe(requestsBeforeToggle);
  });

  it("desabilita a navegação quando a API devolve totalPages igual a zero", async () => {
    arrangeEditions(() => Promise.resolve({ data: emptyEditionsResponse }));

    renderEditWork();

    expect(await screen.findByText("Exibindo 0 de 0 Edições")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior de Edições" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página de Edições" })).toBeDisabled();
    expect(screen.getByText(/nenhuma edição cadastrada/i)).toBeInTheDocument();
  });

  it("volta para a última página válida ao excluir o único registro da última página", async () => {
    const totals = { value: 9 };
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, totals.value) }));
    vi.mocked(api.delete).mockImplementation(() => {
      totals.value = 8;
      return Promise.resolve({ data: {} });
    });

    renderEditWork();
    await screen.findByText("Exibindo 8 de 9 Edições");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    await screen.findByText("Exibindo 1 de 9 Edições");

    fireEvent.click(screen.getByRole("button", { name: /excluir 1ª edição/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/works/10/editions", {
      params: { order: "DESC", page: 1, limit: EDITIONS_PAGE_SIZE },
    }));
    expect(await screen.findByText("Exibindo 8 de 8 Edições")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("recarrega a mesma página ao excluir um registro de uma página que continua existindo", async () => {
    const totals = { value: 10 };
    arrangeEditions((page) => Promise.resolve({ data: editionsPage(page, totals.value) }));
    vi.mocked(api.delete).mockImplementation(() => {
      totals.value = 9;
      return Promise.resolve({ data: {} });
    });

    renderEditWork();
    await screen.findByText("Exibindo 8 de 10 Edições");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    await screen.findByText("Exibindo 2 de 10 Edições");

    fireEvent.click(screen.getByRole("button", { name: /excluir 1ª edição/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    expect(await screen.findByText("Exibindo 1 de 9 Edições")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });

  it("descarta a resposta atrasada de uma página anterior à navegação mais recente", async () => {
    let releaseSecondPage: () => void = () => undefined;
    const secondPage = new Promise<unknown>((resolve) => {
      releaseSecondPage = () => resolve({ data: editionsPage(2, 20) });
    });
    arrangeEditions((page) => (page === 2 ? secondPage : Promise.resolve({ data: editionsPage(page, 20) })));

    renderEditWork();
    await screen.findByText("Exibindo 8 de 20 Edições");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Edições" }));
    await screen.findByText("3 / 3");

    releaseSecondPage();
    await secondPage;

    expect(await screen.findByText("3 / 3")).toBeInTheDocument();
    expect(screen.getAllByText("4ª edição").length).toBeGreaterThan(0);
    expect(screen.queryByText("12ª edição")).not.toBeInTheDocument();
  });

  it("mostra o erro da lista de Edições sem esconder os dados da Obra", async () => {
    arrangeEditions(() => Promise.reject({
      isAxiosError: true,
      response: { data: { error: "Falha ao consultar Edições." } },
    }));

    renderEditWork();

    expect(await screen.findByText("Falha ao consultar Edições.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Naruto" })).toBeInTheDocument();
  });
});
