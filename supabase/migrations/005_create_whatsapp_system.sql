-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: 005_create_whatsapp_system.sql
-- Descrição: Sistema de integração WhatsApp via Z-API
-- Data: Dezembro 2024
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: message_logs
-- Histórico de mensagens WhatsApp enviadas/recebidas
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS message_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Dados da mensagem
  phone TEXT NOT NULL,
  message TEXT NOT NULL,
  template_type TEXT, -- payment_reminder, task_completed, etc.

  -- Tipo e status
  type TEXT NOT NULL CHECK (type IN ('sent', 'received')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),

  -- Referência Z-API
  zapi_message_id TEXT,

  -- Erro (se houver)
  error TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ
);

-- Índices para message_logs
CREATE INDEX IF NOT EXISTS idx_message_logs_user ON message_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_client ON message_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_message_logs_phone ON message_logs(phone);
CREATE INDEX IF NOT EXISTS idx_message_logs_status ON message_logs(status);
CREATE INDEX IF NOT EXISTS idx_message_logs_created ON message_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_message_logs_zapi_id ON message_logs(zapi_message_id);

-- RLS para message_logs
ALTER TABLE message_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own message logs"
ON message_logs FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at em message_logs
CREATE TRIGGER update_message_logs_updated_at
  BEFORE UPDATE ON message_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- TABELA: whatsapp_settings
-- Configurações de WhatsApp por usuário (Multi-tenant)
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS whatsapp_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Credenciais Z-API (Multi-tenant)
  zapi_instance_id TEXT,
  zapi_token TEXT,
  zapi_client_token TEXT, -- Opcional (security token)

  -- Status da conexão
  is_connected BOOLEAN DEFAULT false,
  connected_phone TEXT,
  connected_at TIMESTAMPTZ,
  credentials_validated_at TIMESTAMPTZ,

  -- Configurações de notificação automática
  auto_payment_reminder BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3, -- Dias antes do vencimento
  auto_overdue_notification BOOLEAN DEFAULT true,
  auto_task_notification BOOLEAN DEFAULT false,

  -- Horário permitido para envio (evitar mensagens de madrugada)
  send_start_hour INTEGER DEFAULT 8 CHECK (send_start_hour >= 0 AND send_start_hour <= 23),
  send_end_hour INTEGER DEFAULT 20 CHECK (send_end_hour >= 0 AND send_end_hour <= 23),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para whatsapp_settings
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_user ON whatsapp_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_settings_connected ON whatsapp_settings(is_connected);

-- RLS para whatsapp_settings
ALTER TABLE whatsapp_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own whatsapp settings"
ON whatsapp_settings FOR ALL
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Trigger para updated_at em whatsapp_settings
CREATE TRIGGER update_whatsapp_settings_updated_at
  BEFORE UPDATE ON whatsapp_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ═══════════════════════════════════════════════════════════════════════════
-- COMENTÁRIOS DAS TABELAS
-- ═══════════════════════════════════════════════════════════════════════════

COMMENT ON TABLE message_logs IS 'Histórico de mensagens WhatsApp enviadas e recebidas via Z-API';
COMMENT ON COLUMN message_logs.phone IS 'Número de telefone no formato internacional (5511999999999)';
COMMENT ON COLUMN message_logs.template_type IS 'Tipo de template usado: payment_reminder, payment_overdue, task_completed, task_assigned, report_ready, custom';
COMMENT ON COLUMN message_logs.type IS 'Tipo de mensagem: sent (enviada) ou received (recebida)';
COMMENT ON COLUMN message_logs.status IS 'Status da mensagem: pending, sent, delivered, read, failed';
COMMENT ON COLUMN message_logs.zapi_message_id IS 'ID da mensagem retornado pela Z-API para rastreamento';

COMMENT ON TABLE whatsapp_settings IS 'Configurações de WhatsApp por usuário - Multi-tenant com Z-API';
COMMENT ON COLUMN whatsapp_settings.zapi_instance_id IS 'Instance ID da conta Z-API do usuário';
COMMENT ON COLUMN whatsapp_settings.zapi_token IS 'Token de autenticação da Z-API';
COMMENT ON COLUMN whatsapp_settings.zapi_client_token IS 'Token de segurança adicional (opcional)';
COMMENT ON COLUMN whatsapp_settings.reminder_days_before IS 'Quantos dias antes do vencimento enviar lembrete';
COMMENT ON COLUMN whatsapp_settings.send_start_hour IS 'Hora inicial permitida para envio (0-23)';
COMMENT ON COLUMN whatsapp_settings.send_end_hour IS 'Hora final permitida para envio (0-23)';
