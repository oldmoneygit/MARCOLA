/**
 * @file FieldsChecklist.tsx
 * @description Checklist de campos que mostra quais informações foram detectadas no texto
 * @module components/clients
 *
 * @example
 * <FieldsChecklist text={transcript} />
 */

'use client';

import { useMemo } from 'react';

interface FieldConfig {
  id: string;
  label: string;
  required: boolean;
  keywords: string[];
  patterns?: RegExp[];
}

interface FieldsChecklistProps {
  /** Texto para analisar */
  text: string;
  /** Modo compacto (menos detalhes) */
  compact?: boolean;
}

/**
 * Configuração dos campos e como detectá-los no texto
 */
const FIELDS_CONFIG: FieldConfig[] = [
  // Campos obrigatórios
  {
    id: 'name',
    label: 'Nome do Cliente',
    required: true,
    keywords: ['academia', 'restaurante', 'loja', 'empresa', 'clínica', 'consultório', 'salão', 'barbearia', 'construtora', 'imobiliária', 'escola', 'curso'],
    patterns: [
      /(?:cliente|empresa|negócio)[:\s]+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú]?[a-zà-ú]+)*)/i,
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú]?[a-zà-ú]+)*)\s*,/,
    ],
  },
  {
    id: 'segment',
    label: 'Segmento',
    required: true,
    keywords: [
      'fitness', 'academia', 'crossfit', 'pilates', 'yoga',
      'delivery', 'restaurante', 'pizzaria', 'lanchonete', 'hamburgueria', 'comida',
      'ecommerce', 'e-commerce', 'loja virtual', 'loja online',
      'serviço', 'serviços', 'consultoria', 'assessoria', 'agência',
      'educação', 'escola', 'curso', 'cursos', 'ensino',
      'saúde', 'clínica', 'consultório', 'médico', 'dentista',
      'construção', 'construtora', 'imobiliária', 'imóveis',
      'evento', 'eventos', 'festas', 'casamento', 'buffet',
      'beleza', 'estética', 'salão', 'barbearia', 'maquiagem', 'spa',
      'automotivo', 'carro', 'veículo', 'mecânica', 'auto',
    ],
  },
  {
    id: 'monthly_value',
    label: 'Valor Mensal',
    required: true,
    keywords: ['valor', 'reais', 'r$', 'mensal', 'mensalidade', 'cobra', 'cobrar', 'paga', 'pagar', 'contrato', 'fee'],
    patterns: [
      /r\$\s*[\d.,]+/i,
      /[\d.,]+\s*(?:reais|mil|k)/i,
      /(?:valor|mensal|mensalidade|cobra|paga)[:\s]*[\d.,]+/i,
    ],
  },
  {
    id: 'due_day',
    label: 'Dia de Vencimento',
    required: true,
    keywords: ['dia', 'vencimento', 'vence', 'todo dia', 'pagamento'],
    patterns: [
      /(?:dia|vencimento|vence|todo dia)\s*(\d{1,2})/i,
      /(\d{1,2})\s*(?:de cada mês|do mês)/i,
    ],
  },
  // Campos opcionais - Localização e Financeiro
  {
    id: 'city',
    label: 'Cidade',
    required: false,
    keywords: ['cidade', 'região', 'localizado', 'fica em', 'são paulo', 'rio de janeiro', 'belo horizonte', 'curitiba', 'porto alegre', 'salvador', 'recife', 'fortaleza', 'brasília'],
    patterns: [
      /(?:cidade|região|fica em|localizado em)[:\s]+([A-ZÀ-Ú][a-zà-ú]+)/i,
    ],
  },
  {
    id: 'average_ticket',
    label: 'Ticket Médio',
    required: false,
    keywords: ['ticket', 'ticket médio', 'média de compra', 'gasto médio', 'valor médio', 'cliente gasta'],
    patterns: [
      /ticket[:\s]*(?:médio)?[:\s]*r?\$?\s*[\d.,]+/i,
      /(?:gasto|valor)\s*médio[:\s]*r?\$?\s*[\d.,]+/i,
    ],
  },
  // Campos opcionais - Contato
  {
    id: 'contact_name',
    label: 'Nome do Contato',
    required: false,
    keywords: ['contato', 'responsável', 'falar com', 'conversar com', 'dono', 'dona', 'proprietário', 'proprietária', 'gerente'],
    patterns: [
      /(?:contato|responsável|falar com|dono|dona|proprietário|gerente)[:\s]+([A-ZÀ-Ú][a-zà-ú]+)/i,
    ],
  },
  {
    id: 'contact_phone',
    label: 'Telefone/WhatsApp',
    required: false,
    keywords: ['telefone', 'celular', 'whatsapp', 'zap', 'whats', 'número', 'ligar'],
    patterns: [
      /\(?\d{2}\)?\s*9?\d{4}[-.\s]?\d{4}/,
      /\d{10,11}/,
    ],
  },
  {
    id: 'contact_email',
    label: 'Email',
    required: false,
    keywords: ['email', 'e-mail', 'correio', '@'],
    patterns: [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    ],
  },
  // Campos opcionais - Redes Sociais
  {
    id: 'instagram_url',
    label: 'Instagram',
    required: false,
    keywords: ['instagram', 'insta', '@', 'arroba'],
    patterns: [
      /@[a-zA-Z0-9._]+/,
      /instagram\.com\/[a-zA-Z0-9._]+/i,
    ],
  },
  // Campos opcionais - Links
  {
    id: 'website_url',
    label: 'Website',
    required: false,
    keywords: ['site', 'website', 'página', 'www', '.com', '.br'],
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/,
    ],
  },
  // Campos opcionais - Estratégia
  {
    id: 'peak_hours',
    label: 'Horários de Pico',
    required: false,
    keywords: ['horário', 'pico', 'movimento', 'mais vende', 'melhor horário', 'noite', 'almoço', 'fim de semana', 'finais de semana'],
    patterns: [
      /(\d{1,2}h?\s*[-às]\s*\d{1,2}h?)/i,
      /(?:horário|pico|movimento)[:\s]+(.+)/i,
    ],
  },
  {
    id: 'differentials',
    label: 'Diferenciais',
    required: false,
    keywords: ['diferencial', 'diferente', 'único', 'exclusivo', 'especializado', 'melhor', 'destaque'],
  },
  {
    id: 'ideal_customer',
    label: 'Cliente Ideal',
    required: false,
    keywords: ['público', 'público-alvo', 'cliente ideal', 'perfil', 'persona', 'target', 'foco', 'quem compra', 'quem frequenta'],
  },
];

