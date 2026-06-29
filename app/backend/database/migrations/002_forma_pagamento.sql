-- Adiciona coluna forma_pagamento à tabela pedidos
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS forma_pagamento VARCHAR(20) CHECK (forma_pagamento IN ('debito', 'credito', 'pix'));
