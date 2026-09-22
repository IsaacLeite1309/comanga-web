import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditionForm from "./EditionForm";
import { api } from "@/services/api";
import { toast } from "sonner";
import { resetEditionDraftMemoryForTests } from "./editionDraftMemory";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const editionOptions = {
  options: {
    brazilianPublishers: [{ id: 30, label: "Panini" }],
    coverTypes: [{ id: 32, label: "Capa comum" }],
    formats: [{ id: 33, label: "Impresso" }],
    papers: [{ id: 34, label: "Papel" }],
  },
};

function renderEditionForm(path = "/admin/gerenciar-mangas/obras/Naruto/edicoes/nova") {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state: { workId: 10 } }]}>
      <Routes>
        <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/nova" element={<EditionForm />} />
        <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/editar" element={<EditionForm />} />
        <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes" element={<div>Detalhes da Edição</div>} />
        <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes" element={<div>Hub da Obra</div>} />
        <Route path="/admin/pos-cadastro" element={<div>Edição cadastrada com sucesso</div>} />
      </Routes>
    </MemoryRouter>
  );
}

function chooseDropdown(label: RegExp, optionName: RegExp) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole("button", { name: optionName }));
}

describe("EditionForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetEditionDraftMemoryForTests();
  });

  it("exibe e preserva o número existente acima das opções iniciais", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions }).mockResolvedValueOnce({
      data: { edition: {
        id: 50, workId: 10, chronologicalNumber: 17, brazilPublicationStatus: "Completa",
        brazilianPublisher: { id: 30, label: "Panini" }, coverType: null, format: null, paper: null,
      } },
    });
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });
    renderEditionForm("/admin/gerenciar-mangas/obras/Naruto/edicoes/50/editar");
    await screen.findByRole("heading", { name: /editar edição/i });
    expect(screen.getByLabelText(/número da edição/i)).toHaveTextContent("17ª edição");
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/admin/editions/50", expect.objectContaining({
      chronologicalNumber: 17,
    })));
  });

  it("preserva o rascunho de uma nova edicao durante a navegacao SPA", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: editionOptions });
    const firstRender = renderEditionForm();

    await screen.findByRole("heading", { name: /nova edição/i });
    chooseDropdown(/editora brasileira/i, /panini/i);
    firstRender.unmount();

    renderEditionForm();

    expect(await screen.findByLabelText(/editora brasileira/i)).toHaveTextContent("Panini");
  });

  it("não oferece importação de capa própria", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    renderEditionForm();

    await screen.findByRole("heading", { name: /nova edição/i });

    expect(screen.queryByLabelText(/tipo de edi/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/capa da edi/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/a capa desta Edição é a capa do Volume 1/i)).not.toBeInTheDocument();
  });

  it("cadastra uma nova edição vinculada à Obra atual", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { edition: { id: 50 } },
    });

    renderEditionForm();

    expect(await screen.findByRole("heading", { name: /nova edição/i })).toBeInTheDocument();

    chooseDropdown(/editora brasileira/i, /panini/i);
    chooseDropdown(/acabamento/i, /capa comum/i);
    chooseDropdown(/formato/i, /impresso/i);
    chooseDropdown(/miolo/i, /papel/i);
    chooseDropdown(/número da edição/i, /1ª edição/i);
    chooseDropdown(/status de publicação/i, /completa/i);
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works/10/editions", expect.objectContaining({
        brazilianPublisherId: 30,
        coverTypeId: 32,
        formatId: 33,
        paperId: 34,
        chronologicalNumber: 1,
        brazilPublicationStatus: "Completa",
      }));
    });
    // A API recusa coverAssetId na Edição: o cliente nunca pode enviá-lo.
    expect(vi.mocked(api.post).mock.calls[0][1]).not.toHaveProperty("coverAssetId");
    expect(toast.success).toHaveBeenCalledWith("Edição cadastrada com sucesso.");
    expect(screen.getByText("Edição cadastrada com sucesso")).toBeInTheDocument();
  });

  it("permite cadastrar uma edição sem metadados ainda não informados", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    vi.mocked(api.post).mockResolvedValueOnce({ data: { edition: { id: 51 } } });

    renderEditionForm();

    await screen.findByRole("heading", { name: /nova edição/i });
    chooseDropdown(/editora brasileira/i, /panini/i);
    chooseDropdown(/número da edição/i, /1ª edição/i);
    chooseDropdown(/status de publicação/i, /completa/i);
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/works/10/editions", expect.objectContaining({
      coverTypeId: null,
      formatId: null,
      paperId: null,
    })));
  });

  it("carrega e atualiza uma edicao existente", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionOptions })
      .mockResolvedValueOnce({
        data: {
          edition: {
            id: 50,
            workId: 10,
            chronologicalNumber: 2,
            coverAssetId: null,
            coverUrl: null,
            brazilianPublisher: { id: 30, label: "Panini" },
            coverType: { id: 32, label: "Capa comum" },
            format: { id: 33, label: "Impresso" },
            paper: { id: 34, label: "Papel" },
            brazilPublicationStatus: { id: "Em andamento", label: "Em andamento" },
          },
        },
      });
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    renderEditionForm("/admin/gerenciar-mangas/obras/Naruto/edicoes/50/editar");

    expect(await screen.findByRole("heading", { name: /editar edi/i })).toBeInTheDocument();
    chooseDropdown(/número da edição/i, /^3ª edição$/i);
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/admin/editions/50", expect.objectContaining({
      chronologicalNumber: 3,
      brazilPublicationStatus: "Em andamento",
    })));
    expect(vi.mocked(api.patch).mock.calls[0][1]).not.toHaveProperty("coverAssetId");
    expect(toast.success).toHaveBeenCalledWith("Edição atualizada com sucesso.");
    expect(await screen.findByText("Detalhes da Edição")).toBeInTheDocument();
  });

  it("resolve a obra diretamente pelo slug quando a rota e recarregada", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { work: { id: 10, slug: "naruto", title: "Naruto" } } })
      .mockResolvedValueOnce({ data: editionOptions });

    render(
      <MemoryRouter initialEntries={["/admin/gerenciar-mangas/obras/naruto/edicoes/nova"]}>
        <Routes>
          <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/nova" element={<EditionForm />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: /nova edi/i })).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith("/admin/works/slug/naruto");
    expect(api.get).not.toHaveBeenCalledWith("/admin/works", expect.anything());
  });

  it("informa quando a obra da URL nao existe", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Obra não encontrada." } },
    });

    render(
      <MemoryRouter initialEntries={["/admin/gerenciar-mangas/obras/Inexistente/edicoes/nova"]}>
        <Routes>
          <Route path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/nova" element={<EditionForm />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText(/obra n.o encontrada/i)).toBeInTheDocument();
  });

  it("recusa envio com campos obrigatorios vazios", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    renderEditionForm();

    await screen.findByRole("heading", { name: /nova edi/i });
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    expect(toast.error).toHaveBeenCalledWith("Preencha os campos obrigatórios da Edição.");
    expect(api.post).not.toHaveBeenCalled();
  });

  it("filtra opcoes e informa quando nao encontra resultado", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    renderEditionForm();

    await screen.findByRole("heading", { name: /nova edi/i });
    fireEvent.click(screen.getByLabelText(/^editora brasileira$/i));
    fireEvent.change(screen.getByLabelText(/^editora brasileira$/i), { target: { value: "inexistente" } });

    expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
    fireEvent.keyDown(screen.getByLabelText(/^editora brasileira$/i), { key: "Enter" });
    expect(screen.getByLabelText(/^editora brasileira$/i)).toHaveAttribute("aria-expanded", "false");
  });

  it("exibe a mensagem da API quando o cadastro falha", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    vi.mocked(api.post).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Edição duplicada." } },
    });
    renderEditionForm();

    await screen.findByRole("heading", { name: /nova edi/i });
    chooseDropdown(/editora brasileira/i, /panini/i);
    chooseDropdown(/acabamento/i, /capa comum/i);
    chooseDropdown(/formato/i, /impresso/i);
    chooseDropdown(/miolo/i, /papel/i);
    chooseDropdown(/n.*mero da edi/i, /^1ª edição$/i);
    chooseDropdown(/status de publica/i, /completa/i);
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Edição duplicada."));
  });
});
