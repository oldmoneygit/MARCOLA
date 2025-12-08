/**
 * @file diagnostico.ts
 * @description Tipos para o sistema de Diagnóstico Profundo de Leads
 * @module types
 */

// ==================== NICHO ====================

export type NichoType =
  | 'academia'
  | 'restaurante'
  | 'clinica_medica'
  | 'ecommerce'
  | 'imobiliaria'
  | 'advogado'
  | 'escola_curso'
  | 'salao_beleza'
  | 'auto_mecanica'
  | 'pet_shop'
  | 'contabilidade'
  | 'consultoria'
  | 'agencia_marketing'
  | 'hotel_pousada'
  | 'loja_fisica'
  | 'outro';

export interface NichoInfo {
  nome: string;
  keywords: string[];
  dores: string[];
  metricas: string[];
  templates: {
    abertura: string;
    followUp: string;
    fechamento: string;
  };
}

export type CatalogoNichos = Record<NichoType, NichoInfo>;

// ==================== CLASSIFICAÇÃO ====================

export type LeadTemperatura = 'HOT' | 'WARM' | 'COOL';

export interface ClassificacaoLead {
  temperatura: LeadTemperatura;
  score: number;
  motivo: string;
}

// ==================== DIAGNÓSTICO ====================

export interface DiagnosticoEmpresa {
  nome: string;
  nicho: NichoType;
  nichoDetectado: string;
  confiancaNicho: number;
  tamanhoEstimado: 'micro' | 'pequena' | 'media' | 'grande';
  presencaDigital: 'baixa' | 'media' | 'alta';
}

export interface DiagnosticoAnalise {
  resumo: string;
  detalhes: string;
  nivelMaturidade: 'iniciante' | 'intermediario' | 'avancado';
  urgencia: 'baixa' | 'media' | 'alta' | 'critica';
}

export interface DiagnosticoPonto {
  titulo: string;
  descricao: string;
  impacto: 'baixo' | 'medio' | 'alto';
}

export interface DiagnosticoOportunidade {
  titulo: string;
  descricao: string;
  potencialROI: 'baixo' | 'medio' | 'alto';
  prazoImplementacao: 'curto' | 'medio' | 'longo';
}

export interface DiagnosticoEstrategia {
  objetivo: string;
  acoes: string[];
  investimentoSugerido: {
    min: number;
    max: number;
    moeda: string;
  };
  resultadosEsperados: string[];
  prazoResultados: string;
}

export interface DiagnosticoAbordagem {
  tom: 'consultivo' | 'direto' | 'educativo' | 'urgente';
  angulo: string;
  gatilhos: string[];
  objecoesPrevistas: string[];
  respostasObjecoes: Record<string, string>;
}

export interface DiagnosticoMensagem {
  tipo: 'abertura' | 'followUp' | 'fechamento' | 'reengajamento';
  assunto?: string;
  conteudo: string;
  melhorHorario?: string;
  canalRecomendado: 'whatsapp' | 'email' | 'telefone' | 'presencial';
}

export interface DiagnosticoCompleto {
  id: string;
  leadId: string;
  criadoEm: string;
  atualizadoEm: string;
  empresa: DiagnosticoEmpresa;
  diagnostico: DiagnosticoAnalise;
  classificacao: ClassificacaoLead;
  pontosFracos: DiagnosticoPonto[];
  pontosFortes: DiagnosticoPonto[];
  oportunidades: DiagnosticoOportunidade[];
  estrategia: DiagnosticoEstrategia;
  abordagem: DiagnosticoAbordagem;
  mensagens: DiagnosticoMensagem[];
}

// ==================== API ====================

export interface DiagnosticoRequest {
  leadId: string;
  nome: string;
  telefone?: string;
  email?: string;
  empresa?: string;
  site?: string;
  instagram?: string;
  observacoes?: string;
  fonte?: string;
}

export interface DiagnosticoResponse {
  success: boolean;
  data?: DiagnosticoCompleto;
  error?: string;
  message?: string;
}

// ==================== UI ====================

export interface DiagnosticoCardProps {
  diagnostico: DiagnosticoCompleto;
  onRefresh?: () => void;
  onSendMessage?: (mensagem: DiagnosticoMensagem) => void;
  loading?: boolean;
}

export interface ModalDiagnosticoProps {
  isOpen: boolean;
  onClose: () => void;
  leadId: string;
  leadNome: string;
  onDiagnosticoComplete?: (diagnostico: DiagnosticoCompleto) => void;
}

// ==================== RESPOSTA N8N ====================

/**
 * Estrutura da resposta do webhook n8n de diagnóstico
 * (diferente do DiagnosticoCompleto usado no frontend)
 */
export interface DiagnosticoN8nResponse {
  success: boolean;
  versao: string;
  empresa: {
    nome: string;
    endereco?: string;
    cidade?: string;
    telefone?: string;
    website?: string;
    rating?: number;
    totalAvaliacoes?: number;
    categoria?: string;
    googleMapsUrl?: string;
    placeId?: string;
  };
  oportunidadesDetectadas: string[];
  scoreOportunidade: number;
  reviews?: Array<{
    autor: string;
    rating: number;
    texto: string;
    tempo: string;
  }>;
  diagnosticoIA: {
    resumoExecutivo: string;
    pontosFOrtes?: string[];  // Typo do n8n (O maiúsculo)
    pontosFortes?: string[];  // Versão correta
    pontosAMelhorar?: string[];
    oportunidades?: Array<{
      titulo: string;
      descricao: string;
      impacto: string;
      urgencia: string;
    }>;
    analiseReviews?: string;
    recomendacaoPrioritaria?: string;
    scoreGeral: number;
  };
  geradoEm: string;
}
