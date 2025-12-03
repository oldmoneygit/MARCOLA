/**
 * @file route.ts
 * @description API Route para listagem e criação de clientes
 * @module api/clients
 */

import { NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';
import { MEETING_FREQUENCIES, WEEK_DAYS } from '@/lib/constants';

import type { CreateClientDTO, WeekDay, MeetingFrequency } from '@/types';
import type { NextRequest } from 'next/server';

/**
 * Mapeia o dia da semana para o índice (0 = domingo, 1 = segunda, etc.)
 */
const DAY_INDEX_MAP: Record<WeekDay, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

/**
 * Retorna o intervalo em semanas baseado na frequência
 */
function getWeekInterval(frequency: MeetingFrequency): number {
  switch (frequency) {
    case 'weekly':
      return 1;
    case 'biweekly':
      return 2;
    case 'monthly':
      return 4;
    default:
      return 1;
  }
}

/**
 * Gera as datas das reuniões para os próximos 3 meses
 */
function generateMeetingDates(
  dayOfWeek: WeekDay,
  frequency: MeetingFrequency,
  monthsAhead: number = 3
): Date[] {
  const dates: Date[] = [];
  const targetDayIndex = DAY_INDEX_MAP[dayOfWeek];
  const weekInterval = getWeekInterval(frequency);

  // Encontrar a próxima ocorrência do dia da semana
  const today = new Date();
  const nextDate = new Date(today);

  // Ajustar para o próximo dia da semana desejado
  const currentDayIndex = today.getDay();
  let daysUntilTarget = targetDayIndex - currentDayIndex;
  if (daysUntilTarget <= 0) {
    daysUntilTarget += 7;
  }
  nextDate.setDate(today.getDate() + daysUntilTarget);

  // Limitar até X meses no futuro
  const endDate = new Date(today);
  endDate.setMonth(endDate.getMonth() + monthsAhead);

  while (nextDate <= endDate) {
    dates.push(new Date(nextDate));
    nextDate.setDate(nextDate.getDate() + weekInterval * 7);
  }

  return dates;
}

/**
 * GET /api/clients
 * Lista todos os clientes do usuário autenticado
 */
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const { data: clients, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[API] GET /api/clients error:', error);
      return NextResponse.json({ error: 'Erro ao buscar clientes' }, { status: 500 });
    }

    return NextResponse.json(clients);
  } catch (err) {
    console.error('[API] GET /api/clients unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

/**
 * POST /api/clients
 * Cria um novo cliente
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const body: CreateClientDTO = await request.json();

    // Validação básica
    if (!body.name || !body.segment || !body.monthly_value || !body.due_day) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: name, segment, monthly_value, due_day' },
        { status: 400 }
      );
    }

    const { data: client, error } = await supabase
      .from('clients')
      .insert({
        user_id: user.id,
        name: body.name,
        segment: body.segment,
        status: 'active',
        // Financeiro
        monthly_value: body.monthly_value,
        due_day: body.due_day,
        average_ticket: body.average_ticket || null,
        // Localização
        city: body.city || null,
        // Contato
        contact_name: body.contact_name || null,
        contact_phone: body.contact_phone || null,
        contact_email: body.contact_email || null,
        // Redes sociais
        instagram_url: body.instagram_url || null,
        facebook_page_id: body.facebook_page_id || null,
        // Links e recursos
        ads_account_url: body.ads_account_url || null,
        website_url: body.website_url || null,
        drive_url: body.drive_url || null,
        menu_url: body.menu_url || null,
        assets_links: body.assets_links || null,
        // Estratégia
        peak_hours: body.peak_hours || null,
        differentials: body.differentials || null,
        ideal_customer: body.ideal_customer || null,
        goals_short_term: body.goals_short_term || null,
        goals_long_term: body.goals_long_term || null,
        // Gestão e produção
        meeting_frequency: body.meeting_frequency || null,
        captation_frequency: body.captation_frequency || null,
        videos_sales: body.videos_sales || null,
        videos_awareness: body.videos_awareness || null,
        fixed_meeting_enabled: body.fixed_meeting_enabled ?? null,
        fixed_meeting_day: body.fixed_meeting_day || null,
        fixed_meeting_time: body.fixed_meeting_time || null,
        image_authorization: body.image_authorization ?? null,
        content_request: body.content_request || null,
        // Briefing
        briefing_data: body.briefing_data || null,
        // Observações
        notes: body.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[API] POST /api/clients error:', error);
      return NextResponse.json({ error: 'Erro ao criar cliente' }, { status: 500 });
    }

    // Criar eventos de reunião recorrentes se dia fixo estiver habilitado
    if (
      body.fixed_meeting_enabled &&
      body.fixed_meeting_day &&
      body.meeting_frequency &&
      body.meeting_frequency !== 'on_demand'
    ) {
      try {
        const meetingDates = generateMeetingDates(
          body.fixed_meeting_day,
          body.meeting_frequency,
          3 // 3 meses de reuniões
        );

        const frequencyLabel = MEETING_FREQUENCIES.find(
          (f) => f.value === body.meeting_frequency
        )?.label || body.meeting_frequency;

        const dayLabel = WEEK_DAYS.find(
          (d) => d.value === body.fixed_meeting_day
        )?.label || body.fixed_meeting_day;

        // Criar eventos de reunião no calendário
        const meetingEvents = meetingDates.map((date) => ({
          user_id: user.id,
          client_id: client.id,
          title: `Reunião - ${body.name}`,
          description: `Reunião ${frequencyLabel.toLowerCase()} com ${body.name}.\nDia fixo: ${dayLabel}${body.fixed_meeting_time ? ` às ${body.fixed_meeting_time}` : ''}`,
          type: 'event' as const,
          scheduled_date: date.toISOString().split('T')[0],
          scheduled_time: body.fixed_meeting_time || null,
          status: 'planned' as const,
          platform: [],
          color: '#8b5cf6', // Violeta para reuniões
          notes: `Reunião ${frequencyLabel.toLowerCase()} configurada automaticamente`,
        }));

        if (meetingEvents.length > 0) {
          const { error: eventsError } = await supabase
            .from('calendar_events')
            .insert(meetingEvents);

          if (eventsError) {
            console.error('[API] Error creating meeting events:', eventsError);
            // Não falhar a criação do cliente, apenas logar o erro
          }
        }
      } catch (eventsErr) {
        console.error('[API] Error generating meeting events:', eventsErr);
        // Não falhar a criação do cliente
      }
    }

    return NextResponse.json(client, { status: 201 });
  } catch (err) {
    console.error('[API] POST /api/clients unexpected error:', err);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
