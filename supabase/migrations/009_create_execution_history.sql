-- =====================================================
-- Migration 009: Histórico de Execuções de Tarefas
-- =====================================================
-- Sistema para rastrear ações executadas, otimizações
-- e alimentar a IA com base de conhecimento
-- =====================================================

-- Tabela principal de execuções
CREATE TABLE IF NOT EXISTS task_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,

  -- Tipo de ação executada
  action_type VARCHAR(50) NOT NULL,
  -- Valores: 'task_created', 'task_started', 'task_completed',
  --          'task_cancelled', 'optimization_applied', 'manual_action'

  -- Detalhes da execução
  title VARCHAR(500) NOT NULL,
  description TEXT,

  -- Campos de otimização (opcionais)
  optimization_type VARCHAR(50),
  -- Valores: 'campaign_adjustment', 'budget_change', 'targeting_tweak',
  --          'creative_update', 'bid_strategy', 'audience_expansion', 'other'
  optimization_details TEXT,

  -- Resultado da execução (opcional)
  result VARCHAR(20),
  -- Valores: 'success', 'partial', 'failed', 'pending'

  -- Métricas de resultado (JSON para flexibilidade)
  result_metrics JSONB,
  -- Exemplo: { "roas": 2.5, "cpc": 1.20, "ctr": 3.5, "conversions": 15, "spend": 500 }

  -- Quem executou (se diferente do user_id)
  executed_by UUID REFERENCES team_members(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Notas adicionais
  notes TEXT,

  -- Metadados
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_task_executions_user_id
  ON task_executions(user_id);

CREATE INDEX IF NOT EXISTS idx_task_executions_client_id
  ON task_executions(client_id);

CREATE INDEX IF NOT EXISTS idx_task_executions_task_id
  ON task_executions(task_id);

CREATE INDEX IF NOT EXISTS idx_task_executions_executed_at
  ON task_executions(executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_executions_action_type
  ON task_executions(action_type);

CREATE INDEX IF NOT EXISTS idx_task_executions_result
  ON task_executions(result);

-- Índice composto para queries comuns
CREATE INDEX IF NOT EXISTS idx_task_executions_user_date
  ON task_executions(user_id, executed_at DESC);

CREATE INDEX IF NOT EXISTS idx_task_executions_client_date
  ON task_executions(client_id, executed_at DESC);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

ALTER TABLE task_executions ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver suas próprias execuções
CREATE POLICY "Users can view own executions"
  ON task_executions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Usuários podem criar suas próprias execuções
CREATE POLICY "Users can insert own executions"
  ON task_executions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem atualizar suas próprias execuções
CREATE POLICY "Users can update own executions"
  ON task_executions
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem deletar suas próprias execuções
CREATE POLICY "Users can delete own executions"
  ON task_executions
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- Trigger para atualizar updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION update_task_executions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_task_executions_updated_at
  BEFORE UPDATE ON task_executions
  FOR EACH ROW
  EXECUTE FUNCTION update_task_executions_updated_at();

-- =====================================================
-- Comentários na tabela
-- =====================================================

COMMENT ON TABLE task_executions IS 'Histórico de execuções de tarefas e otimizações para rastreamento e base de conhecimento da IA';

COMMENT ON COLUMN task_executions.action_type IS 'Tipo de ação: task_created, task_started, task_completed, task_cancelled, optimization_applied, manual_action';

COMMENT ON COLUMN task_executions.optimization_type IS 'Tipo de otimização: campaign_adjustment, budget_change, targeting_tweak, creative_update, bid_strategy, audience_expansion, other';

COMMENT ON COLUMN task_executions.result IS 'Resultado da execução: success, partial, failed, pending';

COMMENT ON COLUMN task_executions.result_metrics IS 'Métricas JSON: roas, cpc, ctr, conversions, spend, impressions, cpl';
