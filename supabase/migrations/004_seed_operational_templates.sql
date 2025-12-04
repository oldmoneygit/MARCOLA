-- ═══════════════════════════════════════════════════════════════
-- SEED: TEMPLATES OPERACIONAIS (48 templates)
-- Categoria: 'operational' | is_system: true | user_id: NULL
-- ═══════════════════════════════════════════════════════════════

-- Limpar templates operacionais antigos (se existirem)
DELETE FROM task_templates WHERE category = 'operational' AND is_system = true;

-- ═══════════════════════════════════════════════════════════════
-- DIÁRIAS (11 templates) - Código: D01-D11
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (user_id, category, segment, title, description, recurrence, priority, notify_client, is_system, is_recurring, order_index) VALUES
(NULL, 'operational', NULL, 'D01 - Checar Performance Básica', 'Verificar CPC, CTR, CPM, CPA, ROAS de todas as campanhas ativas', 'daily', 'high', false, true, true, 1),
(NULL, 'operational', NULL, 'D02 - Verificar Status de Anúncios', 'Checar reprovações, aprendizado limitado, quedas abruptas de performance', 'daily', 'high', false, true, true, 2),
(NULL, 'operational', NULL, 'D03 - Checar Orçamento', 'Verificar distribuição de budget e gastos do dia', 'daily', 'high', false, true, true, 3),
(NULL, 'operational', NULL, 'D04 - Microajustes de Lances', 'Ajustar lances se necessário baseado na performance do dia', 'daily', 'medium', false, true, true, 4),
(NULL, 'operational', NULL, 'D05 - Verificar Saturação de Públicos', 'Checar frequência de exibição e tamanho de públicos', 'daily', 'medium', false, true, true, 5),
(NULL, 'operational', NULL, 'D06 - Responder Cliente', 'Checar e responder mensagens do cliente (meta: até 2h)', 'daily', 'high', false, true, true, 6),
(NULL, 'operational', NULL, 'D07 - Monitorar Negócio do Cliente', 'Verificar promoções ativas, horários de pico, imprevistos', 'daily', 'medium', false, true, true, 7),
(NULL, 'operational', NULL, 'D08 - Atualizar Insights Diários', 'Registrar observações e insights do dia no sistema', 'daily', 'low', false, true, true, 8),
(NULL, 'operational', NULL, 'D09 - Checar Concorrência', 'Analisar anúncios ativos dos concorrentes diretos', 'daily', 'medium', false, true, true, 9),
(NULL, 'operational', NULL, 'D10 - Monitorar Reputação', 'Verificar avaliações no iFood/Google e tendências de reclamações', 'daily', 'medium', false, true, true, 10),
(NULL, 'operational', NULL, 'D11 - Checar Funil/SAC', 'Acompanhar WhatsApp, Instagram DM, taxa de resposta do atendimento', 'daily', 'medium', false, true, true, 11);

-- ═══════════════════════════════════════════════════════════════
-- A CADA 3 DIAS (8 templates) - Código: T01-T08
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (user_id, category, segment, title, description, recurrence, priority, notify_client, is_system, is_recurring, order_index) VALUES
(NULL, 'operational', NULL, 'T01 - Pausar Anúncios Fracos', 'Identificar e pausar criativos com CTR muito baixo (< 0.8%)', 'every_3_days', 'high', false, true, true, 12),
(NULL, 'operational', NULL, 'T02 - Duplicar Criativos Vencedores', 'Escalar criativos com boa performance para outros públicos', 'every_3_days', 'high', false, true, true, 13),
(NULL, 'operational', NULL, 'T03 - Ajustar Segmentações', 'Revisar e ajustar públicos frio/morno/quente', 'every_3_days', 'medium', false, true, true, 14),
(NULL, 'operational', NULL, 'T04 - Revisar Mix de Criativos', 'Balancear proporção entre estáticos e vídeos', 'every_3_days', 'medium', false, true, true, 15),
(NULL, 'operational', NULL, 'T05 - Novas Variações de Copy', 'Criar variações de texto para prevenir fadiga de anúncios', 'every_3_days', 'medium', false, true, true, 16),
(NULL, 'operational', NULL, 'T06 - Atualizar Criativos Saturados', 'Criar novas versões de criativos que estão cansando', 'every_3_days', 'medium', false, true, true, 17),
(NULL, 'operational', NULL, 'T07 - Revisar Mix de Ofertas', 'Ajustar promoções baseado em margem e giro de vendas', 'every_3_days', 'medium', false, true, true, 18),
(NULL, 'operational', NULL, 'T08 - Auditoria Leve de Funil', 'Verificar tempo de resposta, scripts de atendimento, páginas quebradas', 'every_3_days', 'medium', false, true, true, 19);

