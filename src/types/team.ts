/**
 * @file team.ts
 * @description Tipos relacionados à gestão de equipe e atribuição de tarefas
 * @module types
 */

// =============================================================================
// Tipos Base
// =============================================================================

/** Função do membro na equipe */
export type TeamRole = 'admin' | 'manager' | 'member' | 'viewer';

/** Status do convite */
export type InviteStatus = 'not_invited' | 'pending' | 'accepted' | 'expired';

/** Status do convite na tabela de convites */
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

/** Permissões granulares do membro */
export interface TeamPermissions {
  can_view_clients: boolean;
  can_edit_clients: boolean;
  can_view_reports: boolean;
  can_edit_reports: boolean;
  can_view_financial: boolean;
  can_manage_tasks: boolean;
  can_assign_tasks: boolean;
}

/** Especialidades comuns do membro */
export type TeamSpecialty =
  | 'criativos'
  | 'copywriting'
  | 'gestao_campanhas'
  | 'analise_dados'
  | 'atendimento'
  | 'estrategia'
  | 'design'
  | 'video'
  | 'social_media';

// =============================================================================
// Interfaces Principais
// =============================================================================

/**
 * Membro da equipe
 */
export interface TeamMember {
  id: string;
  owner_id: string;
  user_id: string | null;
  auth_user_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  role: TeamRole;
  specialties: string[];
  color: string;
  permissions: TeamPermissions;
  is_active: boolean;
  invite_status: InviteStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Convite para membro da equipe
 */
export interface TeamInvitation {
  id: string;
  owner_id: string;
  team_member_id: string;
  email: string;
  token: string;
  status: InvitationStatus;
  expires_at: string;
  accepted_at: string | null;
  accepted_by: string | null;
  created_at: string;
  updated_at: string;
  /** Dados do membro (quando join) */
  team_member?: TeamMember;
}

/**
 * Histórico de atribuição de tarefa
 */
export interface TaskAssignmentHistory {
  id: string;
  task_id: string;
  assigned_by: string | null;
  previous_assignee: string | null;
  new_assignee: string | null;
  note: string | null;
  created_at: string;
  /** Dados do membro anterior (quando join) */
  previous_member?: TeamMember | null;
  /** Dados do novo membro (quando join) */
  new_member?: TeamMember | null;
}

// =============================================================================
// DTOs (Data Transfer Objects)
// =============================================================================

/**
 * DTO para criar membro da equipe
 */
export interface CreateTeamMemberDTO {
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  role?: TeamRole;
  specialties?: string[];
  color?: string;
  permissions?: Partial<TeamPermissions>;
}

/**
 * DTO para atualizar membro da equipe
 */
export interface UpdateTeamMemberDTO extends Partial<CreateTeamMemberDTO> {
  is_active?: boolean;
}

/**
 * DTO para atribuir tarefa a membro
 */
export interface AssignTaskDTO {
  task_id: string;
  assigned_to: string | null;
  note?: string;
}

/**
 * DTO para atribuir múltiplas tarefas
 */
export interface BulkAssignTasksDTO {
  task_ids: string[];
  assigned_to: string | null;
  note?: string;
}

/**
 * DTO para enviar convite
 */
export interface SendInvitationDTO {
  team_member_id: string;
}

/**
 * DTO para aceitar convite
 */
export interface AcceptInvitationDTO {
  token: string;
  password: string;
  name?: string;
}

/**
 * Resposta de aceitar convite
 */
export interface AcceptInvitationResponse {
  success: boolean;
  error?: string;
  member?: TeamMember;
  owner_id?: string;
}

// =============================================================================
// Configurações de UI
// =============================================================================

/** Configuração visual das funções */
export const TEAM_ROLE_CONFIG: Record<TeamRole, {
  label: string;
  description: string;
  icon: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  admin: {
    label: 'Administrador',
    description: 'Acesso total ao sistema',
    icon: 'shield',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
  manager: {
    label: 'Gerente',
    description: 'Gerencia equipe e clientes',
    icon: 'users',
    bgColor: 'bg-violet-500/20',
    textColor: 'text-violet-400',
    borderColor: 'border-violet-500/30',
  },
  member: {
    label: 'Membro',
    description: 'Executa tarefas atribuídas',
    icon: 'user',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500/30',
  },
  viewer: {
    label: 'Visualizador',
    description: 'Apenas visualização',
    icon: 'eye',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
  },
};

/** Lista de especialidades com labels */
export const TEAM_SPECIALTIES: { value: TeamSpecialty; label: string }[] = [
  { value: 'criativos', label: 'Criativos' },
  { value: 'copywriting', label: 'Copywriting' },
  { value: 'gestao_campanhas', label: 'Gestão de Campanhas' },
  { value: 'analise_dados', label: 'Análise de Dados' },
  { value: 'atendimento', label: 'Atendimento' },
  { value: 'estrategia', label: 'Estratégia' },
  { value: 'design', label: 'Design' },
  { value: 'video', label: 'Vídeo' },
  { value: 'social_media', label: 'Social Media' },
];

/** Cores predefinidas para membros */
export const TEAM_MEMBER_COLORS = [
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // red
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
];

/** Configuração visual dos status de convite */
export const INVITE_STATUS_CONFIG: Record<InviteStatus, {
  label: string;
  description: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
}> = {
  not_invited: {
    label: 'Não convidado',
    description: 'Membro ainda não foi convidado para acessar a plataforma',
    bgColor: 'bg-zinc-500/20',
    textColor: 'text-zinc-400',
    borderColor: 'border-zinc-500/30',
  },
  pending: {
    label: 'Convite pendente',
    description: 'Aguardando aceite do convite',
    bgColor: 'bg-amber-500/20',
    textColor: 'text-amber-400',
    borderColor: 'border-amber-500/30',
  },
  accepted: {
    label: 'Conta ativa',
    description: 'Membro com acesso à plataforma',
    bgColor: 'bg-emerald-500/20',
    textColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/30',
  },
  expired: {
    label: 'Convite expirado',
    description: 'O convite expirou e precisa ser reenviado',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500/30',
  },
};

/** Permissões padrão por role */
export const DEFAULT_PERMISSIONS_BY_ROLE: Record<TeamRole, TeamPermissions> = {
  admin: {
    can_view_clients: true,
    can_edit_clients: true,
    can_view_reports: true,
    can_edit_reports: true,
    can_view_financial: true,
    can_manage_tasks: true,
    can_assign_tasks: true,
  },
  manager: {
    can_view_clients: true,
    can_edit_clients: true,
    can_view_reports: true,
    can_edit_reports: true,
    can_view_financial: true,
    can_manage_tasks: true,
    can_assign_tasks: true,
  },
  member: {
    can_view_clients: true,
    can_edit_clients: false,
    can_view_reports: true,
    can_edit_reports: false,
    can_view_financial: false,
    can_manage_tasks: true,
    can_assign_tasks: false,
  },
  viewer: {
    can_view_clients: true,
    can_edit_clients: false,
    can_view_reports: true,
    can_edit_reports: false,
    can_view_financial: false,
    can_manage_tasks: false,
    can_assign_tasks: false,
  },
};
