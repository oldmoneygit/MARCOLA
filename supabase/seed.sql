-- =============================================================================
-- TrafficHub - Seed Data
-- =============================================================================
-- Este arquivo contém dados de teste para popular o banco de dados
-- Execute após as migrations para ter dados de exemplo
-- =============================================================================

-- Usar o ID do usuário existente
-- user_id: 55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e

-- =============================================================================
-- CLIENTS (5 clientes de exemplo)
-- =============================================================================

INSERT INTO clients (id, user_id, name, segment, contact_name, contact_email, contact_phone, contract_value, monthly_value, due_day, status, notes, created_at)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    'TechStore Brasil',
    'E-commerce',
    'Carlos Silva',
    'carlos@techstore.com.br',
    '11999887766',
    4500.00,
    4500.00,
    10,
    'active',
    'Cliente desde 2024. Foco em Google Ads e Meta Ads.',
    '2024-06-15 10:00:00+00'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    'Clínica Bem Estar',
    'Saúde',
    'Dra. Ana Oliveira',
    'ana@clinicabemestar.com.br',
    '11988776655',
    3200.00,
    3200.00,
    15,
    'active',
    'Clínica odontológica. Campanhas focadas em agendamentos.',
    '2024-07-20 14:30:00+00'
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    'Imobiliária Premium',
    'Imobiliário',
    'Roberto Costa',
    'roberto@imobpremium.com.br',
    '11977665544',
    6800.00,
    6800.00,
    5,
    'active',
    'Alto ticket. Campanhas de geração de leads para imóveis de luxo.',
    '2024-05-10 09:00:00+00'
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    'Restaurante Sabor & Arte',
    'Alimentação',
    'Maria Santos',
    'maria@saborarte.com.br',
    '11966554433',
    1800.00,
    1800.00,
    20,
    'active',
    'Restaurante com delivery. Foco em pedidos pelo iFood e site próprio.',
    '2024-08-05 16:00:00+00'
  ),
  (
    '55555555-5555-5555-5555-555555555555',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    'Academia FitPower',
    'Fitness',
    'João Ferreira',
    'joao@fitpower.com.br',
    '11955443322',
    2500.00,
    2500.00,
    25,
    'paused',
    'Pausado temporariamente para reformas. Retorno previsto em Janeiro.',
    '2024-04-01 11:00:00+00'
  );

-- =============================================================================
-- REPORTS (Relatórios de Novembro 2024)
-- =============================================================================

INSERT INTO reports (id, user_id, client_id, period_start, period_end, total_spend, total_impressions, total_clicks, total_conversions, source, created_at)
VALUES
  -- TechStore Brasil - Novembro
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '11111111-1111-1111-1111-111111111111',
    '2024-11-01',
    '2024-11-30',
    12500.00,
    450000,
    8500,
    285,
    'meta_ads',
    '2024-12-01 10:00:00+00'
  ),
  -- Clínica Bem Estar - Novembro
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '22222222-2222-2222-2222-222222222222',
    '2024-11-01',
    '2024-11-30',
    8200.00,
    180000,
    4200,
    156,
    'google_ads',
    '2024-12-01 10:30:00+00'
  ),
  -- Imobiliária Premium - Novembro
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '33333333-3333-3333-3333-333333333333',
    '2024-11-01',
    '2024-11-30',
    18500.00,
    320000,
    5800,
    42,
    'meta_ads',
    '2024-12-01 11:00:00+00'
  ),
  -- Restaurante Sabor & Arte - Novembro
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '44444444-4444-4444-4444-444444444444',
    '2024-11-01',
    '2024-11-30',
    4800.00,
    95000,
    3200,
    520,
    'meta_ads',
    '2024-12-01 11:30:00+00'
  );

-- =============================================================================
-- ADS (Anúncios detalhados por relatório)
-- =============================================================================

-- TechStore Brasil - Ads
INSERT INTO ads (id, report_id, ad_id, ad_name, spend, impressions, clicks, conversions, ctr, cpc, cpa, cpm, status)
VALUES
  (
    'ad111111-1111-1111-1111-111111111111',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'fb_12345',
    'Black Friday - Smartphones',
    4500.00,
    180000,
    3800,
    145,
    2.11,
    1.18,
    31.03,
    25.00,
    'active'
  ),
  (
    'ad111111-1111-1111-1111-111111111112',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'fb_12346',
    'Natal - Notebooks',
    3800.00,
    150000,
    2800,
    85,
    1.87,
    1.36,
    44.71,
    25.33,
    'active'
  ),
  (
    'ad111111-1111-1111-1111-111111111113',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'fb_12347',
    'Remarketing - Carrinho Abandonado',
    2200.00,
    60000,
    1200,
    42,
    2.00,
    1.83,
    52.38,
    36.67,
    'active'
  ),
  (
    'ad111111-1111-1111-1111-111111111114',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'fb_12348',
    'Acessórios - Fones Bluetooth',
    2000.00,
    60000,
    700,
    13,
    1.17,
    2.86,
    153.85,
    33.33,
    'paused'
  );

