import { describe, expect, it } from "vitest";
import { validatePassword } from "./passwordValidation";

describe("validação de senha da autenticação", () => {
  it.each([
    ["", "Informe uma senha"],
    ["fraca", "Utilize no mínimo"],
    ["A1!" + "a".repeat(69), ""],
    ["A1!" + "a".repeat(70), "72 bytes"],
    ["Aa1!" + "é".repeat(34), ""],
    ["Aa1!" + "é".repeat(35), "72 bytes"],
    ["Aa1!" + "😀".repeat(17), ""],
    ["Aa1!" + "😀".repeat(18), "72 bytes"],
  ])("valida complexidade e bytes: %s", (password, error) => {
    if (error) expect(validatePassword(password)).toContain(error);
    else expect(validatePassword(password)).toBe("");
  });
});
