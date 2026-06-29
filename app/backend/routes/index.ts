import { initTRPC } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { productController } from "../controllers/productController";
import { authController } from "../controllers/authController";
import { orderController } from "../controllers/orderController";

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

export const appRouter = t.router({
  ping: t.procedure.query(() => ({ ok: true, ts: Date.now() })),
  auth: authController,
  product: productController,
  order: orderController,
});

export type AppRouter = typeof appRouter;
