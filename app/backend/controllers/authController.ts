import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "../routes/context";
import { signIn } from "../services/authService";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

const publicProcedure = t.procedure;

export const authController = t.router({
  login: publicProcedure
    .input(
      z.object({
        email: z.string().email("Email inválido"),
        password: z.string().min(1, "Senha é obrigatória"),
      })
    )
    .mutation(async ({ input }) => {
      const result = await signIn(input.email, input.password);
      if (result.error) {
        throw new TRPCError({
          code: "UNAUTHORIZED",
          message: result.error,
        });
      }
      return { access_token: result.session!.access_token, user: result.user };
    }),

  me: publicProcedure.query((opts) => opts.ctx.user ?? null),
});
