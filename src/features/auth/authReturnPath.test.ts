import { describe, expect, it } from "vitest";
import { authReturnPath } from "./authReturnPath";
describe("retorno após autenticação", () => {
  it("preserva contexto local e parâmetros", () => {
    expect(authReturnPath({ from: { pathname: "/obra/monster/edicao/1/selecionar/colecao", search: "?page=2", hash: "#volume" } }, "/perfil")).toBe("/obra/monster/edicao/1/selecionar/colecao?page=2#volume");
  });
  it.each([undefined, null, {}, { from: null }, { from: {} }, { from: { pathname: 1 } }, { from: { pathname: "//externo.test" } }, { from: { pathname: "/\\externo.test" } }, { from: { pathname: "https://externo.test" } }, { from: { pathname: "/entrar" } }, { from: { pathname: "/cadastrar" } }, { from: { pathname: "/a\n" } }])("recusa destinos inválidos e usa perfil: %j", (state) => {
    expect(authReturnPath(state, "/perfil/teste")).toBe("/perfil/teste");
  });
  it("ignora sufixos inválidos", () => {
    expect(authReturnPath({ from: { pathname: "/colecao", search: "externo", hash: 3 } }, "/perfil")).toBe("/colecao");
  });
});