-- Clínica Bem Estar - Ads
INSERT INTO ads (id, report_id, ad_id, ad_name, spend, impressions, clicks, conversions, ctr, cpc, cpa, cpm, status)
VALUES
  (
    'ad222222-2222-2222-2222-222222222221',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ggl_56789',
    'Clareamento Dental - Search',
    3200.00,
    80000,
    1800,
    72,
    2.25,
    1.78,
    44.44,
    40.00,
    'active'
  ),
  (
    'ad222222-2222-2222-2222-222222222222',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ggl_56790',
    'Implante Dentário - Search',
    2800.00,
    50000,
    1200,
    38,
    2.40,
    2.33,
    73.68,
    56.00,
    'active'
  ),
  (
    'ad222222-2222-2222-2222-222222222223',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ggl_56791',
    'Limpeza Dental - Display',
    1400.00,
    35000,
    800,
    32,
    2.29,
    1.75,
    43.75,
    40.00,
    'active'
  ),
  (
    'ad222222-2222-2222-2222-222222222224',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'ggl_56792',
    'Ortodontia Adulto - Search',
    800.00,
    15000,
    400,
    14,
    2.67,
    2.00,
    57.14,
    53.33,
    'active'
  );

-- Imobiliária Premium - Ads
INSERT INTO ads (id, report_id, ad_id, ad_name, spend, impressions, clicks, conversions, ctr, cpc, cpa, cpm, status)
VALUES
  (
    'ad333333-3333-3333-3333-333333333331',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'fb_78901',
    'Apartamentos Alto Padrão - Jardins',
    6500.00,
    120000,
    2200,
    18,
    1.83,
    2.95,
    361.11,
    54.17,
    'active'
  ),
  (
    'ad333333-3333-3333-3333-333333333332',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'fb_78902',
    'Casas em Condomínio - Alphaville',
    5800.00,
    100000,
    1800,
    12,
    1.80,
    3.22,
    483.33,
    58.00,
    'active'
  ),
  (
    'ad333333-3333-3333-3333-333333333333',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'fb_78903',
    'Cobertura Duplex - Moema',
    4200.00,
    60000,
    1200,
    8,
    2.00,
    3.50,
    525.00,
    70.00,
    'active'
  ),
  (
    'ad333333-3333-3333-3333-333333333334',
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    'fb_78904',
    'Lançamento Vila Nova - Leads',
    2000.00,
    40000,
    600,
    4,
    1.50,
    3.33,
    500.00,
    50.00,
    'paused'
  );

-- Restaurante Sabor & Arte - Ads
INSERT INTO ads (id, report_id, ad_id, ad_name, spend, impressions, clicks, conversions, ctr, cpc, cpa, cpm, status)
VALUES
  (
    'ad444444-4444-4444-4444-444444444441',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'fb_34567',
    'Almoço Executivo - Segunda a Sexta',
    1800.00,
    40000,
    1400,
    220,
    3.50,
    1.29,
    8.18,
    45.00,
    'active'
  ),
  (
    'ad444444-4444-4444-4444-444444444442',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'fb_34568',
    'Delivery - Raio 5km',
    1500.00,
    30000,
    1000,
    180,
    3.33,
    1.50,
    8.33,
    50.00,
    'active'
  ),
  (
    'ad444444-4444-4444-4444-444444444443',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'fb_34569',
    'Jantar Romântico - Fins de Semana',
    1000.00,
    18000,
    500,
    85,
    2.78,
    2.00,
    11.76,
    55.56,
    'active'
  ),
  (
    'ad444444-4444-4444-4444-444444444444',
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    'fb_34570',
    'Happy Hour - Quinta e Sexta',
    500.00,
    7000,
    300,
    35,
    4.29,
    1.67,
    14.29,
    71.43,
    'active'
  );

-- =============================================================================
-- PAYMENTS (Pagamentos - Histórico)
-- =============================================================================

