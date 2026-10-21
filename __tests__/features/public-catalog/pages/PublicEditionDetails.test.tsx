const auth = vi.hoisted(() => ({ user: null as { id: string } | null }));
vi.mock("@/features/auth", () => ({ useAuth: () => ({ user: auth.user, loading: false }) }));
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { AxiosError, AxiosHeaders } from "axios";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import PublicEditionDetails from "@/features/public-catalog/pages/PublicEditionDetails";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicEditionDetails: vi.fn(),
}));
vi.mock("sonner", () => ({ toast: { warning: vi.fn() } }));

const response = {
  edition: {
    id: 20,
    chronologicalNumber: 2,
    coverUrl: "https://cdn.comanga.test/monster-edition.jpg",
    brazilianPublisher: { id: 1, label: "Panini" },
    format: { id: 3, label: "Kanzenban" },
    coverType: { id: 4, label: "Capa dura" },
    papers: [{ id: 5, label: "Offset" }, { id: 6, label: "Couché" }],
    brazilPublicationStatus: "Em publicação",
    brazilPublicationStartYear: 2026,
    brazilPublicationEndYear: null,
    volumesCount: 25,
    work: {
      id: 8,
      slug: "monster",
      title: "Monster",
      originalTitle: "MONSTER",
      originalPublicationStatus: "Em andamento",
      authors: [{ id: 5, label: "Naoki Urasawa" }],
    },
  },
  volumes: [
    {
      id: 30,
      number: 1,
      singleVolume: false,
      coverUrl: "https://cdn.comanga.test/monster-volume-1.jpg",
      pages: 416,
      releaseDatePrecision: "Completa",
      releaseYear: 2026,
      releaseMonth: 8,
      releaseDay: 20,
    },
    {
      id: 31,
      number: 2,
      singleVolume: false,
      coverUrl: null,
      pages: null,
      releaseDatePrecision: "Ano",
      releaseYear: 2027,
      releaseMonth: null,
      releaseDay: null,
    },
  ],
  pagination: { page: 1, limit: 24, total: 25, totalPages: 2 },
};

it("mostra desejo nas capas e seu total no botão, sem etiquetas pessoais nas prévias", async () => {
  auth.user = { id: "account-a" };
  vi.mocked(getPublicEditionDetails).mockResolvedValue({
    ...response,
    edition: { ...response.edition, personal: { ownedCount: 0, readCount: 0, wishedCount: 1 } },
    volumes: response.volumes.map(volume => ({ ...volume, personal: { owned: false, read: null, wished: volume.id === 30 } })),
  });
  renderPage();
  const wishlistAction = await screen.findByRole("link", { name: "1/25 desejados" });
  expect(wishlistAction.querySelector("svg")).toHaveClass("lucide-heart");
  expect(wishlistAction.querySelector("svg")).toHaveAttribute("fill", "currentColor");
  expect(screen.getByRole("link", { name: "0/25 adquiridos" }).querySelector("svg")).toHaveClass("lucide-library-big");
  expect(screen.queryByText("Na lista de desejos")).not.toBeInTheDocument();
  expect(screen.queryByText(/Sua coleção:|Lidos:|Desejados:/)).not.toBeInTheDocument();
  expect(screen.queryByTitle("Na coleção")).not.toBeInTheDocument();
  expect(screen.getByTitle("Na lista de desejos")).toBeInTheDocument();
  expect(screen.getByTitle("Na lista de desejos")).toHaveClass("-left-1", "top-0", "h-6", "w-6");
  expect(screen.getByTitle("Na lista de desejos").querySelector("svg")).toHaveClass("h-4", "w-4");
});

