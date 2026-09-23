import { resetCatalogPagesForTests } from "../domain/catalogPagination";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditionDetails from "./EditionDetails";
import { api } from "@/services/api";
import { toast } from "sonner";
import { VOLUMES_PAGE_SIZE } from "../domain/catalogPagination";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const editionResponse = {
  edition: {
    id: 20,
    workId: 10,
    work: { id: 10, slug: "naruto", title: "Naruto" },
    chronologicalNumber: 1,
    coverUrl: "https://cdn.comanga.test/edicao.jpg",
    visibility: "Privado",
    brazilianPublisher: { id: 30, label: "Panini" },
    coverType: { id: 32, label: "Capa comum" },
    format: { id: 33, label: "Impresso" },
    papers: [{ id: 34, label: "Offset" }, { id: 35, label: "Couché" }],
    brazilPublicationStatus: "Completa",
    volumesCount: 0,
  },
};

const emptyVolumesResponse = {
  volumes: [],
  pagination: { page: 1, limit: VOLUMES_PAGE_SIZE, total: 0, totalPages: 0 },
};

const volumesResponse = {
  volumes: [
    {
      id: 30,
      editionId: 20,
      number: 1,
      coverUrl: "https://cdn.comanga.test/volume-1.jpg",
      pages: 208,
      price: 39.9,
      releaseDate: "2026-01-10",
      isbn: "9781234567890",
      affiliateLink: "https://loja.test/volume-1",
      synopsis: "Sinopse do volume.",
      visibility: "Privado",
    },
  ],
  pagination: { page: 1, limit: VOLUMES_PAGE_SIZE, total: 1, totalPages: 1 },
};

function volumesPage(page: number, total: number) {
  const firstIndex = (page - 1) * VOLUMES_PAGE_SIZE;
  const size = Math.max(Math.min(VOLUMES_PAGE_SIZE, total - firstIndex), 0);

  return {
    volumes: Array.from({ length: size }, (_, offset) => ({
      ...volumesResponse.volumes[0],
      id: 1000 + firstIndex + offset,
      number: firstIndex + offset + 1,
    })),
    pagination: {
      page,
      limit: VOLUMES_PAGE_SIZE,
      total,
      totalPages: Math.ceil(total / VOLUMES_PAGE_SIZE),
    },
  };
}

type VolumesRequestConfig = { params?: { page?: number; limit?: number; order?: string } };

function arrangeVolumes(respond: (page: number) => Promise<unknown>) {
  vi.mocked(api.get).mockImplementation((url: string, config?: VolumesRequestConfig) => {
    if (url === "/admin/works/slug/Naruto/editions/1") return Promise.resolve({ data: editionResponse });
    if (url === "/admin/editions/20/volumes") return respond(config?.params?.page ?? 0);
    return Promise.reject(new Error(`URL inesperada: ${url}`));
  });
}

