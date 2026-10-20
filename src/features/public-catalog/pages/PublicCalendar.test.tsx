import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import PublicCalendar from "./PublicCalendar";
import { getPublicCatalogOptions, listPublicCalendar } from "@/features/public-catalog/publicCatalogService";
import type { PublicCalendarResponse } from "@/features/public-catalog/publicCatalogTypes";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({ getPublicCatalogOptions: vi.fn(), listPublicCalendar: vi.fn() }));

const response: PublicCalendarResponse = {
  year: 2026,
  month: 12,
  volumes: [
    { id: 1, number: 2, singleVolume: false, coverUrl: "https://cdn.comanga.test/monster.jpg", releaseDatePrecision: "Completa", releaseYear: 2026, releaseMonth: 12, releaseDay: 9, edition: { id: 2, chronologicalNumber: 1, brazilianPublisher: { id: 3, label: "Panini" }, work: { id: 4, slug: "monster", title: "Monster", originalTitle: "MONSTER" } } },
    { id: 5, number: 1, singleVolume: true, coverUrl: null, releaseDatePrecision: "Mes e ano", releaseYear: 2026, releaseMonth: 12, releaseDay: null, edition: { id: 6, chronologicalNumber: 2, brazilianPublisher: { id: 3, label: "Panini" }, work: { id: 7, slug: "pluto", title: "Pluto" } } },
  ],
  pagination: { page: 1, limit: 24, total: 25, totalPages: 2 },
};

function LocationProbe() {
  const location = useLocation();
  const navigate = useNavigate();
  return <><output data-testid="search">{location.search}</output><output data-testid="origin">{location.state?.catalogOrigin ?? ""}</output><button type="button" onClick={() => navigate(-1)}>Voltar histórico</button></>;
}

function renderCalendar(entry = "/lancamentos") {
  return render(<MemoryRouter initialEntries={[entry]}><PublicCalendar /><LocationProbe /></MemoryRouter>);
}

function currentParams() {
  return new URLSearchParams(screen.getByTestId("search").textContent || "");
}

