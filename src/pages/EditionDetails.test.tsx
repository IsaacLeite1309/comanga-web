import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditionDetails from "@/pages/EditionDetails";
import { api } from "@/services/api";
import { toast } from "sonner";

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
    chronologicalNumber: 1,
    coverUrl: "https://cdn.comanga.test/edicao.jpg",
    visibility: "Privado",
    brazilianPublisher: { id: 30, label: "Panini" },
    editionType: { id: 31, label: "Tankobon" },
    coverType: { id: 32, label: "Capa comum" },
    format: { id: 33, label: "Impresso" },
    brazilPublicationStatus: "Completo",
    volumesCount: 0,
  },
};

const emptyVolumesResponse = {
  volumes: [],
  pagination: { total: 0 },
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
  pagination: { total: 1 },
};

function renderEditionDetails() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: "/admin/editar-mangas/obras/Naruto/edicoes/20", state: { workId: 10, editionId: 20 } }]}>
      <Routes>
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId" element={<EditionDetails />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("EditionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("mostra a previa da edicao e o estado vazio de volumes", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: emptyVolumesResponse });

    renderEditionDetails();

    expect(await screen.findByRole("heading", { name: /1.*edi/i })).toBeInTheDocument();
    expect(screen.getByText("Panini")).toBeInTheDocument();
    expect(screen.getByText("Tankobon")).toBeInTheDocument();
    expect(screen.getByText("0 volumes")).toBeInTheDocument();
    expect(screen.getByText(/nenhum volume cadastrado/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /editar edi/i })).toHaveAttribute("href", "/admin/editar-mangas/obras/Naruto/edicoes/20/editar");
  });

  it("lista volumes da edicao com link de gerenciamento", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { edition: { ...editionResponse.edition, volumesCount: 1 } } })
      .mockResolvedValueOnce({ data: volumesResponse });

    renderEditionDetails();

    expect(await screen.findByText("Volume 1")).toBeInTheDocument();
    expect(screen.getByText("208")).toBeInTheDocument();
    expect(screen.getAllByText("R$ 39,90").length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /gerenciar volume 1/i })).toHaveAttribute("href", "/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/30");
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
          pagination: { total: 1 },
        },
      });

    renderEditionDetails();
    await screen.findByRole("heading", { name: /1.*edi/i });
    fireEvent.click(screen.getByRole("button", { name: /grade/i }));

    expect(screen.getAllByText("Sem capa").length).toBeGreaterThan(0);
    expect(screen.getByText(/volume .nico/i)).toBeInTheDocument();
  });

  it("exclui um volume depois da confirmacao", async () => {
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: editionResponse })
      .mockResolvedValueOnce({ data: volumesResponse });
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
