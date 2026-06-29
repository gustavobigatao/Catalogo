-- ============================================
-- Remove trigger automático de baixa de estoque
-- O estoque agora só é debitado quando o admin CONFIRMAR o pedido
-- Execute no SQL Editor do Supabase
-- ============================================

DROP TRIGGER IF EXISTS trigger_baixa_estoque ON pedido_itens;
DROP FUNCTION IF EXISTS after_pedido_item_insert;
