export function validateAccessPassword(
  password: string,
  confirm: string,
): string | null {
  if (password.length < 8) {
    return "Use pelo menos 8 caracteres na senha.";
  }
  if (password !== confirm) {
    return "As senhas não coincidem.";
  }
  return null;
}
