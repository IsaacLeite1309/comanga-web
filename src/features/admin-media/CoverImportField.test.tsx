import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CoverImportField } from "./CoverImportField";
import { adminMediaService } from "./adminMediaService";

vi.mock("./adminMediaService", () => ({
  adminMediaService: {
    importCover: vi.fn(),
    deletePendingCover: vi.fn(),
  },
}));

describe("CoverImportField", () => {
  beforeEach(() => vi.clearAllMocks());

  it("só mostra prévia depois que a API retorna uma capa interna", async () => {
    vi.mocked(adminMediaService.importCover).mockResolvedValue({
      id: "asset-id",
      coverUrl: "https://media.comanga.test/covers/id/large.webp",
    });
    const onChange = vi.fn();
    const { rerender } = render(<CoverImportField label="Capa da Obra" value={null} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("URL de origem da Capa da Obra"), {
      target: { value: "https://bbm.test/capa.jpg" },
    });
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Importar capa" }));

    await waitFor(() => expect(onChange).toHaveBeenCalledWith({
      assetId: "asset-id",
      coverUrl: "https://media.comanga.test/covers/id/large.webp",
      pending: true,
    }));
    expect(document.querySelector('img[src="https://bbm.test/capa.jpg"]')).not.toBeInTheDocument();

    rerender(<CoverImportField
      label="Capa da Obra"
      value={{ assetId: "asset-id", coverUrl: "https://media.comanga.test/covers/id/large.webp", pending: true }}
      onChange={onChange}
    />);
    expect(screen.getByAltText("Prévia interna da Capa da Obra")).toHaveAttribute(
      "src",
      "https://media.comanga.test/covers/id/large.webp",
    );
  });

  it("preserva a capa anterior quando a importação falha", async () => {
    vi.mocked(adminMediaService.importCover).mockRejectedValue(new Error("Formato inválido"));
    const current = { assetId: "old-id", coverUrl: "https://media.test/old.webp", pending: false };
    const onChange = vi.fn();
    render(<CoverImportField label="Capa" value={current} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("URL de origem da Capa"), {
      target: { value: "https://origem.test/invalida.svg" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Substituir capa" }));
    expect(screen.getByRole("dialog", { name: "Substituir capa?" })).toBeInTheDocument();
    expect(adminMediaService.importCover).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar substituição" }));

    expect(await screen.findByText("Formato inválido")).toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("img")).toHaveAttribute("src", current.coverUrl);
  });

  it("ignora cliques repetidos enquanto a importação está em andamento", async () => {
    let finishImport: ((value: { id: string; coverUrl: string }) => void) | undefined;
    vi.mocked(adminMediaService.importCover).mockImplementation(() => new Promise((resolve) => {
      finishImport = resolve;
    }));
    const onChange = vi.fn();
    render(<CoverImportField label="Capa" value={null} onChange={onChange} />);

    fireEvent.change(screen.getByLabelText("URL de origem da Capa"), {
      target: { value: "https://origem.test/capa.jpg" },
    });
    const button = screen.getByRole("button", { name: "Importar capa" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(adminMediaService.importCover).toHaveBeenCalledTimes(1);
    finishImport?.({ id: "asset-id", coverUrl: "https://media.test/capa.webp" });
    await waitFor(() => expect(onChange).toHaveBeenCalledTimes(1));
  });

  it("confirma a remoção e descarta imediatamente apenas ativos pendentes", async () => {
    vi.mocked(adminMediaService.deletePendingCover).mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<CoverImportField
      label="Capa"
      value={{ assetId: "pending-id", coverUrl: "https://media.test/pending.webp", pending: true }}
      onChange={onChange}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Remover capa" }));
    expect(screen.getByRole("dialog", { name: "Remover capa?" })).toBeInTheDocument();
    expect(adminMediaService.deletePendingCover).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Confirmar remoção" }));

    await waitFor(() => expect(adminMediaService.deletePendingCover).toHaveBeenCalledWith("pending-id"));
    expect(onChange).toHaveBeenCalledWith(null);
  });

  it("cancela a remoção pelo diálogo do sistema sem alterar a capa", () => {
    const onChange = vi.fn();
    render(<CoverImportField
      label="Capa"
      value={{ assetId: "asset-id", coverUrl: "https://media.test/capa.webp", pending: false }}
      onChange={onChange}
    />);

    fireEvent.click(screen.getByRole("button", { name: "Remover capa" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(adminMediaService.deletePendingCover).not.toHaveBeenCalled();
  });
});
