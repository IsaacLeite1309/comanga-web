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
  return <><output data-testid="search">{location.search}</output><button type="button" onClick={() => navigate(-1)}>Voltar histórico</button></>;
}

function renderCalendar(entry = "/calendario") {
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

  it("usa o período do servidor e agrupa datas completas e sem dia sem inventar data", async () => {
    renderCalendar();
    expect(screen.getByText("Carregando calendário...")).toHaveAttribute("role", "status");
    expect(await screen.findByRole("heading", { name: "09/12/2026" })).toBeInTheDocument();
    expect(listPublicCalendar).toHaveBeenCalledWith({ page: 1, limit: 24 });
    expect(screen.getByLabelText("Mês e ano")).toHaveValue("2026-12");
    expect(screen.getByRole("link", { name: "Ver volume 2 de Monster" })).toHaveAttribute("href", "/obras/monster/edicao/1/volume/2");
    const undated = screen.getByRole("region", { name: "Publicações: Dia não informado" });
    expect(within(undated).getByText("12/2026")).toBeInTheDocument();
    expect(within(undated).queryByText("01/12/2026")).not.toBeInTheDocument();
    expect(within(undated).getByText("Sem capa")).toBeInTheDocument();
  });

  it("navega na virada do ano, escolhe período e preserva filtros combinados na paginação", async () => {
    renderCalendar("/calendario?year=2026&month=12&term=Urasawa&brazilianPublisherId=3&page=2");
    await screen.findByText("25 Volumes encontrados");
    fireEvent.click(screen.getByRole("button", { name: "Próximo mês" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2027, month: 1, term: "Urasawa", brazilianPublisherId: 3, page: 1 })));
    fireEvent.change(screen.getByLabelText("Mês e ano"), { target: { value: "2025-02" } });
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2025, month: 2 })));
    await screen.findByText("25 Volumes encontrados");
    fireEvent.click(screen.getByRole("button", { name: "Próxima" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: 2025, month: 2, page: 2, term: "Urasawa", brazilianPublisherId: 3 })));
    fireEvent.click(screen.getByRole("button", { name: "Mês anterior" }));
    await waitFor(() => expect(currentParams().get("month")).toBe("1"));
    fireEvent.click(screen.getByRole("button", { name: "Mês atual" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ year: undefined, month: undefined, term: "Urasawa", brazilianPublisherId: 3 })));
  });

  it("combina pesquisa e editora, limpa filtros e restaura a busca ao voltar pelo histórico", async () => {
    renderCalendar("/calendario?year=2026&month=12&page=2");
    await screen.findByText("25 Volumes encontrados");
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "  Naoki Urasawa  " } });
    fireEvent.click(screen.getByRole("button", { name: "Pesquisar" }));
    await waitFor(() => expect(currentParams().get("term")).toBe("Naoki Urasawa"));
    fireEvent.click(screen.getByLabelText("Editora brasileira"));
    fireEvent.click(screen.getByRole("button", { name: "Panini" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ term: "Naoki Urasawa", brazilianPublisherId: 3, page: 1 })));
    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveValue(""));
    expect(currentParams().get("year")).toBe("2026");
    expect(currentParams().has("brazilianPublisherId")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Voltar histórico" }));
    await waitFor(() => expect(screen.getByRole("searchbox")).toHaveValue("Naoki Urasawa"));
  });

  it("informa mês vazio e recupera falhas de consulta e das editoras separadamente", async () => {
    vi.mocked(listPublicCalendar).mockRejectedValueOnce(new Error("offline")).mockResolvedValue({ ...response, volumes: [], pagination: { ...response.pagination, total: 0, totalPages: 0 } });
    vi.mocked(getPublicCatalogOptions).mockRejectedValueOnce(new Error("offline"));
    renderCalendar();
    expect(await screen.findByText("Não foi possível carregar o calendário.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("Nenhum Volume encontrado neste mês com os filtros selecionados.")).toBeInTheDocument();
    expect(screen.getByLabelText("Editora brasileira")).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Tentar carregar editoras" }));
    await waitFor(() => expect(screen.getByLabelText("Editora brasileira")).not.toBeDisabled());
  });

  it.each(["month=13", "year=1899", "page=-1", "brazilianPublisherId=x", "month=", `term=${"a".repeat(256)}`])("trata parâmetro inválido %s sem solicitar calendário", async query => {
    renderCalendar(`/calendario?${query}`);
    expect(await screen.findByRole("button", { name: "Voltar ao mês atual" })).toBeInTheDocument();
    expect(listPublicCalendar).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Voltar ao mês atual" }));
    expect(await screen.findByText("25 Volumes encontrados")).toBeInTheDocument();
  });

  it.each(["1900-01", "2200-12"])("respeita o limite do período %s", async value => {
    const [year, month] = value.split("-");
    renderCalendar(`/calendario?year=${year}&month=${month}`);
    await screen.findByText("25 Volumes encontrados");
    expect(screen.getByRole("button", { name: year === "1900" ? "Mês anterior" : "Próximo mês" })).toBeDisabled();
  });

  it.each([0, 1])("recupera URL antiga com página além do total de %i Volumes", async total => {
    vi.mocked(listPublicCalendar).mockResolvedValueOnce({ ...response, volumes: [], pagination: { ...response.pagination, page: 3, total, totalPages: total } });
    renderCalendar("/calendario?year=2026&month=12&brazilianPublisherId=3&term=Monster&page=3");
    fireEvent.click(await screen.findByRole("button", { name: "Voltar à primeira página" }));
    await waitFor(() => expect(listPublicCalendar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, year: 2026, month: 12, term: "Monster", brazilianPublisherId: 3 })));
    expect(await screen.findByText("25 Volumes encontrados")).toBeInTheDocument();
  });

  it("ignora resposta antiga após trocar o mês", async () => {
    let resolvePrevious!: (data: PublicCalendarResponse) => void;
    vi.mocked(listPublicCalendar).mockImplementationOnce(() => new Promise(resolve => { resolvePrevious = resolve; }));
    renderCalendar();
    fireEvent.change(screen.getByLabelText("Mês e ano"), { target: { value: "2027-02" } });
    await screen.findByText("25 Volumes encontrados");
    expect(screen.getByLabelText("Mês e ano")).toHaveValue("2027-02");
    await act(async () => resolvePrevious({ ...response, volumes: [], year: 2000, month: 1 }));
    expect(screen.getByLabelText("Mês e ano")).toHaveValue("2027-02");
    expect(screen.getByText("25 Volumes encontrados")).toBeInTheDocument();
  });
});
