import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewManga from "./NewManga";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { resetNewMangaDraftMemory } from "./newMangaMemory";
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

vi.mock("@/features/admin-media", () => ({
  CoverImportField: ({ label, value, onChange, invalid }: {
    label: string;
    value: { assetId: string; coverUrl: string; pending: boolean } | null;
    onChange: (value: { assetId: string; coverUrl: string; pending: boolean } | null) => void;
    invalid?: boolean;
  }) => (
    <div>
      <input
        aria-label={`URL da ${label}`}
        value={value?.coverUrl || ""}
        onChange={(event) => {
          try {
            const url = new URL(event.target.value);
            onChange(url.protocol === "https:" ? {
              assetId: "7f28c7f0-c94f-46e8-b61c-6ea716f8f28e",
              coverUrl: event.target.value,
              pending: true,
            } : null);
          } catch {
            onChange(null);
          }
        }}
      />
      {value?.coverUrl && <img src={value.coverUrl} alt={`Prévia da ${label}`} />}
      {invalid && <span>Importe uma capa válida antes de continuar.</span>}
    </div>
  ),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const optionLists: Record<string, Array<{
  id: number;
  label: string;
  depends_on?: Array<{ id: number; label: string; category: { slug: string; name: string } }>;
}>> = {
  autores: [
    { id: 1, label: "Masashi Kishimoto", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 2, label: "Akira Toriyama", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 3, label: "SIU", depends_on: [{ id: 11, label: "Coreia do Sul", category: { slug: "paises-origem", name: "Paises" } }] },
  ],
  generos: [{ id: 7, label: "Acao" }, { id: 16, label: "Hentai" }],
  "tipos-obra": [
    { id: 9, label: "Manga", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 20, label: "Artbook", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 21, label: "Databook", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 14, label: "Manhwa", depends_on: [{ id: 11, label: "Coreia do Sul", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 15, label: "Manhua", depends_on: [
      { id: 12, label: "China", category: { slug: "paises-origem", name: "Paises" } },
      { id: 13, label: "Taiwan", category: { slug: "paises-origem", name: "Paises" } },
    ] },
  ],
  "revistas-serializacao": [
    { id: 10, label: "Weekly Shonen Jump", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 11, label: "Big Comic Original", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
  ],
  "editoras-originais": [
    { id: 19, label: "Shueisha", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
    { id: 20, label: "Shogakukan", depends_on: [{ id: 5, label: "Japao", category: { slug: "paises-origem", name: "Paises" } }] },
  ],
};

const formOptions = {
  authors: optionLists.autores,
  workTypes: optionLists["tipos-obra"],
  genres: optionLists.generos,
  magazines: optionLists["revistas-serializacao"],
  originalPublishers: optionLists["editoras-originais"],
};

const workDetail = {
  id: 10,
  title: "Naruto",
  originalTitle: "Naruto",
  romanizedTitle: "Naruto",
  synopsis: "Um ninja busca reconhecimento na própria vila.",
  coverAssetId: "7f28c7f0-c94f-46e8-b61c-6ea716f8f28e",
  coverUrl: "https://cdn.comanga.test/naruto.jpg",
  country: "Japão",
  type: { id: 9, label: "Manga" },
  adultContent: false,
  originalPublicationStartYear: 1999,
  originalPublicationEndYear: 2014,
  originalVolumeCount: 72,
  directRelease: false,
  originalPublishers: [{ id: 19, label: "Shueisha" }],
  originalPublicationStatus: "Completa",
  authors: [{ author: { id: 1, label: "Masashi Kishimoto" }, roles: ["História e Arte"] }],
  genres: [{ id: 7, label: "Acao" }],
  demographics: ["Shonen"],
  serializationMagazines: [{ id: 10, label: "Weekly Shonen Jump" }],
};

function mockOptionRequests() {
  vi.mocked(api.get).mockResolvedValue({
    data: {
      options: formOptions,
    },
  });
}

function renderNewManga() {
  return render(
    <MemoryRouter>
      <NewManga />
    </MemoryRouter>
  );
}

function renderEditManga() {
  return render(
    <MemoryRouter>
      <NewManga mode="edit" workId="10" />
    </MemoryRouter>
  );
}

function LocationStateProbe() {
  const location = useLocation();
  const state = location.state as { workId?: number } | null;
  return <div>Obra de retorno: {state?.workId}</div>;
}

async function chooseDropdown(label: RegExp, optionName: RegExp) {
  fireEvent.click(screen.getByLabelText(label));
  fireEvent.click(screen.getByRole("button", { name: optionName }));
}

async function chooseDropdownAt(label: RegExp, index: number, optionName: RegExp) {
  fireEvent.click(screen.getAllByLabelText(label)[index]);
  fireEvent.click(screen.getByRole("button", { name: optionName }));
}

async function fillIdentificationFields() {
  fireEvent.change(screen.getByLabelText(/^t.*tulo$/i), { target: { value: "Naruto" } });
  fireEvent.change(screen.getByLabelText(/^t.*tulo original$/i), { target: { value: "Naruto" } });
  fireEvent.change(screen.getByLabelText(/^t.*tulo romanizado$/i), { target: { value: "Naruto" } });
  fireEvent.change(screen.getByLabelText(/^sinopse da obra$/i), {
    target: { value: "Um ninja busca reconhecimento na própria vila." },
  });

  await waitFor(() => {
    expect(api.get).toHaveBeenCalledWith("/admin/works/form-options");
    expect(screen.getByLabelText(/pa.*s de origem/i)).toHaveTextContent("Japão");
    expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manga");
  });

  fireEvent.change(screen.getByLabelText(/url da capa/i), {
    target: { value: "https://cdn.comanga.test/naruto.jpg" },
  });
}

async function goToAuthorsStep() {
  await fillIdentificationFields();
  fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
  expect(await screen.findByRole("heading", { name: /autor\(es\)/i })).toBeInTheDocument();
}

async function fillAuthorsFields(authorName: RegExp = /masashi kishimoto/i) {
  await chooseDropdown(/^autor$/i, authorName);
  fireEvent.click(screen.getByLabelText(/selecionar papel/i));
  fireEvent.click(screen.getByRole("button", { name: /hist.*ria e arte/i }));
}

async function goToPublicationStep() {
  await goToAuthorsStep();
  await fillAuthorsFields();
  fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
  expect(await screen.findByLabelText(/editora original/i)).toBeInTheDocument();
}

async function fillPublicationFields() {
  await chooseDropdown(/editora original/i, /shueisha/i);
  await chooseDropdown(/status de publica.*o original/i, /completa/i);
  await chooseDropdown(/in.*cio da publica.*o original/i, /1999/i);
  await chooseDropdown(/fim da publica.*o original/i, /2014/i);
  fireEvent.change(screen.getByLabelText(/n.*mero de volumes originais/i), { target: { value: "72" } });
  fireEvent.click(screen.getByLabelText(/selecionar g.*neros/i));
  fireEvent.click(screen.getByRole("button", { name: /^acao$/i }));
  fireEvent.click(screen.getByLabelText(/selecionar demografias/i));
  fireEvent.click(screen.getByRole("button", { name: /shonen/i }));
  fireEvent.click(screen.getByLabelText(/selecionar pré-publicação/i));
  fireEvent.click(screen.getByRole("button", { name: /weekly shonen jump/i }));
}

async function fillRequiredFields() {
  await goToPublicationStep();
  await fillPublicationFields();
}

describe("NewManga", () => {
  beforeEach(() => {
    resetNewMangaDraftMemory();
    vi.mocked(api.get).mockReset();
    vi.mocked(api.post).mockReset();
    vi.mocked(api.patch).mockReset();
    vi.mocked(api.delete).mockReset();
    vi.clearAllMocks();
    mockOptionRequests();
  });

  it("cadastra obra com campos editoriais, dropdowns e preview de capa", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        work: {
          id: 1,
          slug: "naruto",
          title: "Naruto",
        },
      },
    });

    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();

    await fillIdentificationFields();
    expect(screen.getByAltText(/pr.*via da capa/i)).toHaveAttribute("src", "https://cdn.comanga.test/naruto.jpg");
    expect(screen.getByLabelText(/^sinopse da obra$/i)).toHaveValue("Um ninja busca reconhecimento na própria vila.");
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await fillAuthorsFields();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await fillPublicationFields();
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        title: "Naruto",
        typeId: 9,
        country: "Japão",
        originalPublisherIds: [{ id: 19, position: 0 }],
        originalPublicationStatus: "Completa",
        originalPublicationStartYear: 1999,
        originalPublicationEndYear: 2014,
        originalVolumeCount: 72,
        coverAssetId: "7f28c7f0-c94f-46e8-b61c-6ea716f8f28e",
        directRelease: false,
        authors: [{ authorId: 1, roles: ["História e Arte"] }],
        genreIds: [7],
        demographies: ["Shonen"],
        magazineIds: [{ id: 10, position: 0 }],
      }));
    });
    expect(api.post).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
      originalTitle: "Naruto",
      romanizedTitle: "Naruto",
      synopsis: "Um ninja busca reconhecimento na própria vila.",
    }));
    expect(toast.success).toHaveBeenCalledWith("Obra cadastrada com sucesso.");
  }, 30000);

  it("preserva a ordem manual de editoras originais e revistas no payload", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({
      data: {
        work: {
          id: 1,
          slug: "naruto",
          title: "Naruto",
        },
      },
    });

    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();

    await goToPublicationStep();

    await chooseDropdown(/editora original/i, /shueisha/i);
    fireEvent.click(screen.getByRole("button", { name: /shogakukan/i }));
    fireEvent.click(screen.getByRole("button", { name: /mover shogakukan para cima/i }));

    await chooseDropdown(/status de publica.*o original/i, /completa/i);
    await chooseDropdown(/in.*cio da publica.*o original/i, /1999/i);
    await chooseDropdown(/fim da publica.*o original/i, /2014/i);
    fireEvent.change(screen.getByLabelText(/n.*mero de volumes originais/i), { target: { value: "72" } });
    fireEvent.click(screen.getByLabelText(/selecionar g.*neros/i));
    fireEvent.click(screen.getByRole("button", { name: /^acao$/i }));
    fireEvent.click(screen.getByLabelText(/selecionar demografias/i));
    fireEvent.click(screen.getByRole("button", { name: /shonen/i }));
    fireEvent.click(screen.getByLabelText(/selecionar pré-publicação/i));
    fireEvent.click(screen.getByRole("button", { name: /weekly shonen jump/i }));
    fireEvent.click(screen.getByRole("button", { name: /big comic original/i }));
    fireEvent.click(screen.getByRole("button", { name: /mover big comic original para cima/i }));
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        originalPublisherIds: [{ id: 20, position: 0 }, { id: 19, position: 1 }],
        magazineIds: [{ id: 11, position: 0 }, { id: 10, position: 1 }],
      }));
    });
  }, 30000);

  it("nao marca campos da etapa de publicacao ao continuar a partir da autoria", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();

    await fillIdentificationFields();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await fillAuthorsFields();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(await screen.findByLabelText(/editora original/i)).toBeInTheDocument();
    expect(screen.queryByText("Preencha o campo obrigatório.")).not.toBeInTheDocument();
    expect(api.post).not.toHaveBeenCalled();
  });

  it("altera automaticamente o tipo de obra conforme o pais de origem", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manga");
    });

    await chooseDropdown(/pa.*s de origem/i, /coreia do sul/i);

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manhwa");
    });

    await chooseDropdown(/pa.*s de origem/i, /^china$/i);

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manhua");
    });
  });

  it("filtra autores conforme o pais de origem selecionado", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await fillIdentificationFields();

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.click(screen.getByLabelText(/^autor$/i));

    expect(screen.getByRole("button", { name: /masashi kishimoto/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^siu$/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    await chooseDropdown(/pa.*s de origem/i, /coreia do sul/i);
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.click(screen.getByLabelText(/^autor$/i));

    expect(screen.getByRole("button", { name: /^siu$/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /masashi kishimoto/i })).not.toBeInTheDocument();
  });

  it("exibe campos nativos na ordem definida pelo formulario", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();

    expect(screen.getByLabelText(/pa.*s de origem/i)).toHaveTextContent(/jap/i);
    fireEvent.click(screen.getByLabelText(/pa.*s de origem/i));
    expect(screen.getAllByRole("button", { name: /coreia do sul|china|taiwan/i }).map((button) => button.textContent)).toEqual([
      "Coreia do Sul",
      "China",
      "Taiwan",
    ]);
    fireEvent.click(screen.getByRole("button", { name: /fechar pa.*s de origem/i }));
    await goToAuthorsStep();
    await chooseDropdown(/^autor$/i, /masashi kishimoto/i);
    fireEvent.click(screen.getByLabelText(/selecionar papel/i));
    expect(screen.getAllByRole("button", { name: /hist.*ria|arte|criador original|ilustrador/i }).map((button) => button.textContent)).toEqual([
      "História e Arte",
      "História",
      "Arte",
      "Criador Original",
      "História Original",
      "Ilustrador",
    ]);
  });

  it("desabilita demografia e revista quando lancamento direto esta ativo", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { work: { id: 1, slug: "naruto", title: "Naruto" } } });

    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await fillRequiredFields();

    fireEvent.click(screen.getByRole("switch", { name: /lan.*amento direto/i }));

    expect(screen.getByLabelText(/selecionar demografias/i)).toBeDisabled();
    expect(screen.getByLabelText(/selecionar demografias/i)).toHaveTextContent("Incompatível");
    expect(screen.getByLabelText(/selecionar pré-publicação/i)).toBeDisabled();
    expect(screen.getByLabelText(/selecionar pré-publicação/i)).toHaveTextContent("Incompatível");

    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        directRelease: true,
        demographies: [],
        magazineIds: [],
      }));
    });
  }, 30000);

  it("desabilita demografia quando o tipo de obra nao e manga", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await fillIdentificationFields();

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manga");
    });

    await chooseDropdown(/pa.*s de origem/i, /coreia do sul/i);

    await waitFor(() => {
      expect(screen.getByLabelText(/tipo de obra/i)).toHaveTextContent("Manhwa");
    });

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await fillAuthorsFields(/^siu$/i);
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByLabelText(/selecionar demografias/i)).toBeDisabled();
    expect(screen.getByLabelText(/selecionar demografias/i)).toHaveTextContent("Incompatível");
    expect(screen.getByLabelText(/selecionar pré-publicação/i)).not.toBeDisabled();
  });

  it("liga e desabilita lancamento direto para artbook e databook", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await fillIdentificationFields();

    await chooseDropdown(/tipo de obra/i, /artbook/i);
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    await fillAuthorsFields();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("switch", { name: /lan.*amento direto/i })).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("switch", { name: /lan.*amento direto/i })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    await chooseDropdown(/tipo de obra/i, /databook/i);
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("switch", { name: /lan.*amento direto/i })).toBeDisabled();
    expect(screen.getByRole("switch", { name: /lan.*amento direto/i })).toHaveAttribute("aria-checked", "true");
  });

  it("forca conteudo adulto enquanto hentai estiver selecionado", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToPublicationStep();

    fireEvent.click(screen.getByLabelText(/selecionar g.*neros/i));
    fireEvent.click(screen.getByRole("button", { name: /hentai/i }));

    const adultContentToggle = screen.getByRole("switch", { name: /conte.*do \+18/i });

    expect(adultContentToggle).toHaveAttribute("aria-checked", "true");
    expect(adultContentToggle).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: /hentai/i }));

    expect(screen.getByRole("switch", { name: /conte.*do \+18/i })).not.toBeDisabled();
  });

  it("desabilita fim e volumes quando status original esta em andamento", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToPublicationStep();

    await chooseDropdown(/status de publica.*o original/i, /em andamento/i);

    expect(screen.getByLabelText(/fim da publica.*o original/i)).toBeDisabled();
    expect(screen.getByLabelText(/n.*mero de volumes originais/i)).toBeDisabled();
  });

  it("fecha dropdown multiplo ao clicar fora", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToPublicationStep();

    fireEvent.click(screen.getByLabelText(/selecionar g.*neros/i));
    expect(screen.getByRole("button", { name: /^acao$/i })).toBeInTheDocument();

    fireEvent.pointerDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /^acao$/i })).not.toBeInTheDocument();
    });
  });

  it("limpa o formulario ao clicar em limpar formulario", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await fillRequiredFields();

    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    fireEvent.click(screen.getByRole("button", { name: /voltar/i }));
    expect(screen.getAllByLabelText(/t.*tulo/i)[0]).toHaveValue("Naruto");
    expect(screen.getByLabelText(/url da capa/i)).toHaveValue("https://cdn.comanga.test/naruto.jpg");

    fireEvent.click(screen.getByRole("button", { name: /limpar formul.*rio/i }));

    expect(screen.getAllByLabelText(/t.*tulo/i)[0]).toHaveValue("");
    expect(screen.getByLabelText(/url da capa/i)).toHaveValue("");
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
  }, 30000);

  it("bloqueia autor duplicado antes de enviar para a API", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToAuthorsStep();

    await fillAuthorsFields();
    fireEvent.click(screen.getByRole("button", { name: /adicionar autor/i }));
    await chooseDropdownAt(/^autor$/i, 1, /masashi kishimoto/i);
    fireEvent.click(screen.getAllByLabelText(/selecionar papel/i)[1]);
    fireEvent.click(screen.getByRole("button", { name: /^arte$/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Autor duplicado!");
    });
    expect(api.post).not.toHaveBeenCalled();
  }, 30000);

  it("prioriza campos ausentes antes de acusar autores duplicados", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToAuthorsStep();
    fireEvent.click(screen.getByRole("button", { name: /adicionar autor/i }));
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByRole("heading", { name: /autor\(es\)/i })).toBeInTheDocument();
    expect(screen.getAllByText("Preencha o campo obrigatório.")).toHaveLength(4);
    expect(toast.error).not.toHaveBeenCalledWith("Autor duplicado!");
  });

  it("carrega uma Obra existente e envia somente a atualizacao", async () => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { options: formOptions } })
      .mockResolvedValueOnce({ data: { work: workDetail } });
    vi.mocked(api.patch).mockResolvedValueOnce({ data: { work: workDetail } });

    renderEditManga();

    expect(await screen.findByText(/atualize os dados da obra matriz/i)).toBeInTheDocument();
    expect(screen.getAllByLabelText(/t.*tulo/i)[0]).toHaveValue("Naruto");
    expect(screen.getByLabelText(/url da capa/i)).toHaveValue("https://cdn.comanga.test/naruto.jpg");

    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    expect(await screen.findByRole("heading", { name: /autor\(es\)/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    expect(await screen.findByLabelText(/editora original/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith("/admin/works/10", expect.objectContaining({
        title: "Naruto",
        typeId: 9,
        originalVolumeCount: 72,
      }));
    });
    expect(api.post).not.toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalledWith("Obra atualizada com sucesso.");
  }, 30000);

  it("volta para a Obra preservando o id no estado da navegacao", async () => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { options: formOptions } })
      .mockResolvedValueOnce({ data: { work: workDetail } });

    render(
      <MemoryRouter initialEntries={["/admin/obras/naruto/editar"]}>
        <Routes>
          <Route
            path="/admin/obras/naruto/editar"
            element={<NewManga mode="edit" workId="10" returnPath="/admin/obras/naruto" />}
          />
          <Route path="/admin/obras/naruto" element={<LocationStateProbe />} />
        </Routes>
      </MemoryRouter>
    );

    const backButton = await screen.findByRole("button", { name: /voltar/i });
    expect(backButton).toHaveClass("h-11");
    fireEvent.click(backButton);

    expect(await screen.findByText("Obra de retorno: 10")).toBeInTheDocument();
  });

  it("retorna a identificacao ao carregar outro workId", async () => {
    const secondWork = { ...workDetail, id: 11, title: "Bleach", originalTitle: "Bleach" };
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get)
      .mockResolvedValueOnce({ data: { options: formOptions } })
      .mockResolvedValueOnce({ data: { work: workDetail } })
      .mockResolvedValueOnce({ data: { options: formOptions } })
      .mockResolvedValueOnce({ data: { work: secondWork } });

    const view = render(
      <MemoryRouter>
        <NewManga mode="edit" workId="10" />
      </MemoryRouter>
    );
    expect(await screen.findByText(/atualize os dados da obra matriz/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    expect(await screen.findByRole("heading", { name: /autor\(es\)/i })).toBeInTheDocument();

    view.rerender(
      <MemoryRouter>
        <NewManga mode="edit" workId="11" />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByLabelText(/t.*tulo/i)[0]).toHaveValue("Bleach");
    });
    expect(screen.getByRole("button", { name: /continuar/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /autor\(es\)/i })).not.toBeInTheDocument();
  });

  it("exibe erro amigavel quando as opcoes do formulario nao carregam", async () => {
    vi.mocked(api.get).mockReset();
    vi.mocked(api.get).mockRejectedValueOnce(new Error("indisponivel"));

    renderNewManga();

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao carregar listas de cadastro.");
    });
  });

  it("marca os campos obrigatorios e exige uma capa importada", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));
    expect(screen.getAllByText(/preencha o campo obrigat/i).length).toBeGreaterThan(0);

    fireEvent.change(screen.getAllByLabelText(/t.*tulo/i)[0], { target: { value: "Naruto" } });
    fireEvent.change(screen.getByLabelText(/^t.*tulo original$/i), { target: { value: "Naruto" } });
    fireEvent.change(screen.getByLabelText(/url da capa/i), { target: { value: "ftp://capas.test/naruto.jpg" } });
    fireEvent.click(screen.getByRole("button", { name: /continuar/i }));

    expect(screen.getByText(/importe uma capa v.*lida antes de continuar/i)).toBeInTheDocument();
  });

  it("filtra um dropdown pesquisavel e informa quando nao ha resultado", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText(/pa.*s de origem/i));
    fireEvent.change(screen.getByPlaceholderText(/digite para buscar/i), { target: { value: "inexistente" } });

    expect(screen.getByText(/nenhum resultado encontrado/i)).toBeInTheDocument();
  });

  it("permite alternar papeis e remover autores adicionais", async () => {
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToAuthorsStep();
    await fillAuthorsFields();

    fireEvent.click(screen.getByRole("button", { name: /hist.*ria e arte/i }));
    fireEvent.click(screen.getByRole("button", { name: /fechar papel/i }));
    expect(screen.getByLabelText(/selecionar papel/i)).toHaveTextContent(/selecione/i);

    fireEvent.click(screen.getByRole("button", { name: /adicionar autor/i }));
    expect(screen.getAllByLabelText(/^autor$/i)).toHaveLength(2);
    fireEvent.click(screen.getAllByRole("button", { name: /remover autor/i })[1]);
    expect(screen.getAllByLabelText(/^autor$/i)).toHaveLength(1);
  }, 30000);

  it("salva publicacao em andamento sem fim nem total de volumes", async () => {
    vi.mocked(api.post).mockResolvedValueOnce({ data: { work: { id: 1, slug: "naruto", title: "Naruto" } } });
    renderNewManga();

    expect(await screen.findByRole("heading", { name: /novo mang/i })).toBeInTheDocument();
    await goToPublicationStep();
    await chooseDropdown(/editora original/i, /shueisha/i);
    await chooseDropdown(/status de publica.*o original/i, /em andamento/i);
    await chooseDropdown(/in.*cio da publica.*o original/i, /1999/i);
    fireEvent.click(screen.getByLabelText(/selecionar g.*neros/i));
    fireEvent.click(screen.getByRole("button", { name: /^acao$/i }));
    fireEvent.click(screen.getByRole("switch", { name: /lan.*amento direto/i }));
    fireEvent.click(screen.getByRole("button", { name: /^salvar$/i }));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith("/admin/works", expect.objectContaining({
        originalPublicationEndYear: null,
        originalVolumeCount: null,
        directRelease: true,
        demographies: [],
        magazineIds: [],
      }));
    });
  }, 30000);

});

