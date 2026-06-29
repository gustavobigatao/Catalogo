-- ============================================
-- Corrigir SELECT policies para permitir leitura de pedidos anônimos
-- Execute no SQL Editor do Supabase
-- ============================================

DROP POLICY IF EXISTS "Pedidos visíveis para o próprio usuário ou admin" ON pedidos;
DROP POLICY IF EXISTS "Itens visíveis na mesma regra do pedido" ON pedido_itens;

CREATE POLICY "Pedidos visíveis para o próprio usuário ou admin"
  ON pedidos FOR SELECT
  USING (
    user_id IS NULL OR
    user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid()) OR
    public.is_admin()
  );

CREATE POLICY "Itens visíveis na mesma regra do pedido"
  ON pedido_itens FOR SELECT
  USING (
    pedido_id IN (
      SELECT id FROM pedidos WHERE
        user_id IS NULL OR
        user_id = (SELECT id FROM users WHERE supabase_uid = auth.uid())
    ) OR
    public.is_admin()
  );
