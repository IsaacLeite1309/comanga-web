import { describe, expect, it } from "vitest";
import {
  editionAdminPath,
  editionEditAdminPath,
  newEditionAdminPath,
  newVolumeAdminPath,
  volumeAdminPath,
  volumeEditAdminPath,
  workAdminPath,
  workEditAdminPath,
} from "@/lib/catalogPaths";

describe("caminhos administrativos do catálogo", () => {
  it("constrói o caminho canônico da Obra a partir do slug", () => {
    expect(workAdminPath("pluto")).toBe("/admin/editar-mangas/obras/pluto");
  });

  it("preserva um slug já codificado sem aplicar codificação dupla", () => {
    expect(workAdminPath("obra%20especial")).toBe("/admin/editar-mangas/obras/obra%20especial");
  });

  it("encadeia os identificadores de Edição e Volume no contexto da Obra", () => {
    expect(workEditAdminPath("pluto")).toBe("/admin/editar-mangas/obras/pluto/editar");
    expect(newEditionAdminPath("pluto")).toBe("/admin/editar-mangas/obras/pluto/edicoes/nova");
    expect(editionAdminPath("pluto", 2)).toBe("/admin/editar-mangas/obras/pluto/edicoes/2");
    expect(editionEditAdminPath("pluto", 2)).toBe(
      "/admin/editar-mangas/obras/pluto/edicoes/2/editar",
    );
    expect(newVolumeAdminPath("pluto", 2)).toBe(
      "/admin/editar-mangas/obras/pluto/edicoes/2/volumes/novo",
    );
    expect(volumeAdminPath("pluto", 2, 7)).toBe(
      "/admin/editar-mangas/obras/pluto/edicoes/2/volumes/7",
    );
    expect(volumeEditAdminPath("pluto", 2, 7)).toBe(
      "/admin/editar-mangas/obras/pluto/edicoes/2/volumes/7/editar",
    );
  });
});