/**
 * Verifica se um campo foi detectado no texto
 */
function detectField(text: string, field: FieldConfig): boolean {
  const normalizedText = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Verificar keywords
  for (const keyword of field.keywords) {
    const normalizedKeyword = keyword.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }
  }

  // Verificar patterns
  if (field.patterns) {
    for (const pattern of field.patterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Componente de checklist de campos
 */
export function FieldsChecklist({ text, compact = false }: FieldsChecklistProps) {
  // Analisar texto e detectar campos
  const detectedFields = useMemo(() => {
    if (!text.trim()) {
      return new Set<string>();
    }

    const detected = new Set<string>();
    for (const field of FIELDS_CONFIG) {
      if (detectField(text, field)) {
        detected.add(field.id);
      }
    }
    return detected;
  }, [text]);

  // Separar campos obrigatórios e opcionais
  const requiredFields = FIELDS_CONFIG.filter(f => f.required);
  const optionalFields = FIELDS_CONFIG.filter(f => !f.required);

  // Contar campos preenchidos
  const requiredFilled = requiredFields.filter(f => detectedFields.has(f.id)).length;
  const totalRequired = requiredFields.length;

  // Progresso
  const progress = totalRequired > 0 ? (requiredFilled / totalRequired) * 100 : 0;

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Barra de progresso compacta */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                progress === 100
                  ? 'bg-emerald-500'
                  : progress >= 50
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400 whitespace-nowrap">
            {requiredFilled}/{totalRequired} obrigatórios
          </span>
        </div>

        {/* Lista compacta de campos faltantes */}
        {requiredFilled < totalRequired && (
          <div className="flex flex-wrap gap-1.5">
            {requiredFields
              .filter(f => !detectedFields.has(f.id))
              .map(field => (
                <span
                  key={field.id}
                  className="px-2 py-0.5 text-xs rounded-full bg-red-500/10 text-red-400 border border-red-500/20"
                >
                  {field.label}
                </span>
              ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com progresso */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-zinc-300">Campos Detectados</h4>
        <span className={`text-xs font-medium ${
          progress === 100 ? 'text-emerald-400' : 'text-zinc-400'
        }`}>
          {requiredFilled}/{totalRequired} obrigatórios
        </span>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 bg-white/[0.08] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${
            progress === 100
              ? 'bg-gradient-to-r from-emerald-500 to-green-500'
              : progress >= 50
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500'
              : 'bg-gradient-to-r from-red-500 to-orange-500'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Campos obrigatórios */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Obrigatórios</p>
        <div className="grid grid-cols-2 gap-2">
          {requiredFields.map(field => {
            const isDetected = detectedFields.has(field.id);
            return (
              <div
                key={field.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isDetected
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-white/[0.03] border border-white/[0.08]'
                }`}
              >
                {isDetected ? (
                  <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-zinc-600 flex-shrink-0" />
                )}
                <span className={`text-sm ${isDetected ? 'text-emerald-300' : 'text-zinc-400'}`}>
                  {field.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Campos opcionais */}
      <div className="space-y-2">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">Opcionais</p>
        <div className="grid grid-cols-2 gap-2">
          {optionalFields.map(field => {
            const isDetected = detectedFields.has(field.id);
            return (
              <div
                key={field.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  isDetected
                    ? 'bg-violet-500/10 border border-violet-500/20'
                    : 'bg-white/[0.02] border border-white/[0.05]'
                }`}
              >
                {isDetected ? (
                  <svg className="w-4 h-4 text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <div className="w-4 h-4 rounded-full border border-zinc-700 flex-shrink-0" />
                )}
                <span className={`text-sm ${isDetected ? 'text-violet-300' : 'text-zinc-500'}`}>
                  {field.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Mensagem de sucesso */}
      {progress === 100 && (
        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-emerald-300">
              Todos os campos obrigatórios foram mencionados!
            </p>
          </div>
        </div>
      )}

      {/* Dica de campos faltantes */}
      {progress < 100 && text.trim() && (
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <p className="text-xs text-amber-300">
            <strong>Dica:</strong> Mencione{' '}
            {requiredFields
              .filter(f => !detectedFields.has(f.id))
              .map(f => f.label.toLowerCase())
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