describe("PublicCalendar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(listPublicCalendar).mockImplementation(async query => ({ ...response, year: query.year ?? response.year, month: query.month ?? response.month, pagination: { ...response.pagination, page: query.page } }));
    vi.mocked(getPublicCatalogOptions).mockResolvedValue({ brazilianPublishers: [{ id: 3, label: "Panini" }] } as Awaited<ReturnType<typeof getPublicCatalogOptions>>);
  });

  it("usa o período do servidor e reúne todos os volumes do mês sem agrupar por dia", async () => {
    renderCalendar();
    expect(screen.getByText("Carregando lançamentos...")).toHaveAttribute("role", "status");
    expect(screen.getByRole("searchbox", { name: "Pesquisar nos lançamentos" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mês atual" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Mês e ano" })).toBeDisabled();
    const results = await screen.findByRole("region", { name: "Volumes encontrados neste mês" });
    expect(screen.getByRole("searchbox", { name: "Pesquisar nos lançamentos" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Mês atual" })).toBeEnabled();
    expect(listPublicCalendar).toHaveBeenCalledWith({ page: 1, limit: 24, order: "ASC" });
    expect(screen.getByRole("button", { name: "Mês e ano" })).toHaveTextContent("dezembro de 2026");
    expect(screen.getByRole("link", { name: "Ver volume 2 de Monster" })).toHaveAttribute("href", "/obra/monster/edicao/1/volume/2");
    expect(within(results).getByText("Volume 2 · 1ª edição")).toBeInTheDocument();
    expect(within(results).getByAltText("Capa de Monster — Volume 2").parentElement).toHaveClass("group-hover:-translate-y-1");
    expect(within(results).queryByText("Panini")).not.toBeInTheDocument();
    expect(within(results).queryByText("09/12/2026")).not.toBeInTheDocument();
    expect(within(results).getByText("Sem capa")).toBeInTheDocument();
    expect(screen.queryByText("Dia não informado")).not.toBeInTheDocument();
    expect(screen.queryByText("Consulte os Volumes previstos para cada mês, ordenados pelo título da Obra.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Pesquisar" })).not.toBeInTheDocument();
  });

  it("leva o contexto do checklist ao abrir um Volume", async () => {
    renderCalendar();
    fireEvent.click(await screen.findByRole("link", { name: "Ver volume 2 de Monster" }));
    expect(screen.getByTestId("origin")).toHaveTextContent("checklist");
  });

  it("navega na virada do ano, escolhe período e preserva filtros combinados na paginação", async () => {
    renderCalendar("/lancamentos?year=2026&month=12&term=Urasawa&brazilianPublisherId=3&page=2");
    await screen.findByText("25 volumes encontrados");
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2027, month: 1, term: "Urasawa", brazilianPublisherId: 3, page: 1 })));
    fireEvent.click(screen.getByRole("button", { name: "Mês e ano" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ano" }), { target: { value: "2025" } });
    fireEvent.click(screen.getByRole("button", { name: "Selecionar fevereiro de 2025" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2025, month: 2 })));
    await screen.findByText("25 volumes encontrados");
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2025, month: 2, page: 2, term: "Urasawa", brazilianPublisherId: 3 })));
    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    await waitFor(() => expect(currentParams().get("month")).toBe("1"));
    fireEvent.click(screen.getByRole("button", { name: "Mês atual" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: undefined, month: undefined, term: "Urasawa", brazilianPublisherId: 3 })));
  });

  it("oferece um seletor de mês no tema do site e valida o ano antes de consultar", async () => {
    renderCalendar("/lancamentos?year=2026&month=12");
    fireEvent.click(screen.getByRole("button", { name: "Mês e ano" }));
    const picker = screen.getByRole("dialog", { name: "Selecionar mês e ano" });
    expect(picker).toHaveClass("bg-sidebar");
    expect(picker).toHaveClass("inset-x-0");
    expect(within(picker).getByRole("button", { name: "Selecionar janeiro de 2026" }).parentElement).toHaveClass("grid-cols-3");
    expect(within(picker).getByRole("button", { name: "Selecionar dezembro de 2026" })).toHaveClass("bg-primary", "text-primary-foreground");
    expect(screen.getByRole("button", { name: "Mês anterior" }).parentElement).toHaveClass("bg-sidebar");
    expect(screen.getByRole("button", { name: "Mês anterior" }).parentElement).toBe(screen.getByRole("button", { name: "Próximo mês" }).parentElement);
    expect(screen.getByRole("button", { name: "Mês e ano" }).parentElement?.children).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Mês atual" })).toHaveClass("bg-sidebar");
    expect(screen.getByRole("searchbox", { name: "Pesquisar nos lançamentos" })).toHaveClass("focus:border-primary");
    expect(screen.getByRole("searchbox", { name: "Pesquisar nos lançamentos" })).not.toHaveClass("focus:ring-2");
    fireEvent.change(within(picker).getByRole("textbox", { name: "Ano" }), { target: { value: "1899" } });
    expect(within(picker).getByText("Escolha um ano entre 1900 e 2200.")).toBeInTheDocument();
    expect(within(picker).getByRole("button", { name: "Selecionar janeiro de 1899" })).toBeDisabled();
    fireEvent.change(within(picker).getByRole("textbox", { name: "Ano" }), { target: { value: "2027" } });
    fireEvent.click(within(picker).getByRole("button", { name: "Selecionar janeiro de 2027" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2027, month: 1 })));
    expect(screen.queryByRole("dialog", { name: "Selecionar mês e ano" })).not.toBeInTheDocument();
  });

  it("combina pesquisa e editora sem exibir botão de limpar filtros", async () => {
    renderCalendar("/lancamentos?year=2026&month=12&page=2");
    await screen.findByText("25 volumes encontrados");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  Naoki Urasawa  " } });
    await waitFor(() => expect(currentParams().get("term")).toBe("Naoki Urasawa"));
    fireEvent.click(screen.getByLabelText("Editora brasileira"));
    fireEvent.click(screen.getByRole("button", { name: "Panini" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ term: "Naoki Urasawa", brazilianPublisherId: 3, page: 1 })));
    expect(screen.queryByRole("button", { name: "Limpar filtros" })).not.toBeInTheDocument();
    expect(currentParams().get("year")).toBe("2026");
    expect(currentParams().get("brazilianPublisherId")).toBe("3");
  });

  it("inverte a ordenação alfabética do mês sem perder filtros e reinicia a paginação", async () => {
    renderCalendar("/lancamentos?year=2026&month=12&term=Monster&page=2");
    await screen.findByText("25 volumes encontrados");
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por título de Z a A" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2026, month: 12, term: "Monster", order: "DESC", page: 1 })));
    expect(currentParams().get("order")).toBe("DESC");
    fireEvent.click(screen.getByRole("button", { name: "Ordenar por título de A a Z" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ order: "ASC", page: 1 })));
    expect(currentParams().has("order")).toBe(false);
  });

  it("informa mês vazio e recupera falhas de consulta e das editoras separadamente", async () => {
    vi.mocked(listPublicCalendar).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ...response, volumes: [], pagination: { ...response.pagination, total: 0, totalPages: 0 } });
    vi.mocked(getPublicCatalogOptions).mockRejectedValueOnce(new Error("offline"));
    renderCalendar();
    expect(await screen.findByText("Não foi possível carregar os lançamentos.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Nenhum volume encontrado neste mês com os filtros selecionados.")).toBeInTheDocument();
    expect(screen.getByLabelText("Editora brasileira")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Tentar carregar editoras" }));
    await waitFor(() => expect(screen.getByLabelText("Editora brasileira")).not.toBeDisabled());
  });

  it.each(["month=13", "year=1899", "page=-1", "brazilianPublisherId=x", "month=", "order=INVALID", `term=${"a".repeat(256)}`])("trata parâmetro inválido %s sem solicitar checklist", async query => {
    renderCalendar(`/lancamentos?${query}`);
    expect(await screen.findByRole("button", { name: "Voltar ao mês atual" })).toBeInTheDocument();
    expect(listPublicCalendar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao mês atual" }));
    expect(await screen.findByText("25 volumes encontrados")).toBeInTheDocument();
  });

  it.each(["1900-01", "2200-12"])("respeita o limite do período %s", async value => {
    const [year, month] = value.split("-");
    renderCalendar(`/lancamentos?year=${year}&month=${month}`);
    await screen.findByText("25 volumes encontrados");
    expect(screen.getByRole("button", { name: year === "1900" ? "Mês anterior" : "Próximo mês" })).toBeDisabled();
  });

  it.each([0, 1])("recupera URL antiga com página além do total de %i Volumes", async total => {
    vi.mocked(listPublicCalendar).mockResolvedValueOnce({ ...response, volumes: [], pagination: { ...response.pagination, page: 3, total, totalPages: total } });
    renderCalendar("/lancamentos?year=2026&month=12&brazilianPublisherId=3&term=Monster&page=3");
    fireEvent.click(await screen.findByRole("button", { name: "Voltar à primeira página" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, year: 2026, month: 12, term: "Monster", brazilianPublisherId: 3 })));
    expect(await screen.findByText("25 volumes encontrados")).toBeInTheDocument();
  });

  it("ignora resposta antiga após trocar o mês", async () => {
    let resolvePrevious!: (data: PublicCalendarResponse) => void;
    vi.mocked(listPublicCalendar).mockImplementationOnce(() => new Promise(resolve => { resolvePrevious = resolve; }));
    renderCalendar("/lancamentos?year=2026&month=12");
    fireEvent.click(screen.getByRole("button", { name: "Mês e ano" }));
    fireEvent.change(screen.getByRole("textbox", { name: "Ano" }), { target: { value: "2027" } });
    fireEvent.click(screen.getByRole("button", { name: "Selecionar fevereiro de 2027" }));
    await screen.findByText("25 volumes encontrados");
    expect(screen.getByRole("button", { name: "Mês e ano" })).toHaveTextContent("fevereiro de 2027");
    await act(async () => resolvePrevious({ ...response, volumes: [], year: 2000, month: 1 }));
    expect(screen.getByRole("button", { name: "Mês e ano" })).toHaveTextContent("fevereiro de 2027");
    expect(screen.getByText("25 volumes encontrados")).toBeInTheDocument();
  });
});
