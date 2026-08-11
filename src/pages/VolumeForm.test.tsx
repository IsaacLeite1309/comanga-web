import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import VolumeForm from "@/pages/VolumeForm";
import { api } from "@/services/api";
import { toast } from "sonner";

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

function renderVolumeForm(path = "/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/novo") {
  return render(
    <MemoryRouter initialEntries={[{ pathname: path, state: { workId: 10, editionId: 20 } }]}>
      <Routes>
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/novo" element={<VolumeForm />} />
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId/editar" element={<VolumeForm />} />
        <Route path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId" element={<div>Detalhe da Edição</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("VolumeForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("cadastra volume enviando os dados para a API da edicao", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { volume: { id: 30 } } });

    renderVolumeForm();

    fireEvent.change(screen.getByLabelText(/n.*mero do volume/i), { target: { value: "0" } });
    fireEvent.click(screen.getByRole("button", { name: /^volume único$/i }));
    fireEvent.change(screen.getByLabelText(/^data de publica/i), { target: { value: "2026-01-10" } });
    fireEvent.change(screen.getByLabelText(/pre.*o de capa/i), { target: { value: "39.9" } });
    fireEvent.change(screen.getByLabelText(/n.*mero de p.*ginas/i), { target: { value: "208" } });
    fireEvent.change(screen.getByLabelText(/isbn-10/i), { target: { value: "123456789X" } });
    fireEvent.change(screen.getByLabelText(/isbn-13/i), { target: { value: "9781234567890" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.change(screen.getByLabelText(/url da capa/i), { target: { value: "https://cdn.comanga.test/volume-1.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/editions/20/volumes", expect.objectContaining({
        number: 0,
        singleVolume: true,
        pages: 208,
        price: 39.9,
        priceCurrency: "R$",
        releaseDatePrecision: "Completa",
        releaseYear: 2026,
        releaseMonth: 1,
        releaseDay: 10,
        coverUrl: "https://cdn.comanga.test/volume-1.jpg",
        isbn10: "123456789X",
        isbn13: "9781234567890",
      }));
    });
  });

  it("impede avancar para capa e sinopse sem informar o numero do volume", () => {
    renderVolumeForm();

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByText(/preencha o campo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/url da capa/i)).not.toBeInTheDocument();
  });

  it("impede avancar clicando diretamente na etapa de capa quando numero esta vazio", () => {
    renderVolumeForm();

    fireEvent.click(screen.getByRole("button", { name: /etapa 2/i }));

    expect(screen.getByText(/preencha o campo/i)).toBeInTheDocument();
    expect(screen.queryByLabelText(/url da capa/i)).not.toBeInTheDocument();
  });

  it("nao mostra erro de url da capa ao continuar a partir da etapa de dados", () => {
    renderVolumeForm();

    fireEvent.change(screen.getByLabelText(/n.*mero do volume/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^data de publica/i), { target: { value: "2026-01-10" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));
    expect(screen.getByText(/url absoluta/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.queryByText(/url absoluta/i)).not.toBeInTheDocument();
  });

  it("carrega e atualiza um volume existente com dados opcionais vazios", async () => {
    vi.mocked(api.get).mockResolvedValueOnce({
      data: {
        volume: {
          id: 30,
          editionId: 20,
          number: 2,
          singleVolume: false,
          coverUrl: "https://cdn.comanga.test/volume-2.jpg",
          pages: null,
          price: null,
          priceCurrency: null,
          releaseDatePrecision: "Ano",
          releaseYear: 2020,
          releaseMonth: null,
          releaseDay: null,
          isbn10: null,
          isbn13: null,
          affiliateLink: null,
          synopsis: null,
        },
      },
    });
    vi.mocked(api.patch).mockResolvedValueOnce({ data: {} });

    renderVolumeForm("/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/30/editar");

    expect(await screen.findByRole("heading", { name: /editar volume/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/n.*mero do volume/i)).toHaveValue(2);
    expect(screen.getByLabelText(/^data de publica/i)).toHaveValue(2020);

    fireEvent.click(screen.getByRole("button", { name: /etapa 2/i }));
    fireEvent.change(screen.getByLabelText(/sinopse/i), { target: { value: "Nova sinopse" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/admin/volumes/30", expect.objectContaining({
        number: 2,
        pages: null,
        price: null,
        priceCurrency: "R$",
        releaseDatePrecision: "Ano",
        releaseYear: 2020,
        releaseMonth: null,
        releaseDay: null,
        synopsis: "Nova sinopse",
      }));
    });
    expect(toast.success).toHaveBeenCalledWith("Volume atualizado com sucesso.");
  });

  it("envia publicacao com precisao de mes e ano", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { volume: { id: 31 } } });
    renderVolumeForm();

    fireEvent.change(screen.getByLabelText(/n.*mero do volume/i), { target: { value: "3" } });
    fireEvent.click(screen.getByLabelText(/precis.o da data/i));
    fireEvent.click(screen.getByRole("button", { name: /m.s e ano/i }));
    fireEvent.change(screen.getByLabelText(/^data de publica/i), { target: { value: "2024-09" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.change(screen.getByLabelText(/url da capa/i), { target: { value: "https://cdn.comanga.test/volume-3.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith("/admin/editions/20/volumes", expect.objectContaining({
      releaseDatePrecision: "Mes e ano",
      releaseYear: 2024,
      releaseMonth: 9,
      releaseDay: null,
    })));
  });

  it("valida URLs e valores numericos antes de salvar", () => {
    renderVolumeForm();

    fireEvent.change(screen.getByLabelText(/n.*mero do volume/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^data de publica/i), { target: { value: "2026-01-10" } });
    fireEvent.change(screen.getByLabelText(/pre.*o de capa/i), { target: { value: "-1" } });
    fireEvent.change(screen.getByLabelText(/n.*mero de p.*ginas/i), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText(/link afiliado/i), { target: { value: "link-invalido" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.change(screen.getByLabelText(/url da capa/i), { target: { value: "capa-invalida" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    expect(screen.getByText(/informe uma url absoluta v.lida/i)).toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("exibe erro devolvido pela API ao carregar um volume", async () => {
    vi.mocked(api.get).mockRejectedValueOnce({
      isAxiosError: true,
      response: { data: { error: "Volume nao encontrado." } },
    });

    renderVolumeForm("/admin/editar-mangas/obras/Naruto/edicoes/20/volumes/30/editar");

    expect(await screen.findByText("Volume nao encontrado.")).toBeInTheDocument();
  });

  it("exibe erro padrao quando o cadastro falha sem resposta da API", async () => {
    vi.mocked(api.post).mockRejectedValueOnce(new Error("falha"));
    renderVolumeForm();

    fireEvent.change(screen.getByLabelText(/n.*mero do volume/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/^data de publica/i), { target: { value: "2026-01-10" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.change(screen.getByLabelText(/url da capa/i), { target: { value: "https://cdn.comanga.test/volume.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: /salvar/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Erro ao cadastrar Volume."));
  });
});
