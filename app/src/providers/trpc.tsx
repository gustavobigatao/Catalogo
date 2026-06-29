// tRPC removido - app sem backend
export const trpc = null as any;
export function TRPCProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