-- ═══════════════════════════════════════════════════════════════
-- SEMANAIS (8 templates) - Código: S01-S08
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (user_id, category, segment, title, description, recurrence, priority, notify_client, is_system, is_recurring, order_index) VALUES
(NULL, 'operational', NULL, 'S01 - Relatório de Performance Semanal', 'Gerar relatório completo: CPC, CPM, CTR, CPA por criativo + ROAS', 'weekly', 'high', true, true, true, 20),
(NULL, 'operational', NULL, 'S02 - Análise de Funil Completa', 'Mapear: Impressão → Clique → Conversa → Venda', 'weekly', 'high', false, true, true, 21),
(NULL, 'operational', NULL, 'S03 - Ranking de Criativos', 'Identificar top 3 vencedores e bottom 3 perdedores', 'weekly', 'medium', false, true, true, 22),
(NULL, 'operational', NULL, 'S04 - Reunião/Update com Cliente', 'Apresentar pontos positivos, alertas e recomendações', 'weekly', 'high', true, true, true, 23),
(NULL, 'operational', NULL, 'S05 - Planejamento Criativo Semanal', 'Definir criativos a serem produzidos na próxima semana', 'weekly', 'medium', false, true, true, 24),
(NULL, 'operational', NULL, 'S06 - Revisar Pauta de Conteúdo', 'Criar/revisar calendário de posts para redes sociais', 'weekly', 'medium', false, true, true, 25),
(NULL, 'operational', NULL, 'S07 - Atualizar Google Meu Negócio', 'Adicionar fotos, posts e promoções novas no GMB', 'weekly', 'low', false, true, true, 26),
(NULL, 'operational', NULL, 'S08 - Testar 1 Público Novo', 'Criar e testar pelo menos 1 público novo por semana', 'weekly', 'medium', false, true, true, 27);

-- ═══════════════════════════════════════════════════════════════
-- QUINZENAIS (10 templates) - Código: Q01-Q10
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (user_id, category, segment, title, description, recurrence, priority, notify_client, is_system, is_recurring, order_index) VALUES
(NULL, 'operational', NULL, 'Q01 - Deep Analysis CAC/LTV', 'Análise profunda de Custo de Aquisição e Lifetime Value', 'biweekly', 'high', false, true, true, 28),
(NULL, 'operational', NULL, 'Q02 - Análise de Recorrência', 'Verificar frequência de compra/visita dos clientes finais', 'biweekly', 'medium', false, true, true, 29),
(NULL, 'operational', NULL, 'Q03 - Melhores Dias e Horários', 'Identificar padrões de performance por dia/hora', 'biweekly', 'medium', false, true, true, 30),
(NULL, 'operational', NULL, 'Q04 - Detectar Padrões', 'Identificar quedas ou saltos de performance e suas causas', 'biweekly', 'medium', false, true, true, 31),
(NULL, 'operational', NULL, 'Q05 - Testes de Arquitetura', 'Testar estruturas diferentes: CBO vs ABO, Campaign vs AdSet', 'biweekly', 'medium', false, true, true, 32),
(NULL, 'operational', NULL, 'Q06 - Testar Novas Abordagens', 'Experimentar: UGC, depoimentos, autoridade, bastidores', 'biweekly', 'medium', false, true, true, 33),
(NULL, 'operational', NULL, 'Q07 - Testar Ofertas Fortes', 'Criar e testar novas ofertas de alto impacto', 'biweekly', 'high', false, true, true, 34),
(NULL, 'operational', NULL, 'Q08 - Criar Criativos Premium', 'Desenvolver criativos "flagship" de alta qualidade', 'biweekly', 'medium', false, true, true, 35),
(NULL, 'operational', NULL, 'Q09 - Produzir Vídeos Motion', 'Criar vídeos de impacto com motion graphics', 'biweekly', 'medium', false, true, true, 36),
(NULL, 'operational', NULL, 'Q10 - Análise Profunda de Concorrência', 'Pesquisar melhores campanhas dos concorrentes e documentar oportunidades', 'biweekly', 'medium', false, true, true, 37);

