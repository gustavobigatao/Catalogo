-- ============================================
-- Premium Catalog - Supabase Migration (completa)
-- Execute no SQL Editor do Supabase
-- ============================================

-- 1. Função helper is_admin() — evita recursão infinita nas RLS
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

-- 2. Products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  numero_produto VARCHAR(20) NOT NULL UNIQUE,
  nome VARCHAR(255) NOT NULL,
  marca VARCHAR(100),
  litros DECIMAL(5,2),
  categoria VARCHAR(100) NOT NULL DEFAULT '',
  preco DECIMAL(10,2) NOT NULL,
  imagem TEXT,
  quantidade_estoque INTEGER NOT NULL DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Users table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  supabase_uid UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255),
  email VARCHAR(320),
  avatar TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 4. pedidos
CREATE TABLE IF NOT EXISTS pedidos (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  cliente_nome VARCHAR(255) NOT NULL DEFAULT 'Cliente',
  cliente_telefone VARCHAR(20),
  forma_pagamento VARCHAR(20) CHECK (forma_pagamento IN ('debito', 'credito', 'pix')),
  status VARCHAR(20) NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente', 'confirmado', 'cancelado', 'entregue', 'pago')),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  frete DECIMAL(10,2) DEFAULT 0,
  observacao TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 5. pedido_itens
CREATE TABLE IF NOT EXISTS pedido_itens (
  id SERIAL PRIMARY KEY,
  pedido_id INTEGER NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantidade INTEGER NOT NULL CHECK (quantidade > 0),
  preco_unitario DECIMAL(10,2) NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 6. historico_estoque
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

-- Auto-update atualizado_em
CREATE OR REPLACE FUNCTION update_atualizado_em()
RETURNS TRIGGER AS $$
BEGIN
  NEW.atualizado_em = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_atualizado_em ON products;
CREATE TRIGGER trigger_update_atualizado_em
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

DROP TRIGGER IF EXISTS trigger_update_pedidos ON pedidos;
CREATE TRIGGER trigger_update_pedidos
  BEFORE UPDATE ON pedidos
  FOR EACH ROW
  EXECUTE FUNCTION update_atualizado_em();

-- Auto-create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (supabase_uid, name, email, avatar, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'name',
    NEW.email,
    NEW.raw_user_meta_data->>'avatar_url',
    CASE WHEN NEW.email = 'admin@exemplo.com' THEN 'admin' ELSE 'user' END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================
-- RLS
-- ============================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedidos ENABLE ROW LEVEL SECURITY;
ALTER TABLE pedido_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE historico_estoque ENABLE ROW LEVEL SECURITY;

-- Products: anyone can read
CREATE POLICY "Products are publicly readable"
  ON products FOR SELECT
  USING (true);

-- Products: only admin can write
CREATE POLICY "Products are writable by admin"
  ON products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Products are updatable by admin"
  ON products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Products are deletable by admin"
  ON products FOR DELETE
  USING (public.is_admin());

-- Users: only admins can read all (usando is_admin() para evitar recursão)
CREATE POLICY "Users are readable by admins"
  ON users FOR SELECT
  USING (
    auth.uid() = supabase_uid OR
    public.is_admin()
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = supabase_uid);

CREATE POLICY "Users can be created by anyone"
  ON users FOR INSERT
  WITH CHECK (true);

-- Pedidos
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

-- Pedido itens
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

-- Histórico: só admin
CREATE POLICY "Histórico visível apenas para admin"
  ON historico_estoque FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Histórico inserido apenas por admin"
  ON historico_estoque FOR INSERT
  WITH CHECK (public.is_admin());

-- ============================================
-- Realtime
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE products;
ALTER PUBLICATION supabase_realtime ADD TABLE users;
ALTER PUBLICATION supabase_realtime ADD TABLE pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE historico_estoque;
