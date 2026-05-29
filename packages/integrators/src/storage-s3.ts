export type ResolvedCredentials = {
  secrets: Record<string, string>;
  configPublic: Record<string, unknown>;
  source: "tenant" | "platform" | "mock";
};

export type StorageAdapter = {
  put(key: string, data: Buffer | Uint8Array): Promise<{ url: string }>;
  get(key: string): Promise<Buffer | null>;
};

export type StoragePutResult = {
  url: string;
  key: string;
};

const memoryStore = new Map<string, Buffer>();

/**
 * Adapter de storage compatível com S3/R2.
 * Em produção o host resolve credenciais via resolveIntegrator; sem process.env no módulo.
 */
export function createStorageS3Adapter(credentials: ResolvedCredentials): StorageAdapter {
  const bucket =
    (credentials.configPublic.bucket as string) ??
    (credentials.secrets.bucket as string) ??
    "civil-obras";
  const baseUrl =
    (credentials.configPublic.publicBaseUrl as string) ??
    `https://storage.mock/${bucket}`;

  return {
    async put(key: string, data: Buffer | Uint8Array) {
      const buf = Buffer.from(data);
      memoryStore.set(`${bucket}:${key}`, buf);
      const url = `${baseUrl.replace(/\/$/, "")}/${key}`;
      return { url };
    },
    async get(key: string) {
      return memoryStore.get(`${bucket}:${key}`) ?? null;
    },
  };
}

export function presignUploadUrl(
  credentials: ResolvedCredentials,
  key: string,
  expiresInSeconds = 3600,
): { uploadUrl: string; publicUrl: string; expiresAt: string } {
  const baseUrl =
    (credentials.configPublic.publicBaseUrl as string) ??
    `https://storage.mock/${credentials.configPublic.bucket ?? "civil-obras"}`;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();
  return {
    uploadUrl: `${baseUrl.replace(/\/$/, "")}/upload?key=${encodeURIComponent(key)}&expires=${expiresInSeconds}`,
    publicUrl: `${baseUrl.replace(/\/$/, "")}/${key}`,
    expiresAt,
  };
}
