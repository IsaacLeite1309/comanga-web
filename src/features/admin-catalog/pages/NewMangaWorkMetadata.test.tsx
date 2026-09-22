import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewManga from "./NewManga";
import { resetNewMangaDraftMemory } from "./newMangaMemory";
import { api } from "@/services/api";

vi.mock("@/services/api", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("@/features/admin-media", () => ({
  CoverImportField: ({ label, value, onChange }: {
    label: string;
    value: { assetId: string; coverUrl: string; pending: boolean } | null;
    onChange: (value: { assetId: string; coverUrl: string; pending: boolean } | null) => void;
  }) => (
    <input
      aria-label={`URL da ${label}`}
      value={value?.coverUrl || ""}
      onChange={(event) => onChange(event.target.value
        ? { assetId: "7f28c7f0-c94f-46e8-b61c-6ea716f8f28e", coverUrl: event.target.value, pending: true }
        : null)}
    />
  ),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

const japao = { id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } };

const formOptions = {
  authors: [
    { id: 1, label: "Masashi Kishimoto", depends_on: [japao] },
    { id: 2, label: "Akira Toriyama", depends_on: [japao] },
  ],
  workTypes: [{ id: 9, label: "Manga", depends_on: [japao] }],
  genres: [{ id: 7, label: "Acao" }],
  magazines: [{ id: 10, label: "Weekly Shonen Jump", depends_on: [japao] }],
  originalPublishers: [{ id: 19, label: "Shueisha", depends_on: [japao] }],
};

const workDetail = {
  id: 10,
  slug: "naruto",
  title: "Naruto",
  originalTitle: "ナルト",
  romanizedTitle: "Naruto",
  synopsis: "Um ninja busca reconhecimento na própria vila.",
  coverAssetId: "7f28c7f0-c94f-46e8-b61c-6ea716f8f28e",
  coverUrl: "https://cdn.comanga.test/naruto.jpg",
  country: "Japão",
  type: { id: 9, label: "Manga" },
  adultContent: false,
  originalPublicationStartYear: 1999,
  originalPublicationEndYear: 2014,
  directRelease: false,
  originalPublishers: [{ id: 19, label: "Shueisha" }],
  originalPublicationStatus: "Completa",
  authors: [
    { author: { id: 1, label: "Masashi Kishimoto" }, roles: ["História e Arte"] },
    { author: { id: 2, label: "Akira Toriyama" }, roles: ["Arte"] },
  ],
  genres: [{ id: 7, label: "Acao" }],
  demographics: ["Shonen"],
  serializationMagazines: [{ id: 10, label: "Weekly Shonen Jump" }],
};

function mockRequests() {
  vi.mocked(api.get).mockImplementation((url: string) => (
    url === "/admin/works/form-options"
      ? Promise.resolve({ data: { options: formOptions } })
      : Promise.resolve({ data: { work: workDetail } })
  ));
}

function renderCreate() {
  return render(<MemoryRouter><NewManga /></MemoryRouter>);
}

function renderEdit() {
  return render(<MemoryRouter><NewManga mode="edit" workId="10" /></MemoryRouter>);
}

async function waitForOptions() {
  await waitFor(() => {
    expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manga");
  });
}

async function fillIdentification() {
  await waitForOptions();
  fireEvent.change(screen.getByLabelText(/^título$/i), { target: { value: "Naruto" } });
  fireEvent.change(screen.getByLabelText(/^título original$/i), { target: { value: "ナルト" } });
  fireEvent.change(screen.getByLabelText(/^título romanizado$/i), { target: { value: "Naruto" } });
}

async function chooseDropdownAt(label: RegExp, index: number, optionName: RegExp) {
  fireEvent.click(screen.getAllByLabelText(label)[index]);
  fireEvent.click(screen.getByRole("button", { name: optionName }));
}

describe("metadados próprios da Obra no formulário administrativo", () => {
  beforeEach(() => {
    resetNewMangaDraftMemory();
    vi.clearAllMocks();
    mockRequests();
  });

  it("apresenta os três títulos como campos separados e reserva capa e sinopse para a etapa 4", async () => {
    renderCreate();
    await waitForOptions();

    const title = screen.getByLabelText(/^título$/i);
    const originalTitle = screen.getByLabelText(/^título original$/i);
    const romanizedTitle = screen.getByLabelText(/^título romanizado$/i);

    expect(title).not.toBe(originalTitle);
    expect(romanizedTitle).not.toBe(originalTitle);
    expect(romanizedTitle).not.toBe(title);
    expect(screen.queryByLabelText(/^sinopse da obra$/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /capa e sinopse/i })).toBeInTheDocument();
  });

  it("impede avançar sem título romanizado", async () => {
    renderCreate();
    await fillIdentification();
    fireEvent.change(screen.getByLabelText(/^título romanizado$/i), { target: { value: "  " } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.queryByRole("heading", { name: /autor\(es\)/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText(/^título romanizado$/i)).toHaveClass("border-red-500");
  });

  it("envia título romanizado e sinopse próprios no cadastro", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: { work: { id: 1, slug: "naruto", title: "Naruto" } },
    });
    renderCreate();
    await fillIdentification();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await chooseDropdownAt(/^autor$/i, 0, /masashi kishimoto/i);
    fireEvent.click(screen.getAllByLabelText(/selecionar papel/i)[0]);
    fireEvent.click(screen.getByRole("button", { name: /hist.*ria e arte/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await screen.findByLabelText(/editora original/i);
    fireEvent.click(screen.getByLabelText(/selecionar editora original/i));
    fireEvent.click(screen.getByRole("button", { name: /shueisha/i }));
    fireEvent.click(screen.getByLabelText(/status de publica.*o original/i));
    fireEvent.click(screen.getByRole("button", { name: /^completa$/i }));
    fireEvent.click(screen.getByLabelText(/in.*cio da publica.*o original/i));
    fireEvent.click(screen.getByRole("button", { name: /^1999$/ }));
    fireEvent.click(screen.getByLabelText(/fim da publica.*o original/i));
    fireEvent.click(screen.getByRole("button", { name: /^2014$/ }));
    fireEvent.click(screen.getByLabelText(/selecionar g.*neros/i));
    fireEvent.click(screen.getByRole("button", { name: /^acao$/i }));
    fireEvent.click(screen.getByLabelText(/selecionar demografias/i));
    fireEvent.click(screen.getByRole("button", { name: /shonen/i }));
    fireEvent.click(screen.getByLabelText(/selecionar pré-publicação/i));
    fireEvent.click(screen.getByRole("button", { name: /weekly shonen jump/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByLabelText(/url da capa/i);
    fireEvent.change(screen.getByLabelText(/^sinopse da obra$/i), {
      target: { value: "Um ninja busca reconhecimento na própria vila." },
    });
    fireEvent.change(screen.getByLabelText(/url da capa/i), {
      target: { value: "https://cdn.comanga.test/naruto.jpg" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        title: "Naruto",
        originalTitle: "ナルト",
        romanizedTitle: "Naruto",
        synopsis: "Um ninja busca reconhecimento na própria vila.",
      }));
    });
  });

  it("carrega título romanizado e sinopse da Obra ao editar", async () => {
    renderEdit();

    await waitFor(() => {
      expect(screen.getByLabelText(/^título romanizado$/i)).toHaveValue("Naruto");
    });
    expect(screen.getByLabelText(/^título original$/i)).toHaveValue("ナルト");
    fireEvent.click(screen.getByRole("button", { name: /capa e sinopse/i }));
    await screen.findByLabelText(/^sinopse da obra$/i);
    expect(screen.getByLabelText(/^sinopse da obra$/i)).toHaveValue(
      "Um ninja busca reconhecimento na própria vila.",
    );
  });
  it("preserva tipo e gênero legados ao editar sem oferecê-los no cadastro", async () => {
    const legacyWork = { ...workDetail, type: { id: 99, label: "Tipo legado" },
      genres: [{ id: 98, label: "Gênero legado" }] };
    vi.mocked(api.get).mockImplementation((url: string) => Promise.resolve({
      data: url === "/admin/works/form-options" ? { options: formOptions } : { work: legacyWork },
    }));
    vi.mocked(api.patch).mockResolvedValue({ data: { work: legacyWork } });
    const edit = renderEdit();
    await waitFor(() => expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Tipo legado"));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    expect(screen.getByLabelText(/selecionar g.neros/i)).toHaveTextContent("Gênero legado");
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByLabelText(/url da capa/i);
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));
    await waitFor(() => expect(api.patch).toHaveBeenCalledWith("/admin/works/10", expect.objectContaining({
      typeId: 99, genreIds: [98],
    })));
    edit.unmount();
    renderCreate();
    await waitForOptions();
    fireEvent.click(screen.getByLabelText(/tipo de obra/i));
    expect(screen.queryByRole("button", { name: "Tipo legado" })).not.toBeInTheDocument();
  });

});

describe("ordenação manual dos Autores no formulário administrativo", () => {
  beforeEach(() => {
    resetNewMangaDraftMemory();
    vi.clearAllMocks();
    mockRequests();
  });

  async function goToAuthorsStepInEditMode() {
    renderEdit();
    await waitFor(() => {
      expect(screen.getByLabelText(/^título romanizado$/i)).toHaveValue("Naruto");
    });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await screen.findByRole("heading", { name: /autor\(es\)/i });
  }

  it("não oferece controles manuais para ordenar autores", async () => {
    await goToAuthorsStepInEditMode();

    expect(screen.queryByRole("button", { name: /^mover autor/i })).not.toBeInTheDocument();
  });
});
