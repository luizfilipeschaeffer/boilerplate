/** Textos compartilhados — login por código no e-mail. */
export const LOGIN_CODE_GENERIC_SENT =
  "Se existir uma conta com este e-mail, enviamos um código de acesso. Confira sua caixa de entrada e o spam.";

export const LOGIN_CODE_INVALID =
  "Código inválido ou expirado. Tente novamente ou solicite um novo código.";

export function firstAccessLoginInstructions(email: string): string {
  const e = email.trim();
  return `Perfeito! Seu painel está configurado. Para o **primeiro acesso**, vá em **Entrar**, informe **${e}**, escolha **Entrar com código por e-mail** e use o código que enviaremos. Você pode criar uma senha depois em Conta → Senha, se quiser.`;
}

export function signupFinishLoginInstructions(email: string): string {
  const e = email.trim();
  return `Conta criada! Acesse **Entrar**, use **${e}** e a opção **Entrar com código por e-mail** para entrar no painel.`;
}
