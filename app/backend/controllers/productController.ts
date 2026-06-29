import { z } from "zod";
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "../routes/context";
import { productService } from "../services/productService";

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

export const productController = t.router({
  list: publicProcedure
    .input(
      z
        .object({
          marca: z.string().optional(),
          litros: z.string().optional(),
          categoria: z.string().optional(),
          search: z.string().optional(),
          orderBy: z
            .enum(["preco_asc", "preco_desc", "nome_asc", "nome_desc"])
            .optional(),
          lowStock: z.boolean().optional(),
        })
        .optional()
    )
    .query(({ input }) => productService.list(input || undefined)),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => productService.getById(input.id)),

  getFilters: publicProcedure.query(() => productService.getFilters()),

  create: adminProcedure
    .input(
      z.object({
        numero_produto: z.string().min(1, "Número do produto é obrigatório"),
        nome: z.string().min(1, "Nome é obrigatório"),
        categoria: z.string().min(1, "Categoria é obrigatória"),
        marca: z.string().optional(),
        litros: z.number().positive("Litros deve ser maior que zero").optional(),
        preco: z.number().positive("Preço deve ser maior que zero"),
        imagem: z.string().optional(),
        quantidade_estoque: z.number().int().min(0, "Estoque não pode ser negativo"),
      })
    )
    .mutation(({ input, ctx }) => productService.create(input as any, getToken(ctx))),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        numero_produto: z.string().optional(),
        nome: z.string().optional(),
        categoria: z.string().optional(),
        marca: z.string().optional(),
        litros: z.number().positive().optional(),
        preco: z.number().positive().optional(),
        imagem: z.string().nullable().optional(),
        quantidade_estoque: z.number().int().min(0).optional(),
      })
    )
    .mutation(({ input, ctx }) => {
      const { id, ...data } = input;
      return productService.update(id, data as any, getToken(ctx));
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => productService.delete(input.id, getToken(ctx))),

  updateStock: adminProcedure
    .input(
      z.object({
        id: z.number(),
        quantidade: z.number().int().min(0),
      })
    )
    .mutation(({ input, ctx }) =>
      productService.updateStock(input.id, input.quantidade, getToken(ctx))
    ),
});
