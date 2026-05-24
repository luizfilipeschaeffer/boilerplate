const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

const MAX_BYTES = 5 * 1024 * 1024;

export class UploadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UploadValidationError";
  }
}

export function validateUpload(file: {
  name: string;
  type: string;
  size: number;
}): { safeName: string } {
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100);
  if (!ALLOWED_MIME.has(file.type)) {
    throw new UploadValidationError("Tipo de arquivo não permitido.");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadValidationError("Arquivo excede o tamanho máximo de 5 MB.");
  }
  if (!safeName) {
    throw new UploadValidationError("Nome de arquivo inválido.");
  }
  return { safeName };
}
