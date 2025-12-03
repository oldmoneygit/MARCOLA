/**
 * @file briefing.ts
 * @description Tipos para o sistema de briefing/questionário por nicho
 * @module types/briefing
 */

// =============================================
// Tipos de campo do briefing
// =============================================

/** Tipos de campo disponíveis para perguntas do briefing */
export type BriefingFieldType =
  | 'text'      // Input de texto simples
  | 'textarea'  // Área de texto multilinha
  | 'select'    // Dropdown de seleção única
  | 'multiselect' // Seleção múltipla
  | 'checkbox'  // Checkbox sim/não
  | 'number'    // Input numérico
  | 'date';     // Seletor de data

// =============================================
// Briefing Question (Pergunta)
// =============================================

/** Pergunta do briefing */
export interface BriefingQuestion {
  id: string;
  template_id: string;
  question: string;
  field_type: BriefingFieldType;
  options: string[] | null; // Para select/multiselect
  placeholder: string | null;
  is_required: boolean;
  order_index: number;
  created_at: string;
}

/** DTO para criar pergunta */
export interface CreateBriefingQuestionDTO {
  question: string;
  field_type: BriefingFieldType;
  options?: string[];
  placeholder?: string;
  is_required?: boolean;
  order_index?: number;
}

/** DTO para atualizar pergunta */
export interface UpdateBriefingQuestionDTO {
  question?: string;
  field_type?: BriefingFieldType;
  options?: string[];
  placeholder?: string;
  is_required?: boolean;
  order_index?: number;
}

// =============================================
// Briefing Template
// =============================================

/** Template de briefing */
export interface BriefingTemplate {
  id: string;
  user_id: string | null; // null = template do sistema
  segment: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  /** Perguntas do template (quando carregadas via join) */
  questions?: BriefingQuestion[];
}

/** DTO para criar template de briefing */
export interface CreateBriefingTemplateDTO {
  segment: string;
  name: string;
  description?: string;
  is_active?: boolean;
  /** Perguntas a serem criadas junto com o template */
  questions?: CreateBriefingQuestionDTO[];
}

/** DTO para atualizar template de briefing */
export interface UpdateBriefingTemplateDTO {
  segment?: string;
  name?: string;
  description?: string;
  is_active?: boolean;
}

// =============================================
// Briefing Data (Respostas do cliente)
// =============================================

/** Resposta individual do briefing */
export interface BriefingAnswer {
  question_id: string;
  question_text: string; // Snapshot da pergunta no momento da resposta
  field_type: BriefingFieldType;
  value: string | string[] | number | boolean | null;
}

/** Dados de briefing salvos no cliente */
export interface BriefingData {
  template_id: string;
  template_name: string;
  answered_at: string;
  answers: BriefingAnswer[];
}

// =============================================
// API Response types
// =============================================

/** Template com perguntas incluídas */
export interface BriefingTemplateWithQuestions extends BriefingTemplate {
  questions: BriefingQuestion[];
}

/** Resposta da API de listagem */
export interface BriefingTemplatesResponse {
  templates: BriefingTemplate[];
  total: number;
}
