export class DatabaseError extends Error {
  readonly code: string;

  constructor(message: string, code: string = "DATABASE_ERROR") {
    super(message);
    this.name = "DatabaseError";
    this.code = code;
  }
}

export function handleDbError(error: { message: string; code?: string }): never {
  const message = error.message?.replace(/^.*\{/, "{").slice(0, 200) || "Erro interno do banco de dados";
  throw new DatabaseError(message, error.code ?? "DB_ERROR");
}