function renderEditionDetails(path = "/admin/gerenciar-mangas/obras/Naruto/edicoes/1/volumes") {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state: { workId: 10, editionId: 20 } }]}>
      <Routes>
        <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes" element={<EditionDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EditionDetails", () => {
  beforeEach(() => {
    resetCatalogPagesForTests();
    vi.resetAllMocks();
  });

  it("usa o título da Obra retornado pela API no caminho de navegação", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: emptyVolumesResponse });

    renderEditionDetails("/admin/gerenciar-mangas/obras/naruto/edicoes/1/volumes");

    expect(await screen.findByRole("link", { name: "Edições de Naruto" })).toBeInTheDocument();
    expect(screen.queryByText("Edições de naruto")).not.toBeInTheDocument();
  });

  it("lista volumes da edicao com link direto de edição", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { edition: { ...editionResponse.edition, volumesCount: 1 } } })
      .mockResolvedValueOnce({ data: volumesResponse });

    renderEditionDetails();

    expect(await screen.findByText("Volume 1")).toBeInTheDocument();
    expect(screen.getByText("208")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 39,90").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /editar volume 1/i })).toHaveAttribute("href", "/admin/gerenciar-mangas/obras/Naruto/edicoes/1/volumes/1/editar");
  });

  it("alterna para grade e mostra volume unico sem capa", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { edition: { ...editionResponse.edition, coverUrl: null, volumesCount: 1 } } })
      .mockResolvedValueOnce({
        data: {
          volumes: [{
            ...volumesResponse.volumes[0],
            singleVolume: true,
            coverUrl: null,
            pages: null,
            price: null,
            visibility: "Público",
          }],
          pagination: volumesResponse.pagination,
        },
      });

    renderEditionDetails();
    await screen.findByRole("heading", { name: /volumes/i });
    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    // O Volume mantém capa própria obrigatória; a Edição aponta a origem da capa derivada.
    expect(screen.getAllByText("Sem capa").length).toBeGreaterThan(0);
    expect(screen.queryByText("Sem capa (cadastre o Volume 1)")).not.toBeInTheDocument();
    expect(screen.getByText(/volume .nico/i)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Adicionar volume" })).not.toBeInTheDocument();
  });

  it("não reintroduz o resumo redundante da Edição", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: volumesResponse });

    renderEditionDetails();

    await screen.findByRole("heading", { name: /^Volumes$/i });
    expect(screen.queryByAltText(/capa da 1.*edi/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Sem capa (cadastre o Volume 1)")).not.toBeInTheDocument();
  });

  it("exclui um volume depois da confirmacao", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: volumesResponse })
      .mockResolvedValueOnce({ data: emptyVolumesResponse });
    vi.mocked(api.delete).mockResolvedValueOnce({ data: {} });

    renderEditionDetails();
    fireEvent.click(await screen.findByRole("button", { name: /excluir volume 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => expect(api.delete).toHaveBeenCalledWith("/admin/volumes/30"));
    expect(toast.success).toHaveBeenCalledWith("Volume excluído com sucesso.");
    expect(screen.queryByText("Volume 1")).not.toBeInTheDocument();
  });

  it("exibe erro devolvido pela API ao excluir volume", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: volumesResponse });
    vi.mocked(api.delete).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Volume público não pode ser excluído." } },
    });

    renderEditionDetails();
    fireEvent.click(await screen.findByRole("button", { name: /excluir volume 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Volume público não pode ser excluído."));
  });

  it("cancela a exclusao do volume", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: volumesResponse });

    renderEditionDetails();
    fireEvent.click(await screen.findByRole("button", { name: /excluir volume 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /cancelar/i }));

    expect(api.delete).not.toHaveBeenCalled();
  });

  it("exibe erro amigavel quando o carregamento falha", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Edição não encontrada." } },
    });

    renderEditionDetails();

    expect(await screen.findByText("Edição não encontrada.")).toBeInTheDocument();
  });
});