it("marca somente a capa de Volume adquirido na Edição", async () => {
  vi.mocked(getPublicEditionDetails).mockResolvedValue({
    ...response,
    volumes: response.volumes.map(volume => ({ ...volume, personal: { owned: volume.id === 30, read: false, wished: volume.id === 31 } })),
  });
  renderPage();
  const ownedVolume = await screen.findByRole("link", { name: "Ver detalhes do Volume 1 (na coleção)" });
  expect(within(ownedVolume).getByTitle("Na coleção")).toBeInTheDocument();
  expect(screen.getAllByTitle("Na coleção")).toHaveLength(1);
  expect(screen.getByRole("link", { name: "Ver detalhes do Volume 2 (na lista de desejos)" })).toBeInTheDocument();
  expect(screen.getByTitle("Na lista de desejos")).toBeInTheDocument();
  expect(screen.queryByTitle("Lido")).not.toBeInTheDocument();
});

it("exibe os selos de adquirido e lido menores, lado a lado na capa", async () => {
  vi.mocked(getPublicEditionDetails).mockResolvedValue({
    ...response,
    volumes: response.volumes.map(volume => ({ ...volume, personal: { owned: volume.id === 30, read: volume.id === 30, wished: false } })),
  });
  renderPage();
  const ownedVolume = await screen.findByRole("link", { name: "Ver detalhes do Volume 1 (na coleção)" });
  const ownedBadge = within(ownedVolume).getByTitle("Na coleção");
  const readBadge = within(ownedVolume).getByTitle("Lido");
  expect(ownedBadge.parentElement).toBe(readBadge.parentElement);
  expect(ownedBadge.parentElement).toHaveClass("flex", "gap-1", "-left-1");
  expect(ownedBadge).toHaveClass("h-6", "w-6");
  expect(readBadge).toHaveClass("h-6", "w-6");
  expect(ownedBadge.querySelector("svg")).toHaveClass("h-4", "w-4");
  expect(readBadge.querySelector("svg")).toHaveClass("h-4", "w-4");
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location-search">{location.search}</output>;
}

function renderPage(entry = "/obra/monster/edicao/2?page=1") {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/obra/:slug/edicao/:editionNumber" element={<><PublicEditionDetails /><LocationProbe /></>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("PublicEditionDetails", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    auth.user = null;
    vi.mocked(getPublicEditionDetails).mockResolvedValue(response);
  });

  it("exibe a ficha editorial, a capa 2:3 e o vínculo contextual com a Obra", async () => {
    renderPage();

    expect(screen.getByText("Carregando edição...")).toBeInTheDocument();
    const editionHeading = await screen.findByRole("heading", { name: "2ª edição", level: 1 });
    expect(editionHeading).toBeInTheDocument();
    expect(getPublicEditionDetails).toHaveBeenCalledWith("monster", 2, { page: 1, limit: 24 });
    expect(screen.getByText("Obra")).toBeInTheDocument();
    const editionInfo = screen.getByRole("complementary", { name: "Informações da edição" });
    expect(within(editionInfo).getByRole("heading", { name: "Obra" })).toBeInTheDocument();
    const workLink = within(editionInfo).getByRole("link", { name: "Ver detalhes da obra Monster" });
    expect(workLink).toHaveAttribute("href", "/obra/monster");
    expect(workLink).toHaveClass("py-1", "rounded-2xl", "hover:bg-sidebar-accent/30");
    expect(screen.queryByText("MONSTER")).not.toBeInTheDocument();
    expect(screen.queryByText("Naoki Urasawa")).not.toBeInTheDocument();
    expect(screen.getByText("Panini")).toBeInTheDocument();
    expect(screen.queryByText("Tipo de Edição")).not.toBeInTheDocument();
    expect(screen.getByText("Kanzenban")).toBeInTheDocument();
    expect(screen.getByText("Capa dura")).toBeInTheDocument();
    expect(screen.getByText("Offset")).toBeInTheDocument();
    expect(screen.getByText("Couché")).toBeInTheDocument();
    const volumesHeading = screen.getByRole("heading", { name: "Em publicação com 25 volumes" });
    expect(volumesHeading).toHaveClass("text-xl", "font-normal");
    expect(volumesHeading).toHaveClass("mt-3");
    expect(editionHeading.parentElement?.nextElementSibling).toBe(volumesHeading);
    expect(screen.getByRole("region", { name: "Em publicação com 25 volumes" })).toHaveClass("border-t", "border-border");
    expect(screen.queryByText("Status no Brasil")).not.toBeInTheDocument();
    expect(screen.getByText("2026-??")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Coleção" }));
    expect(toast.warning).toHaveBeenCalledWith("Faça login para poder adicionar volumes desta edição à sua coleção.");
    fireEvent.click(screen.getByRole("button", { name: "Lista de desejos" }));
    expect(toast.warning).toHaveBeenCalledWith("Faça login para poder adicionar volumes desta edição à sua lista de desejos.");
    expect(screen.getByRole("heading", { name: "2ª edição", level: 1 })).toBeInTheDocument();
    const collectionAction = screen.getByRole("button", { name: "Coleção" });
    const wishlistAction = screen.getByRole("button", { name: "Lista de desejos" });
    expect(screen.getByText("Gerenciar volumes:")).toHaveClass("text-base", "font-bold", "leading-none");
    expect(collectionAction.parentElement).toBe(wishlistAction.parentElement);
    expect(collectionAction.parentElement).toHaveClass("grid", "grid-flow-col", "auto-cols-fr", "gap-2");
    expect(collectionAction.parentElement?.parentElement?.parentElement).toContainElement(editionHeading);
    expect(collectionAction).toHaveClass("h-10", "shrink-0", "whitespace-nowrap");
    expect(wishlistAction).toHaveClass("h-10", "shrink-0", "whitespace-nowrap");

    const cover = screen.getByAltText("Capa da 2ª edição de Monster");
    expect(cover).toHaveAttribute("src", response.edition.coverUrl);
    expect(cover.parentElement).toHaveClass("aspect-[2/3]");
    expect(cover.parentElement).not.toHaveClass("md:absolute");
    expect(cover.parentElement?.parentElement).toBe(editionInfo.parentElement);
    expect(editionInfo).toHaveClass("mt-7");
  });

  it("mantém os links de seleção para usuários autenticados", async () => {
    auth.user = { id: "account-a" };
    renderPage();
    await screen.findByRole("heading", { name: "2ª edição", level: 1 });
    expect(screen.getByRole("link", { name: "0/25 adquiridos" })).toHaveAttribute("href", "/obra/monster/edicao/2/selecionar/colecao");
    expect(screen.getByRole("link", { name: "0/25 desejados" })).toHaveAttribute("href", "/obra/monster/edicao/2/selecionar/desejos");
  });

  it("mostra o total adquirido da Edição em azul com o ícone de confirmação", async () => {
    auth.user = { id: "account-a" };
    vi.mocked(getPublicEditionDetails).mockResolvedValue({
      ...response,
      edition: { ...response.edition, personal: { ownedCount: 3, readCount: 1, wishedCount: 0 } },
      volumes: response.volumes.map(volume => ({ ...volume, personal: { owned: false, read: null, wished: false } })),
    });
    renderPage("/obra/monster/edicao/2?page=2");

    const collectionAction = await screen.findByRole("link", { name: "3/25 adquiridos" });
    expect(collectionAction).toHaveAttribute("href", "/obra/monster/edicao/2/selecionar/colecao");
    expect(collectionAction).toHaveClass("h-10", "shrink-0", "bg-primary", "text-primary-foreground");
    expect(collectionAction.querySelector("svg")).toHaveClass("lucide-check");
    expect(screen.getByRole("link", { name: "0/22 desejados" })).toHaveClass("h-10", "shrink-0", "bg-sidebar");
    const readAction = screen.getByRole("link", { name: "1/3 lidos" });
    expect(readAction).toHaveAttribute("href", "/obra/monster/edicao/2/selecionar/lidos");
    expect(readAction).toHaveClass("bg-primary", "text-primary-foreground");
    expect(readAction.querySelector("svg")).toHaveClass("lucide-eye");
    expect(collectionAction.compareDocumentPosition(readAction) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(readAction.compareDocumentPosition(screen.getByRole("link", { name: "0/22 desejados" })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(getPublicEditionDetails).toHaveBeenCalledWith("monster", 2, { page: 2, limit: 24 });
  });

  it("mostra 0/y volumes lidos em cinza com olho fechado quando há coleção sem leitura", async () => {
    auth.user = { id: "account-a" };
    vi.mocked(getPublicEditionDetails).mockResolvedValue({
      ...response,
      edition: { ...response.edition, personal: { ownedCount: 2, readCount: 0, wishedCount: 0 } },
    });
    renderPage();
    const readAction = await screen.findByRole("link", { name: "0/2 lidos" });
    expect(readAction).toHaveClass("bg-sidebar", "text-white");
    expect(readAction.querySelector("svg")).toHaveClass("lucide-eye-closed");
  });

  it("lista os Volumes em ordem recebida com data, fallback e acesso ao detalhe", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Em publicação com 25 volumes" });

    const headings = within(screen.getByRole("region", { name: "Em publicação com 25 volumes" }))
      .getAllByRole("heading", { level: 3 });
    expect(headings.map((heading) => heading.textContent)).toEqual(["Volume 1", "Volume 2"]);
    headings.forEach((heading) => expect(heading).toHaveClass("font-normal"));
    expect(screen.getByText("20/08/2026")).toBeInTheDocument();
    expect(screen.queryByText("416 páginas")).not.toBeInTheDocument();
    expect(screen.getByText("2027")).toBeInTheDocument();
    expect(screen.getByText("Sem capa")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ver detalhes do Volume 1" })).toHaveAttribute("href", "/obra/monster/edicao/2/volume/1");
    expect(screen.getByRole("link", { name: "Ver detalhes do Volume 2" })).toHaveAttribute("href", "/obra/monster/edicao/2/volume/2");
  });

  it("pagina os Volumes e preserva a página na URL", async () => {
    renderPage();
    await screen.findByRole("heading", { name: "Em publicação com 25 volumes" });

    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));

    await waitFor(() => expect(getPublicEditionDetails).toHaveBeenLastCalledWith("monster", 2, {
      page: 2,
      limit: 24,
    }));
    expect(new URLSearchParams(screen.getByTestId("location-search").textContent || "").get("page")).toBe("2");
  });

  it("exibe estado vazio quando não existem Volumes públicos", async () => {
    vi.mocked(getPublicEditionDetails).mockResolvedValue({
      ...response,
      volumes: [],
      pagination: { page: 1, limit: 24, total: 0, totalPages: 0 },
      edition: { ...response.edition, volumesCount: 0 },
    });
    renderPage();

    expect(await screen.findByText("Nenhum volume público cadastrado nesta edição.")).toBeInTheDocument();
  });

  it("mostra apenas o ano quando a publicação começou e terminou no mesmo ano", async () => {
    vi.mocked(getPublicEditionDetails).mockResolvedValue({
      ...response,
      edition: { ...response.edition, brazilPublicationEndYear: 2026 },
    });
    renderPage();
    expect(await screen.findByText("2026")).toBeInTheDocument();
    expect(screen.queryByText("2026-2026")).not.toBeInTheDocument();
  });

  it("exibe erro seguro e permite tentar novamente", async () => {
    const notFound = new AxiosError("Not found", "ERR_BAD_REQUEST", undefined, undefined, {
      data: { error: "Edição não encontrada." },
      status: 404,
      statusText: "Not Found",
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
    vi.mocked(getPublicEditionDetails)
      .mockRejectedValueOnce(notFound)
      .mockResolvedValueOnce(response);
    renderPage();

    expect(await screen.findByText("Edição não encontrada.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));

    await waitFor(() => expect(getPublicEditionDetails).toHaveBeenCalledTimes(2));
    expect(await screen.findByRole("heading", { name: "2ª edição" })).toBeInTheDocument();
  });
});
