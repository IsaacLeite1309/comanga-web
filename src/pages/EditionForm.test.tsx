import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditionForm from "@/pages/EditionForm";
import { api } from "@/services/api";
import { toast } from "sonner";
import { resetEditionDraftMemoryForTests } from "@/pages/editionDraftMemory";

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
    editionTypes: [{ id: 31, label: "Tankobon" }],
    coverTypes: [{ id: 32, label: "Capa comum" }],
    formats: [{ id: 33, label: "Impresso" }],
  },
};

function renderEditionForm(path = "/admin/editar-mangas/obras/Naruto/edicoes/nova") {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state: { workId: 10 } }]}>
      <Routes>
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/nova" element={<EditionForm />} />
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/editar" element={<EditionForm />} />
        <Route path="/admin/editar-mangas/obras/:workSlug" element={<div>Hub da Obra</div>} />
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

  it("preserva o rascunho de uma nova edicao durante a navegacao SPA", async () => {
    vi.mocked(api.get).mockResolvedValue({ data: editionOptions });
    const firstRender = renderEditionForm();

    await screen.findByRole("heading", { name: /nova edição/i });
    chooseDropdown(/editora brasileira/i, /panini/i);
    fireEvent.change(screen.getByLabelText(/url da capa da edição/i), {
      target: { value: "https://cdn.comanga.test/rascunho-edicao.jpg" },
    });
    firstRender.unmount();

    renderEditionForm();

    expect(await screen.findByLabelText(/url da capa da edição/i)).toHaveValue("https://cdn.comanga.test/rascunho-edicao.jpg");
    expect(screen.getByLabelText(/editora brasileira/i)).toHaveTextContent("Panini");
  });

  it("cadastra uma nova edição vinculada à Obra atual", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { edition: { id: 50 } },
    });

    renderEditionForm();

    expect(await screen.findByRole("heading", { name: /nova edição/i })).toBeInTheDocument();

    chooseDropdown(/editora brasileira/i, /panini/i);
    chooseDropdown(/tipo de edição/i, /tankobon/i);
    chooseDropdown(/acabamento/i, /capa comum/i);
    chooseDropdown(/formato/i, /impresso/i);
    chooseDropdown(/número da edição/i, /1ª edição/i);
    chooseDropdown(/status de publicação/i, /completo/i);
    fireEvent.change(screen.getByLabelText(/url da capa da edição/i), {
      target: { value: "https://cdn.comanga.test/edicao.jpg" },
    });

    expect(screen.getByAltText(/prévia da capa da edição/i)).toHaveAttribute("src", "https://cdn.comanga.test/edicao.jpg");
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works/10/editions", expect.objectContaining({
        brazilianPublisherId: 30,
        editionTypeId: 31,
        coverTypeId: 32,
        formatId: 33,
        chronologicalNumber: 1,
        brazilPublicationStatus: "Completo",
        coverUrl: "https://cdn.comanga.test/edicao.jpg",
      }));
    });
    expect(toast.success).toHaveBeenCalledWith("Edição cadastrada com sucesso.");
    expect(screen.getByText("Edição cadastrada com sucesso")).toBeInTheDocument();
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
            coverUrl: null,
            brazilianPublisher: { id: 30, label: "Panini" },
            editionType: { id: 31, label: "Tankobon" },
            coverType: { id: 32, label: "Capa comum" },
            format: { id: 33, label: "Impresso" },
            brazilPublicationStatus: { id: "Em andamento", label: "Em andamento" },
          },
        },
      });
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    renderEditionForm("/admin/editar-mangas/obras/Naruto/edicoes/50/editar");

    expect(await screen.findByRole("heading", { name: /editar edi/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/url da capa da edi/i)).toHaveValue("");
    fireEvent.change(screen.getByLabelText(/url da capa da edi/i), {
      target: { value: "https://cdn.comanga.test/edicao-2.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/admin/editions/50", expect.objectContaining({
      chronologicalNumber: 2,
      brazilPublicationStatus: "Em andamento",
      coverUrl: "https://cdn.comanga.test/edicao-2.jpg",
    })));
    expect(toast.success).toHaveBeenCalledWith("Edição atualizada com sucesso.");
  });

  it("resolve a obra diretamente pelo slug quando a rota e recarregada", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { work: { id: 10, slug: "naruto", title: "Naruto" } } })
      .mockResolvedValueOnce({ data: editionOptions });

    render(
      <MemoryRouter initialEntries={["/admin/editar-mangas/obras/naruto/edicoes/nova"]}>
        <Routes>
          <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/nova" element={<EditionForm />} />
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
      <MemoryRouter initialEntries={["/admin/editar-mangas/obras/Inexistente/edicoes/nova"]}>
        <Routes>
          <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/nova" element={<EditionForm />} />
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

  it("nao renderiza preview para URL invalida", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({ data: editionOptions });
    renderEditionForm();

    await screen.findByRole("heading", { name: /nova edi/i });
    fireEvent.change(screen.getByLabelText(/url da capa da edi/i), { target: { value: "arquivo-local" } });

    expect(screen.queryByAltText(/pr.*via da capa da edi/i)).not.toBeInTheDocument();
    expect(screen.getByText(/pr.*via/i)).toBeInTheDocument();
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
    chooseDropdown(/tipo de edi/i, /tankobon/i);
    chooseDropdown(/acabamento/i, /capa comum/i);
    chooseDropdown(/formato/i, /impresso/i);
    chooseDropdown(/n.*mero da edi/i, /^1ª edição$/i);
    chooseDropdown(/status de publica/i, /completo/i);
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Edição duplicada."));
  });
});
