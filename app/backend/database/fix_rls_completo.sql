-- ============================================
-- Corrigir RLS: recriar todas as policies de pedidos
-- Execute no SQL Editor do Supabase
-- ============================================

-- Garantir que RLS está ativo
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

-- Recriar função is_admin() (caso não exista)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE supabase_uid = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Resetar policies de pedidos
DROP POLICY IF EXISTS "Pedidos visíveis para o próprio usuário ou admin" ON pedidos;
DROP POLICY IF EXISTS "Pedidos podem ser criados por qualquer um" ON pedidos;
DROP POLICY IF EXISTS "Pedidos atualizados por admin" ON pedidos;

CREATE POLICY "Pedidos visíveis para o próprio usuário ou admin"
  ON pedidos FOR SELECT
  USING (
    user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Pedidos podem ser criados por qualquer um"
  ON pedidos FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Pedidos atualizados por admin"
  ON pedidos FOR UPDATE
  USING (public.is_admin());

-- Resetar policies de pedido_itens
DROP POLICY IF EXISTS "Itens visíveis na mesma regra do pedido" ON pedido_itens;
DROP POLICY IF EXISTS "Itens podem ser criados por qualquer um" ON pedido_itens;

CREATE POLICY "Itens visíveis na mesma regra do pedido"
  ON pedido_itens FOR SELECT
  USING (
    pedido_id IN (
      SELECT id FROM pedidos WHERE
        user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid())
    ) OR
    public.is_admin()
  );

CREATE POLICY "Itens podem ser criados por qualquer um"
  ON pedido_itens FOR INSERT
  WITH CHECK (true);

-- Resetar policies de historico_estoque
DROP POLICY IF EXISTS "Histórico visível apenas para admin" ON historico_estoque;
DROP POLICY IF EXISTS "Histórico inserido por trigger ou admin" ON historico_estoque;

CREATE POLICY "Histórico visível apenas para admin"
  ON historico_estoque FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Histórico inserido por trigger ou admin"
  ON historico_estoque FOR INSERT
  WITH CHECK (true);
