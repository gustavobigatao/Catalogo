import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import type { User } from "../database/schema";
import { authenticateRequest } from "../middleware/auth";

export type TrpcContext = {
  req: Request;
  resHeaders: Headers;
  user?: User;
};

export async function createContext(
  opts: FetchCreateContextFnOptions
): Promise<TrpcContext> {
  const ctx: TrpcContext = { req: opts.req, resHeaders: opts.resHeaders };

  try {
    const authHeader = opts.req.headers.get("authorization");
    const user = await authenticateRequest(authHeader);
    ctx.user = user ?? undefined;
  } catch {
    // Authentication is optional
  }

  return ctx;
}
