import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "../routes/context";
import { orderService } from "../services/orderService";
import { checkRateLimit } from "../middleware/rateLimit";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

const requireAdmin = t.middleware(async (opts) => {
  const { ctx, next } = opts;
  if (!ctx.user || ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

const publicProcedure = t.procedure;
const adminProcedure = t.procedure.use(requireAdmin);

function getToken(ctx: TrpcContext): string | undefined {
  const auth = ctx.req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) {
    return auth.slice(7);
  }
}

export const orderController = t.router({
  create: publicProcedure
    .input(
      z.object({
        cliente_nome: z.string().min(1, "Nome é obrigatório"),
        cliente_telefone: z.string().optional(),
        forma_pagamento: z.enum(["debito", "credito", "pix"], {
          required_error: "Selecione uma forma de pagamento",
        }),
        observacao: z.string().optional(),
        itens: z.array(
          z.object({
            product_id: z.number(),
            quantidade: z.number().int().positive(),
            preco_unitario: z.number().positive(),
            subtotal: z.number().positive(),
          })
        ).min(1, "Adicione pelo menos um item"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const ip = ctx.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
        || ctx.req.headers.get("x-real-ip")
        || "unknown";
      try {
        checkRateLimit(ip);
      } catch {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Muitos pedidos. Tente novamente em 1 minuto.",
        });
      }

      const total = input.itens.reduce((sum, i) => sum + i.subtotal, 0);

      const pedido = await orderService.create(
        {
          user_id: null,
          cliente_nome: input.cliente_nome,
          cliente_telefone: input.cliente_telefone ?? null,
          forma_pagamento: input.forma_pagamento,
          status: "pendente",
          total,
          frete: null,
          observacao: input.observacao ?? null,
        },
        input.itens
      );

      return pedido;
    }),

  list: adminProcedure.query(({ ctx }) => orderService.list(getToken(ctx))),

  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input, ctx }) => orderService.getById(input.id, getToken(ctx))),

  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["pendente", "confirmado", "cancelado", "entregue", "pago"]),
      })
    )
    .mutation(({ input, ctx }) => orderService.updateStatus(input.id, input.status, getToken(ctx))),
});
