-- Otimização de performance - Índices
-- Execute no SQL Editor do Supabase Dashboard

CREATE INDEX IF NOT EXISTS idx_products_marca ON products (marca);
CREATE INDEX IF NOT EXISTS idx_products_categoria ON products (categoria);
CREATE INDEX IF NOT EXISTS idx_products_litros ON products (litros);
CREATE INDEX IF NOT EXISTS idx_products_nome ON products (nome);
CREATE INDEX IF NOT EXISTS idx_products_numero_produto ON products (numero_produto);

CREATE INDEX IF NOT EXISTS idx_pedidos_criado_em ON pedidos (criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos (status);

CREATE INDEX IF NOT EXISTS idx_pedido_itens_pedido_id ON pedido_itens (pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_itens_product_id ON pedido_itens (product_id);

CREATE INDEX IF NOT EXISTS idx_users_supabase_uid ON users (supabase_uid);
