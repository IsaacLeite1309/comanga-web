import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import EditionVolumeSelection from "./EditionVolumeSelection";
import { getPublicEditionDetails } from "@/features/public-catalog/publicCatalogService";

vi.mock("@/features/public-catalog/publicCatalogService", () => ({
  getPublicEditionDetails: vi.fn(),
}));

const response = {
  edition: {
    id: 20,
    chronologicalNumber: 1,
    coverUrl: null,
    brazilianPublisher: { id: 1, label: "Panini" },
    format: { id: 3, label: "Tankobon" },
    coverType: { id: 4, label: "Brochura" },
    brazilPublicationStatus: "Em publicação",
    volumesCount: 2,
    work: {
      id: 8,
      slug: "monster",
      title: "Monster",
      originalTitle: "MONSTER",
      authors: [{ id: 5, label: "Naoki Urasawa" }],
    },
  },
  volumes: [
    {
      id: 30,
      number: 1,
      singleVolume: false,
      coverUrl: "https://cdn.comanga.test/monster-volume-1.jpg",
      pages: 200,
      releaseDatePrecision: "Ano",
      releaseYear: 2026,
      releaseMonth: null,
      releaseDay: null,
    },
    {
      id: 31,
      number: 2,
      singleVolume: false,
      coverUrl: null,
      pages: 210,
      releaseDatePrecision: "Ano",
      releaseYear: 2026,
      releaseMonth: null,
      releaseDay: null,
    },
  ],
  pagination: { page: 1, limit: 50, total: 2, totalPages: 1 },
};

function renderPage(mode = "estante") {
  return render(
    <MemoryRouter initialEntries={[`/edicoes/20/selecionar/${mode}`]}>
      <Routes>
        <Route path="/edicoes/:editionId/selecionar/:mode" element={<EditionVolumeSelection />} />
        <Route path="/edicoes/:editionId" element={<div>Edição</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("EditionVolumeSelection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getPublicEditionDetails).mockResolvedValue(response);
  });

  it("seleciona Volumes apenas no estado visual da tela", async () => {
    renderPage();

    expect(await screen.findByText("0 de 2 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Desmarcar todos" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Selecionar todos" })).toBeEnabled();
    expect(screen.getByRole("link", { name: "Cancelar" })).toBeEnabled();

    const firstVolume = screen.getByRole("button", { name: "Selecionar Volume 1" });
    fireEvent.click(firstVolume);

    expect(screen.getByRole("button", { name: "Desmarcar Volume 1" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText("1 de 2 selecionados")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "OK" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Desmarcar todos" })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: "Selecionar todos" }));
    expect(screen.getByRole("button", { name: "Selecionar todos" })).toBeDisabled();
  });

  it("reutiliza a tela para a Lista de Desejos sem exibir um título redundante", async () => {
    renderPage("desejos");

    expect(await screen.findByText("0 de 2 selecionados")).toBeInTheDocument();
    expect(screen.queryByText("Adicionar à Lista de Desejos")).not.toBeInTheDocument();
    expect(screen.queryByText("Monster · 1ª Edição")).not.toBeInTheDocument();
  });
});
