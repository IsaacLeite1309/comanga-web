import { describe, expect, it } from "vitest";
import { getApiError } from "@/lib/apiError";

describe("getApiError", () => {
  it("retorna a mensagem segura enviada pela API", () => {
    expect(
      getApiError(
        {
          isAxiosError: true,
          response: { data: { error: "Obra não encontrada." } },
        },
        "Não foi possível concluir a operação.",
      ),
    ).toBe("Obra não encontrada.");
  });

  it("usa a mensagem alternativa para falhas sem contrato reconhecido", () => {
    expect(getApiError(new Error("detalhe interno"), "Falha segura.")).toBe("Falha segura.");
  });
});
