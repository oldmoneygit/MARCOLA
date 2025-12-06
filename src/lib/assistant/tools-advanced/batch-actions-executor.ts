/**
 * @file batch-actions-executor.ts
 * @description Executor dos Tools de Ações em Lote do MARCOLA Assistant
 * @module lib/assistant/tools-advanced
 */

import { createClient } from '@/lib/supabase/server';
import { getZAPIService } from '@/lib/whatsapp';
import type { ConfirmationData } from '../types';
import type {
  BatchCobrancaData,
  BatchConfirmacaoReuniaoData,
  BatchFollowupData,
  GerarFaturasData,
  BatchActionResult
} from '../types-advanced';

/**
 * Converte uma data para string no formato YYYY-MM-DD
 */
function toDateString(date: Date): string {
  return date.toISOString().split('T')[0] as string;
}

export class BatchActionsExecutor {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // ==================== COBRAR TODOS VENCIDOS ====================

  async prepararCobrancaLote(params: {
    diasMinimo?: number;
    diasMaximo?: number;
    limite?: number;
    templateMensagem?: 'padrao' | 'leve' | 'firme';
  }): Promise<{ confirmation: ConfirmationData }> {
    const supabase = await createClient();
    const hoje = new Date();

    const diasMinimo = params.diasMinimo || 1;
    const limite = params.limite || 20;

    // Calcular data limite
    const dataLimite = new Date(hoje);
    dataLimite.setDate(dataLimite.getDate() - diasMinimo);

    // Buscar pagamentos vencidos
    let query = supabase
      .from('payments')
      .select(`
        id, amount, due_date,
        client:clients!client_id(id, name, contact_name, contact_phone)
      `)
      .eq('user_id', this.userId)
      .eq('status', 'pending')
      .lt('due_date', toDateString(dataLimite))
      .order('due_date')
      .limit(limite);

    if (params.diasMaximo) {
      const dataMinima = new Date(hoje);
      dataMinima.setDate(dataMinima.getDate() - params.diasMaximo);
      query = query.gte('due_date', toDateString(dataMinima));
    }

    const { data: pagamentos, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar pagamentos: ${error.message}`);
    }

    if (!pagamentos || pagamentos.length === 0) {
      throw new Error('Nenhum pagamento vencido encontrado com os critérios especificados.');
    }

    // Formatar dados
    const clientes: BatchCobrancaData['clientes'] = pagamentos.map(p => {
      const clientData = p.client;
      const client = Array.isArray(clientData) ? clientData[0] : clientData;
      const diasAtraso = Math.floor(
        (hoje.getTime() - new Date(p.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        clientId: client?.id || '',
        clientName: client?.name || 'Cliente',
        contactName: client?.contact_name || client?.name || 'Cliente',
        phone: client?.contact_phone || '',
        amount: Number(p.amount),
        daysOverdue: diasAtraso,
        paymentId: p.id,
        dueDate: p.due_date
      };
    }).filter(c => c.phone);

    if (clientes.length === 0) {
      throw new Error('Nenhum cliente com telefone cadastrado encontrado.');
    }

    const totalAmount = clientes.reduce((sum, c) => sum + c.amount, 0);

    // Template de mensagem
    const templates = {
      padrao: 'Olá {nome}! Tudo bem? 😊\n\nEstou passando para lembrar sobre o pagamento de R$ {valor} que venceu dia {vencimento}.\n\nPoderia verificar, por favor? Qualquer dúvida estou à disposição!',
      leve: 'Oi {nome}! Passando rapidinho pra lembrar do pagamento pendente. Me avisa quando puder resolver? 🙂',
      firme: 'Olá {nome},\n\nIdentifiquei que há um pagamento de R$ {valor} em aberto desde {vencimento} ({dias} dias).\n\nPreciso que regularize essa pendência o mais breve possível.\n\nAguardo retorno.'
    };

    const messageTemplate = templates[params.templateMensagem || 'padrao'];

    const confirmationData: BatchCobrancaData = {
      clientes,
      totalAmount,
      totalClientes: clientes.length,
      messageTemplate
    };

    return {
      confirmation: {
        id: `batch_cobranca_${Date.now()}`,
        type: 'generic',
        status: 'pending',
        data: {
          title: 'Cobrança em Lote',
          description: `Enviar cobrança para ${clientes.length} cliente(s)`,
          details: confirmationData as unknown as Record<string, unknown>
        },
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'cobrar_todos_vencidos',
          parameters: { ...params, _confirmationData: confirmationData }
        },
        createdAt: new Date()
      }
    };
  }

  async executarCobrancaLote(data: BatchCobrancaData): Promise<BatchActionResult> {
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    const zapiService = await getZAPIService(this.userId);

    for (const cliente of data.clientes) {
      try {
        // Formatar mensagem
        const mensagem = data.messageTemplate
          .replace('{nome}', cliente.contactName)
          .replace('{valor}', cliente.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
          .replace('{vencimento}', new Date(cliente.dueDate).toLocaleDateString('pt-BR'))
          .replace('{dias}', cliente.daysOverdue.toString());

        // Tentar enviar via Z-API
        if (zapiService && cliente.phone) {
          const phoneNumber = cliente.phone.replace(/\D/g, '');
          await zapiService.sendText({
            phone: phoneNumber,
            message: mensagem
          });

          successCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: true,
            details: { message: 'Enviado via WhatsApp' }
          });
        } else {
          failedCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: false,
            error: 'WhatsApp não configurado ou telefone inválido'
          });
        }
      } catch (error) {
        failedCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return {
      success: successCount > 0,
      totalProcessed: data.clientes.length,
      successCount,
      failedCount,
      results,
      summary: `Cobrança enviada para ${successCount} de ${data.clientes.length} clientes. ${failedCount > 0 ? `${failedCount} falha(s).` : ''}`
    };
  }

  // ==================== CONFIRMAR REUNIÕES DE AMANHÃ ====================

  async prepararConfirmacaoReunioes(params: {
    data?: string;
    templateMensagem?: 'formal' | 'casual';
  }): Promise<{ confirmation: ConfirmationData }> {
    const supabase = await createClient();
    const hoje = new Date();

    // Determinar data
    let dataAlvo: string;
    if (params.data) {
      dataAlvo = params.data;
    } else {
      const amanha = new Date(hoje);
      amanha.setDate(amanha.getDate() + 1);
      dataAlvo = toDateString(amanha);
    }

    // Buscar reuniões
    const { data: reunioes, error } = await supabase
      .from('meetings')
      .select(`
        id, time, type, notes,
        client:clients!client_id(id, name, contact_name, contact_phone)
      `)
      .eq('user_id', this.userId)
      .eq('date', dataAlvo)
      .eq('status', 'scheduled')
      .order('time');

    if (error) {
      throw new Error(`Erro ao buscar reuniões: ${error.message}`);
    }

    if (!reunioes || reunioes.length === 0) {
      throw new Error(`Nenhuma reunião encontrada para ${new Date(dataAlvo).toLocaleDateString('pt-BR')}.`);
    }

    // Formatar dados
    const reunioesFormatadas: BatchConfirmacaoReuniaoData['reunioes'] = reunioes.map(r => {
      const clientData = r.client;
      const client = Array.isArray(clientData) ? clientData[0] : clientData;

      return {
        meetingId: r.id,
        clientId: client?.id || '',
        clientName: client?.name || 'Cliente',
        contactName: client?.contact_name || client?.name || 'Cliente',
        phone: client?.contact_phone || '',
        time: r.time,
        type: (r.type as 'online' | 'presencial') || 'online'
      };
    }).filter(r => r.phone);

    if (reunioesFormatadas.length === 0) {
      throw new Error('Nenhum cliente com telefone cadastrado encontrado.');
    }

    // Template de mensagem
    const templates = {
      casual: 'Oi {nome}! Tudo bem? 😊\n\nPassando pra confirmar nossa reunião amanhã às {horario} ({tipo}).\n\nPode confirmar pra mim? Até lá! 🙌',
      formal: 'Olá {nome},\n\nGostaria de confirmar nossa reunião agendada para amanhã, {data}, às {horario}.\n\nA reunião será {tipo}.\n\nPor favor, confirme sua disponibilidade.\n\nAtenciosamente.'
    };

    const messageTemplate = templates[params.templateMensagem || 'casual'];

    const confirmationData: BatchConfirmacaoReuniaoData = {
      data: dataAlvo,
      reunioes: reunioesFormatadas,
      totalReunioes: reunioesFormatadas.length,
      messageTemplate
    };

    return {
      confirmation: {
        id: `batch_confirmacao_${Date.now()}`,
        type: 'generic',
        status: 'pending',
        data: {
          title: 'Confirmação de Reuniões',
          description: `Confirmar ${reunioesFormatadas.length} reunião(ões) de ${new Date(dataAlvo).toLocaleDateString('pt-BR')}`,
          details: confirmationData as unknown as Record<string, unknown>
        },
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'confirmar_reunioes_amanha',
          parameters: { ...params, _confirmationData: confirmationData }
        },
        createdAt: new Date()
      }
    };
  }

  async executarConfirmacaoReunioes(data: BatchConfirmacaoReuniaoData): Promise<BatchActionResult> {
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    const zapiService = await getZAPIService(this.userId);
    const dataFormatada = new Date(data.data).toLocaleDateString('pt-BR');

    for (const reuniao of data.reunioes) {
      try {
        // Formatar mensagem
        const tipoTexto = reuniao.type === 'online' ? 'online (vou te enviar o link)' : 'presencial';
        const mensagem = data.messageTemplate
          .replace('{nome}', reuniao.contactName)
          .replace('{horario}', reuniao.time)
          .replace('{tipo}', tipoTexto)
          .replace('{data}', dataFormatada);

        // Tentar enviar via Z-API
        if (zapiService && reuniao.phone) {
          const phoneNumber = reuniao.phone.replace(/\D/g, '');
          await zapiService.sendText({
            phone: phoneNumber,
            message: mensagem
          });

          successCount++;
          results.push({
            clientId: reuniao.clientId,
            clientName: reuniao.clientName,
            success: true,
            details: { time: reuniao.time }
          });
        } else {
          failedCount++;
          results.push({
            clientId: reuniao.clientId,
            clientName: reuniao.clientName,
            success: false,
            error: 'WhatsApp não configurado ou telefone inválido'
          });
        }
      } catch (error) {
        failedCount++;
        results.push({
          clientId: reuniao.clientId,
          clientName: reuniao.clientName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return {
      success: successCount > 0,
      totalProcessed: data.reunioes.length,
      successCount,
      failedCount,
      results,
      summary: `Confirmação enviada para ${successCount} de ${data.reunioes.length} reuniões. ${failedCount > 0 ? `${failedCount} falha(s).` : ''}`
    };
  }

  // ==================== GERAR FATURAS DO MÊS ====================

  async prepararGeracaoFaturas(params: {
    mes?: string;
    diaVencimentoPadrao?: number;
    apenasClientesAtivos?: boolean;
  }): Promise<{ confirmation: ConfirmationData }> {
    const supabase = await createClient();
    const hoje = new Date();

    // Determinar mês
    const mes = params.mes || `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;
    const partesMes = mes.split('-').map(Number);
    const ano = partesMes[0] ?? hoje.getFullYear();
    const mesNum = partesMes[1] ?? (hoje.getMonth() + 1);
    const mesLabel = new Date(ano, mesNum - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    const diaVencimentoPadrao = params.diaVencimentoPadrao || 10;

    // Buscar clientes
    let query = supabase
      .from('clients')
      .select('id, name, monthly_value, due_day, status')
      .eq('user_id', this.userId);

    if (params.apenasClientesAtivos !== false) {
      query = query.eq('status', 'active');
    }

    const { data: clientes, error } = await query;

    if (error) {
      throw new Error(`Erro ao buscar clientes: ${error.message}`);
    }

    if (!clientes || clientes.length === 0) {
      throw new Error('Nenhum cliente encontrado para gerar faturas.');
    }

    // Verificar cobranças já existentes no mês
    const primeiroDia = `${mes}-01`;
    const ultimoDia = `${mes}-${new Date(ano, mesNum, 0).getDate()}`;

    const { data: cobrancasExistentes } = await supabase
      .from('payments')
      .select('client_id')
      .eq('user_id', this.userId)
      .gte('due_date', primeiroDia)
      .lte('due_date', ultimoDia);

    const clientesJaFaturados = new Set(cobrancasExistentes?.map(c => c.client_id) || []);

    // Formatar dados
    const clientesParaFaturar: GerarFaturasData['clientes'] = clientes
      .filter(c => c.monthly_value && Number(c.monthly_value) > 0)
      .map(c => {
        const diaVencimento = c.due_day || diaVencimentoPadrao;
        const vencimento = new Date(ano, mesNum - 1, diaVencimento);

        return {
          clientId: c.id,
          clientName: c.name,
          monthlyValue: Number(c.monthly_value),
          dueDay: diaVencimento,
          dueDate: toDateString(vencimento),
          jaExiste: clientesJaFaturados.has(c.id)
        };
      });

    const clientesNovos = clientesParaFaturar.filter(c => !c.jaExiste);
    const clientesJaFaturadosCount = clientesParaFaturar.filter(c => c.jaExiste).length;
    const totalFaturamento = clientesNovos.reduce((sum, c) => sum + c.monthlyValue, 0);

    if (clientesNovos.length === 0) {
      throw new Error('Todos os clientes já possuem cobrança para este mês.');
    }

    const confirmationData: GerarFaturasData = {
      mes,
      mesLabel,
      clientes: clientesParaFaturar,
      totalFaturamento,
      clientesNovos: clientesNovos.length,
      clientesJaFaturados: clientesJaFaturadosCount
    };

    return {
      confirmation: {
        id: `gerar_faturas_${Date.now()}`,
        type: 'generic',
        status: 'pending',
        data: {
          title: 'Gerar Faturas Mensais',
          description: `Criar ${clientesNovos.length} cobrança(s) para ${mesLabel}`,
          details: confirmationData as unknown as Record<string, unknown>
        },
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'gerar_faturas_mes',
          parameters: { ...params, _confirmationData: confirmationData }
        },
        createdAt: new Date()
      }
    };
  }

  async executarGeracaoFaturas(data: GerarFaturasData): Promise<BatchActionResult> {
    const supabase = await createClient();
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    const clientesNovos = data.clientes.filter(c => !c.jaExiste);

    for (const cliente of clientesNovos) {
      try {
        const { error } = await supabase.from('payments').insert({
          user_id: this.userId,
          client_id: cliente.clientId,
          amount: cliente.monthlyValue,
          due_date: cliente.dueDate,
          status: 'pending',
          description: `Serviço de gestão de tráfego - ${data.mesLabel}`
        });

        if (error) {
          throw new Error(error.message);
        }

        successCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: true,
          details: { amount: cliente.monthlyValue, dueDate: cliente.dueDate }
        });
      } catch (error) {
        failedCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return {
      success: successCount > 0,
      totalProcessed: clientesNovos.length,
      successCount,
      failedCount,
      results,
      summary: `${successCount} cobrança(s) criada(s) para ${data.mesLabel}. Total: R$ ${data.totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}. ${failedCount > 0 ? `${failedCount} falha(s).` : ''}`
    };
  }

  // ==================== ENVIAR FOLLOW-UP EM LOTE ====================

  async prepararFollowupLote(params: {
    diasMinimo?: number;
    diasMaximo?: number;
    limite?: number;
    templateMensagem?: 'checkup' | 'novidades' | 'valor';
  }): Promise<{ confirmation: ConfirmationData }> {
    const supabase = await createClient();
    const hoje = new Date();

    const diasMinimo = params.diasMinimo || 14;
    const diasMaximo = params.diasMaximo || 60;
    const limite = params.limite || 10;

    // Calcular datas
    const dataLimiteMax = new Date(hoje);
    dataLimiteMax.setDate(dataLimiteMax.getDate() - diasMinimo);

    const dataLimiteMin = new Date(hoje);
    dataLimiteMin.setDate(dataLimiteMin.getDate() - diasMaximo);

    // Buscar clientes sem contato recente
    const { data: clientes, error } = await supabase
      .from('clients')
      .select('id, name, contact_name, contact_phone, last_contact, last_contact_type')
      .eq('user_id', this.userId)
      .eq('status', 'active')
      .or(`last_contact.is.null,last_contact.lt.${toDateString(dataLimiteMax)}`)
      .limit(limite);

    if (error) {
      throw new Error(`Erro ao buscar clientes: ${error.message}`);
    }

    if (!clientes || clientes.length === 0) {
      throw new Error(`Nenhum cliente encontrado sem contato há mais de ${diasMinimo} dias.`);
    }

    // Formatar dados
    const clientesFormatados: BatchFollowupData['clientes'] = clientes
      .filter(c => c.contact_phone)
      .map(c => {
        const diasSemContato = c.last_contact
          ? Math.floor((hoje.getTime() - new Date(c.last_contact).getTime()) / (1000 * 60 * 60 * 24))
          : 999;

        return {
          clientId: c.id,
          clientName: c.name,
          contactName: c.contact_name || c.name,
          phone: c.contact_phone || '',
          diasSemContato,
          ultimoContato: c.last_contact || 'Nunca',
          ultimoContatoTipo: c.last_contact_type || 'Desconhecido'
        };
      })
      .filter(c => {
        if (params.diasMaximo) {
          return c.diasSemContato >= diasMinimo && c.diasSemContato <= diasMaximo;
        }
        return c.diasSemContato >= diasMinimo;
      });

    if (clientesFormatados.length === 0) {
      throw new Error('Nenhum cliente com telefone cadastrado encontrado nos critérios especificados.');
    }

    // Template de mensagem
    const templates = {
      checkup: 'Oi {nome}! Tudo bem por aí? 😊\n\nFaz um tempinho que não nos falamos e queria saber como estão as coisas com as campanhas.\n\nTem alguma demanda ou ajuste que gostaria de fazer?\n\nEstou à disposição!',
      novidades: 'Olá {nome}! Passando pra dar um alô! 👋\n\nTemos algumas novidades que podem ser interessantes pro seu negócio. Quer que eu te conte?\n\nAbraço!',
      valor: 'Oi {nome}! Tudo bem?\n\nEstava analisando sua conta e identifiquei algumas oportunidades de melhoria nas campanhas.\n\nPodemos marcar uma call rápida pra eu te mostrar?\n\nAbraço!'
    };

    const messageTemplate = templates[params.templateMensagem || 'checkup'];

    const confirmationData: BatchFollowupData = {
      clientes: clientesFormatados,
      totalClientes: clientesFormatados.length,
      diasMinimo,
      messageTemplate
    };

    return {
      confirmation: {
        id: `batch_followup_${Date.now()}`,
        type: 'generic',
        status: 'pending',
        data: {
          title: 'Follow-up em Lote',
          description: `Enviar follow-up para ${clientesFormatados.length} cliente(s) sem contato recente`,
          details: confirmationData as unknown as Record<string, unknown>
        },
        toolToExecute: {
          id: `tool_${Date.now()}`,
          name: 'enviar_followup_lote',
          parameters: { ...params, _confirmationData: confirmationData }
        },
        createdAt: new Date()
      }
    };
  }

  async executarFollowupLote(data: BatchFollowupData): Promise<BatchActionResult> {
    const supabase = await createClient();
    const results: BatchActionResult['results'] = [];
    let successCount = 0;
    let failedCount = 0;

    const zapiService = await getZAPIService(this.userId);
    const hoje = toDateString(new Date());

    for (const cliente of data.clientes) {
      try {
        // Formatar mensagem
        const mensagem = data.messageTemplate.replace('{nome}', cliente.contactName);

        // Tentar enviar via Z-API
        if (zapiService && cliente.phone) {
          const phoneNumber = cliente.phone.replace(/\D/g, '');
          await zapiService.sendText({
            phone: phoneNumber,
            message: mensagem
          });

          // Atualizar último contato
          await supabase
            .from('clients')
            .update({
              last_contact: hoje,
              last_contact_type: 'whatsapp'
            })
            .eq('id', cliente.clientId);

          successCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: true,
            details: { diasSemContato: cliente.diasSemContato }
          });
        } else {
          failedCount++;
          results.push({
            clientId: cliente.clientId,
            clientName: cliente.clientName,
            success: false,
            error: 'WhatsApp não configurado ou telefone inválido'
          });
        }
      } catch (error) {
        failedCount++;
        results.push({
          clientId: cliente.clientId,
          clientName: cliente.clientName,
          success: false,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        });
      }
    }

    return {
      success: successCount > 0,
      totalProcessed: data.clientes.length,
      successCount,
      failedCount,
      results,
      summary: `Follow-up enviado para ${successCount} de ${data.clientes.length} clientes. ${failedCount > 0 ? `${failedCount} falha(s).` : ''}`
    };
  }
}

export default BatchActionsExecutor;