INSERT INTO payments (id, user_id, client_id, amount, due_date, paid_date, status, description, payment_method, notes)
VALUES
  -- TechStore Brasil
  (
    'a1111111-1111-1111-1111-111111111111',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '11111111-1111-1111-1111-111111111111',
    4500.00,
    '2024-11-10',
    '2024-11-08',
    'paid',
    'Mensalidade Novembro 2024',
    'pix',
    'Pago antecipado'
  ),
  (
    'a1111111-1111-1111-1111-111111111112',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '11111111-1111-1111-1111-111111111111',
    4500.00,
    '2024-12-10',
    NULL,
    'pending',
    'Mensalidade Dezembro 2024',
    NULL,
    NULL
  ),
  -- Clínica Bem Estar
  (
    'b2222222-2222-2222-2222-222222222221',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '22222222-2222-2222-2222-222222222222',
    3200.00,
    '2024-11-15',
    '2024-11-15',
    'paid',
    'Mensalidade Novembro 2024',
    'boleto',
    NULL
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '22222222-2222-2222-2222-222222222222',
    3200.00,
    '2024-12-15',
    NULL,
    'pending',
    'Mensalidade Dezembro 2024',
    NULL,
    NULL
  ),
  -- Imobiliária Premium
  (
    'c3333333-3333-3333-3333-333333333331',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '33333333-3333-3333-3333-333333333333',
    6800.00,
    '2024-11-05',
    '2024-11-05',
    'paid',
    'Mensalidade Novembro 2024',
    'transferencia',
    NULL
  ),
  (
    'c3333333-3333-3333-3333-333333333332',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '33333333-3333-3333-3333-333333333333',
    6800.00,
    '2024-12-05',
    NULL,
    'overdue',
    'Mensalidade Dezembro 2024',
    NULL,
    'Entrar em contato - vencido há 2 dias'
  ),
  -- Restaurante Sabor & Arte
  (
    'd4444444-4444-4444-4444-444444444441',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '44444444-4444-4444-4444-444444444444',
    1800.00,
    '2024-11-20',
    '2024-11-22',
    'paid',
    'Mensalidade Novembro 2024',
    'pix',
    'Pago com 2 dias de atraso'
  ),
  (
    'd4444444-4444-4444-4444-444444444442',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '44444444-4444-4444-4444-444444444444',
    1800.00,
    '2024-12-20',
    NULL,
    'pending',
    'Mensalidade Dezembro 2024',
    NULL,
    NULL
  );

-- =============================================================================
-- SUGGESTIONS (Sugestões de otimização)
-- =============================================================================

INSERT INTO suggestions (id, user_id, client_id, type, severity, title, description, actions, status)
VALUES
  -- TechStore Brasil
  (
    'e1111111-1111-1111-1111-111111111111',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '11111111-1111-1111-1111-111111111111',
    'pause_ad',
    'urgent',
    'Pausar anúncio com CPA alto',
    'O anúncio "Acessórios - Fones Bluetooth" está com CPA de R$153,85, muito acima da média de R$43,88. Recomendamos pausar e realocar o orçamento.',
    '["Pausar o anúncio no Meta Ads", "Realocar orçamento para anúncios performantes"]',
    'pending'
  ),
  (
    'e1111111-1111-1111-1111-111111111112',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '11111111-1111-1111-1111-111111111111',
    'scale_opportunity',
    'info',
    'Oportunidade de escala',
    'O anúncio "Black Friday - Smartphones" tem o melhor CPA (R$31,03) e CTR (2.11%). Considere aumentar o orçamento em 30%.',
    '["Aumentar orçamento em 30%", "Duplicar público-alvo"]',
    'pending'
  ),
  -- Clínica Bem Estar
  (
    'f2222222-2222-2222-2222-222222222221',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '22222222-2222-2222-2222-222222222222',
    'budget_optimization',
    'warning',
    'Realocar orçamento de campanha',
    'A campanha de Implante Dentário tem CPA 66% maior que Clareamento. Sugerimos realocar 20% do orçamento para campanhas mais eficientes.',
    '["Revisar distribuição de orçamento", "Pausar campanha de Implante temporariamente"]',
    'pending'
  ),
  -- Imobiliária Premium
  (
    'a3333333-3333-3333-3333-333333333331',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '33333333-3333-3333-3333-333333333333',
    'creative_fatigue',
    'warning',
    'Possível fadiga criativa detectada',
    'Os anúncios de imóveis em Alphaville e Moema estão com CTR abaixo de 2%. Recomendamos testar novos criativos.',
    '["Criar novos criativos", "Testar novos formatos de vídeo"]',
    'pending'
  ),
  (
    'a3333333-3333-3333-3333-333333333332',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '33333333-3333-3333-3333-333333333333',
    'high_cpa',
    'urgent',
    'CPA muito elevado em lançamento',
    'O anúncio "Lançamento Vila Nova" tem CPA de R$500 com apenas 4 leads. Avaliar se a segmentação está correta ou pausar.',
    '["Pausar anúncio", "Revisar segmentação de público"]',
    'pending'
  ),
  -- Restaurante Sabor & Arte
  (
    'b4444444-4444-4444-4444-444444444441',
    '55bfa5d6-b9d7-4bf8-a3fd-d3d636629e2e',
    '44444444-4444-4444-4444-444444444444',
    'scale_opportunity',
    'info',
    'Excelente performance - Escalar',
    'Todos os anúncios estão com CPA abaixo de R$15. O "Almoço Executivo" tem o melhor desempenho. Excelente momento para escalar!',
    '["Aumentar orçamento em 50%", "Expandir raio de delivery"]',
    'pending'
  );