describe("EditionDetails - paginação de Volumes", () => {
  beforeEach(() => {
    resetCatalogPagesForTests();
    vi.resetAllMocks();
  });

  it("solicita a primeira página com o tamanho de página administrativo e a ordem crescente", async () => {
    arrangeVolumes((page) => Promise.resolve({ data: volumesPage(page, 10) }));

    renderEditionDetails();
    await screen.findByRole("heading", { name: /^Volumes$/i });

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/editions/20/volumes", {
      params: { order: "ASC", page: 1, limit: VOLUMES_PAGE_SIZE },
    }));
    expect(await screen.findByText("Exibindo 8 de 10 Volumes")).toBeInTheDocument();
    expect(screen.getByText("1 / 2")).toBeInTheDocument();
  });

  it("navega para a próxima página sem acumular os registros da página anterior", async () => {
    arrangeVolumes((page) => Promise.resolve({ data: volumesPage(page, 10) }));

    renderEditionDetails();
    expect(await screen.findByText("Exibindo 8 de 10 Volumes")).toBeInTheDocument();
    expect(screen.getByText("Volume 1")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Volumes" }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/editions/20/volumes", {
      params: { order: "ASC", page: 2, limit: VOLUMES_PAGE_SIZE },
    }));
    expect(await screen.findByText("Exibindo 2 de 10 Volumes")).toBeInTheDocument();
    expect(screen.queryByText("Volume 1")).not.toBeInTheDocument();
    expect(screen.getByText("Volume 10")).toBeInTheDocument();
  });

  it("desabilita os controles nos limites da navegação", async () => {
    arrangeVolumes((page) => Promise.resolve({ data: volumesPage(page, 10) }));

    renderEditionDetails();
    await screen.findByText("Exibindo 8 de 10 Volumes");

    expect(screen.getByRole("button", { name: "Página anterior de Volumes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página de Volumes" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Volumes" }));
    await screen.findByText("Exibindo 2 de 10 Volumes");

    expect(screen.getByRole("button", { name: "Página anterior de Volumes" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Próxima página de Volumes" })).toBeDisabled();
  });

  it("mantém a página atual ao alternar entre lista e grade", async () => {
    arrangeVolumes((page) => Promise.resolve({ data: volumesPage(page, 10) }));

    renderEditionDetails();
    await screen.findByText("Exibindo 8 de 10 Volumes");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Volumes" }));
    await screen.findByText("Exibindo 2 de 10 Volumes");
    const requestsBeforeToggle = vi.mocked(api.get).mock.calls.length;

    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    expect(screen.getByText("Exibindo 2 de 10 Volumes")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    expect(vi.mocked(api.get).mock.calls.length).toBe(requestsBeforeToggle);
  });

  it("trata a resposta vazia com totalPages igual a zero", async () => {
    arrangeVolumes(() => Promise.resolve({ data: emptyVolumesResponse }));

    renderEditionDetails();

    expect(await screen.findByText("Exibindo 0 de 0 Volumes")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Página anterior de Volumes" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Próxima página de Volumes" })).toBeDisabled();
    expect(screen.getByText(/nenhum volume cadastrado/i)).toBeInTheDocument();
  });

  it("volta para a última página válida ao excluir o único registro da última página", async () => {
    const totals = { value: 9 };
    arrangeVolumes((page) => Promise.resolve({ data: volumesPage(page, totals.value) }));
    vi.mocked(api.delete).mockImplementation(() => {
      totals.value = 8;
      return Promise.resolve({ data: {} });
    });

    renderEditionDetails();
    await screen.findByText("Exibindo 8 de 9 Volumes");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Volumes" }));
    await screen.findByText("Exibindo 1 de 9 Volumes");

    fireEvent.click(screen.getByRole("button", { name: /excluir volume 9/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus.o/i }));

    await waitFor(() => expect(api.get).toHaveBeenCalledWith("/admin/editions/20/volumes", {
      params: { order: "ASC", page: 1, limit: VOLUMES_PAGE_SIZE },
    }));
    expect(await screen.findByText("Exibindo 8 de 8 Volumes")).toBeInTheDocument();
    expect(screen.getByText("1 / 1")).toBeInTheDocument();
  });

  it("descarta a resposta atrasada de uma página anterior à navegação mais recente", async () => {
    let releaseSecondPage: () => void = () => undefined;
    const secondPage = new Promise<unknown>((resolve) => {
      releaseSecondPage = () => resolve({ data: volumesPage(2, 20) });
    });
    arrangeVolumes((page) => (page === 2 ? secondPage : Promise.resolve({ data: volumesPage(page, 20) })));

    renderEditionDetails();
    await screen.findByText("Exibindo 8 de 20 Volumes");
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Volumes" }));
    fireEvent.click(screen.getByRole("button", { name: "Próxima página de Volumes" }));
    await screen.findByText("3 / 3");

    releaseSecondPage();
    await secondPage;

    expect(await screen.findByText("3 / 3")).toBeInTheDocument();
    expect(screen.getByText("Volume 17")).toBeInTheDocument();
    expect(screen.queryByText("Volume 9")).not.toBeInTheDocument();
  });

  it("mostra o erro da lista de Volumes mantendo o gerenciamento de Volumes", async () => {
    arrangeVolumes(() => Promise.reject({
      isAxiosError: true,
      response: { data: { error: "Falha ao consultar Volumes." } },
    }));

    renderEditionDetails();

    expect(await screen.findByText("Falha ao consultar Volumes.")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /^Volumes$/i })).toBeInTheDocument();
  });
  it("atualiza a capa e a contagem da Edição depois de excluir o Volume 1", async () => {
    let removed = false;
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url.endsWith("/volumes")
        ? (removed ? emptyVolumesResponse : volumesResponse)
        : { edition: { ...editionResponse.edition, volumesCount: removed ? 0 : 1,
          coverUrl: removed ? null : editionResponse.edition.coverUrl } },
    }));
    vi.mocked(api.delete).mockImplementation(async () => { removed = true; return { data: {} }; });
    renderEditionDetails();
    await screen.findByText("Volume 1");
    fireEvent.click(screen.getByRole("button", { name: /excluir volume 1/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirmar exclus/i }));
    expect(await screen.findByText(/nenhum volume cadastrado/i)).toBeInTheDocument();
  });

  it("preserva a página da Edição ao sair para um formulário e retornar", async () => {
    arrangeVolumes(page => Promise.resolve({ data: volumesPage(page, 18) }));
    const firstVisit = renderEditionDetails();
    await screen.findByText("Volume 1");
    fireEvent.click(screen.getByRole("button", { name: /próxima página de volumes/i }));
    await screen.findByText("Volume 9");
    firstVisit.unmount();
    renderEditionDetails();
    expect(await screen.findByText("Volume 9")).toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();
  });

});
