export function validatePassword(password: string): string {
  if (!password) return "Informe uma senha.";
  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/.test(password)) {
    return "Utilize no mínimo 8 caracteres, incluindo pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial.";
  }
  if (new TextEncoder().encode(password).length > 72) {
    return "A senha deve ter no máximo 72 bytes em UTF-8; acentos e emojis podem ocupar mais de um byte.";
  }
  return "";
}
