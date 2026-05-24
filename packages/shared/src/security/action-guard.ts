import { z } from "zod";

export class ActionValidationError extends Error {
  constructor(public readonly details: unknown) {
    super("Dados inválidos.");
    this.name = "ActionValidationError";
  }
}

export async function validatedAction<T extends z.ZodType>(
  schema: T,
  raw: unknown,
  handler: (data: z.infer<T>) => Promise<unknown>,
) {
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new ActionValidationError(parsed.error.flatten());
  }
  return handler(parsed.data);
}