-- ═══════════════════════════════════════════════════════════════
-- MENSAIS (11 templates) - Código: M01-M11
-- ═══════════════════════════════════════════════════════════════

INSERT INTO task_templates (user_id, category, segment, title, description, recurrence, priority, notify_client, is_system, is_recurring, order_index) VALUES
(NULL, 'operational', NULL, 'M01 - Reunião Estratégica Mensal', 'Revisão completa do mês, análise de ROI, plano de ação 30 dias', 'monthly', 'high', true, true, true, 38),
(NULL, 'operational', NULL, 'M02 - Revisão de Metas', 'Avaliar metas de faturamento e ajustar expectativas', 'monthly', 'high', false, true, true, 39),
(NULL, 'operational', NULL, 'M03 - Reavaliação de Persona', 'Revisar público-alvo e mensagens-chave da comunicação', 'monthly', 'medium', false, true, true, 40),
(NULL, 'operational', NULL, 'M04 - Calendário de Campanhas', 'Planejar campanhas e ações do próximo mês', 'monthly', 'medium', false, true, true, 41),
(NULL, 'operational', NULL, 'M05 - Mapear Datas Promocionais', 'Identificar oportunidades sazonais e datas comemorativas', 'monthly', 'medium', false, true, true, 42),
(NULL, 'operational', NULL, 'M06 - Criar Campanhas Premium', 'Desenvolver campanhas de alto impacto para o mês', 'monthly', 'high', false, true, true, 43),
(NULL, 'operational', NULL, 'M07 - Auditoria Completa de Funil', 'Analisar: WhatsApp → Atendimento → Fechamento → Pós-venda', 'monthly', 'high', false, true, true, 44),
(NULL, 'operational', NULL, 'M08 - Análise de Churn', 'Identificar pontos de retenção e motivos de cancelamento', 'monthly', 'medium', false, true, true, 45),
(NULL, 'operational', NULL, 'M09 - Atualizar Scripts', 'Revisar e melhorar scripts de atendimento', 'monthly', 'medium', false, true, true, 46),
(NULL, 'operational', NULL, 'M10 - Auditoria de Marca', 'Verificar padronização visual e tom de voz', 'monthly', 'low', false, true, true, 47),
(NULL, 'operational', NULL, 'M11 - Relatório de Tendências', 'Pesquisar tendências do setor e novas oportunidades', 'monthly', 'medium', false, true, true, 48);

-- ═══════════════════════════════════════════════════════════════
-- VERIFICAÇÃO
-- ═══════════════════════════════════════════════════════════════

-- Confirmar quantidade por recorrência
-- SELECT
--   recurrence,
--   COUNT(*) as total
-- FROM task_templates
-- WHERE category = 'operational' AND is_system = true
-- GROUP BY recurrence
-- ORDER BY
--   CASE recurrence
--     WHEN 'daily' THEN 1
--     WHEN 'every_3_days' THEN 2
--     WHEN 'weekly' THEN 3
--     WHEN 'biweekly' THEN 4
--     WHEN 'monthly' THEN 5
--   END;

-- Esperado:
-- daily: 11
-- every_3_days: 8
-- weekly: 8
-- biweekly: 10
-- monthly: 11
-- TOTAL: 48
