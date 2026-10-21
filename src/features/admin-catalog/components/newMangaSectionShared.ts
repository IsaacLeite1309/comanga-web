import type { NewMangaController } from '../hooks/useNewMangaForm';

export type { ControllerProps };
export { errorMessage };

type ControllerProps = { controller: NewMangaController };

function errorMessage(controller: NewMangaController, field: string) {
  if (!controller.isInvalidField(field)) return "";
  return "Preencha o campo obrigatório.";
}
