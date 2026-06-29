-- ============================================
-- Premium Catalog - Organização do Banco
-- Remove tabelas legadas, cria estrutura completa com RLS corrigida
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. DROP tabelas legadas
DROP TABLE IF EXISTS pedido_itens CASCADE;
DROP TABLE IF EXISTS pedidos CASCADE;
DROP TABLE IF EXISTS historico_estoque CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS produtos CASCADE;

-- 2. Função helper is_admin() — evita recursão nas RLS policies
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

-- 3. pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(255) NOT NULL DEFAULT 'Cliente',
  cliente_telefone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'entregue', 'pago')),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete DECIMAL(10,2) DEFAULT 0,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. pedido_itens
CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. historico_estoque
CREATE TABLE IF NOT EXISTS historico_estoque (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'saida_venda', 'saida_avaria', 'ajuste')),
  quantidade_anterior INTEGER NOT NULL,
  quantidade_nova INTEGER NOT NULL,
  diferenca INTEGER NOT NULL,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger de atualizado_em para pedidos
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_pedidos ON pedidos;
CREATE TRIGGER trigger_update_pedidos
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read, only admin can write
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Products are writable by admin"
  ON products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Products are updatable by admin"
  ON products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Products are deletable by admin"
  ON products FOR DELETE
  USING (public.is_admin());

-- Pedidos: user vê os próprios, admin vê todos
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

-- Pedido itens: mesma regra do pedido
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

-- Histórico: só admin vê
CREATE POLICY "Histórico visível apenas para admin"
  ON historico_estoque FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Histórico inserido apenas por admin"
  ON historico_estoque FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================
-- Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE historico_estoque;
