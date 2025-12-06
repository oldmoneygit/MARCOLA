/**
 * @file FormattedContent.tsx
 * @description Componente para renderizar conteúdo formatado com estilos bonitos
 * @module components/assistant
 */

'use client';

import { useMemo } from 'react';
import { User, DollarSign, Calendar, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormattedContentProps {
  content: string;
  className?: string;
}

/**
 * Componente para texto em negrito estilizado
 */
function BoldText({ children }: { children: string }) {
  return (
    <span className="font-semibold text-white">
      {children}
    </span>
  );
}

/**
 * Componente para valores monetários
 */
function CurrencyValue({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#7ED4A6]/10 text-[#7ED4A6] font-medium">
      <DollarSign className="w-3 h-3" />
      {value.replace('R$', '').trim()}
    </span>
  );
}

/**
 * Componente para datas
 */
function DateValue({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#BDCDCF]/10 text-[#BDCDCF] font-medium text-sm">
      <Calendar className="w-3 h-3" />
      {value}
    </span>
  );
}

/**
 * Componente para horários
 */
function TimeValue({ value }: { value: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#8FAAAD]/10 text-[#8FAAAD] font-medium text-sm">
      <Clock className="w-3 h-3" />
      {value}
    </span>
  );
}

/**
 * Componente para nomes de clientes (detectados por negrito ou contexto)
 */
function ClientName({ name }: { name: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-gradient-to-r from-[#BDCDCF]/15 to-[#8FAAAD]/10 border border-[#BDCDCF]/20">
      <span className="w-5 h-5 rounded-md bg-gradient-to-br from-[#BDCDCF] to-[#8FAAAD] flex items-center justify-center">
        <User className="w-3 h-3 text-[#0a0a0f]" />
      </span>
      <span className="font-medium text-[#BDCDCF]">{name}</span>
    </span>
  );
}

/**
 * Componente para itens de lista
 */
function ListNumber({ number }: { number: string }) {
  return (
    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#BDCDCF]/10 text-[#BDCDCF] font-semibold text-sm mr-2">
      {number}
    </span>
  );
}

/**
 * Verifica se um texto em negrito é provavelmente um nome de cliente
 */
function isLikelyClientName(text: string, context: string): boolean {
  // Heurísticas para detectar nomes de clientes
  const clientIndicators = [
    'cliente',
    'pagamento',
    'pendente',
    'atrasado',
    'vencido',
    'vence',
    'R$',
    'mensalidade',
  ];

  // Se o contexto contém indicadores de cliente e o texto parece um nome
  const hasIndicator = clientIndicators.some(indicator =>
    context.toLowerCase().includes(indicator.toLowerCase())
  );

  // Nomes geralmente começam com maiúscula e têm mais de uma palavra ou são nomes de empresas
  const looksLikeName = /^[A-ZÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]/.test(text) && text.length > 2;

  return hasIndicator && looksLikeName;
}

/**
 * Processa e formata o conteúdo da mensagem
 */
function processContent(content: string): React.ReactNode[] {
  // Limpar HTML comments
  const cleanContent = content.replace(/<!--[\s\S]*?-->/g, '').trim();

  // Dividir por linhas para processar listas
  const lines = cleanContent.split('\n');
  const result: React.ReactNode[] = [];

  lines.forEach((line, lineIndex) => {
    if (lineIndex > 0) {
      result.push(<br key={`br-${lineIndex}`} />);
    }

    // Verificar se é um item de lista
    const listMatch = line.match(/^(\d+)\.\s+/);
    let processedLine = line;
    let listNumber: string | null = null;

    if (listMatch && listMatch[1]) {
      listNumber = listMatch[1];
      processedLine = line.replace(/^\d+\.\s+/, '');
    }

    // Processar o conteúdo da linha
    const parts = processLine(processedLine, cleanContent);

    if (listNumber) {
      result.push(
        <span key={`list-${lineIndex}`} className="flex items-start gap-1 mt-2 first:mt-0">
          <ListNumber number={listNumber} />
          <span className="flex-1 flex flex-wrap items-center gap-1">{parts}</span>
        </span>
      );
    } else {
      result.push(
        <span key={`line-${lineIndex}`} className="inline">
          {parts}
        </span>
      );
    }
  });

  return result;
}

/**
 * Processa uma linha individual
 */
function processLine(line: string, fullContext: string): React.ReactNode[] {
  const result: React.ReactNode[] = [];
  let lastIndex = 0;

  // Encontrar todos os matches de padrões especiais
  interface Match {
    type: 'bold' | 'currency' | 'date' | 'time';
    start: number;
    end: number;
    value: string;
    captured?: string;
  }

  const matches: Match[] = [];

  // Encontrar negritos
  let match: RegExpExecArray | null;
  const boldRegex = /\*\*(.+?)\*\*/g;
  while ((match = boldRegex.exec(line)) !== null) {
    matches.push({
      type: 'bold',
      start: match.index,
      end: match.index + match[0].length,
      value: match[0],
      captured: match[1],
    });
  }

  // Encontrar valores monetários
  const currencyRegex = /R\$\s?[\d.,]+/g;
  while ((match = currencyRegex.exec(line)) !== null) {
    const matchIndex = match.index;
    // Verificar se não está dentro de um negrito
    const isInsideBold = matches.some(
      m => m.type === 'bold' && matchIndex >= m.start && matchIndex < m.end
    );
    if (!isInsideBold) {
      matches.push({
        type: 'currency',
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
      });
    }
  }

  // Encontrar datas
  const dateRegex = /\b\d{1,2}\/\d{1,2}(?:\/\d{2,4})?\b/g;
  while ((match = dateRegex.exec(line)) !== null) {
    const matchIndex = match.index;
    const isInsideOther = matches.some(
      m => matchIndex >= m.start && matchIndex < m.end
    );
    if (!isInsideOther) {
      matches.push({
        type: 'date',
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
      });
    }
  }

  // Encontrar horários
  const timeRegex = /\b\d{1,2}[h:]\d{2}\b/g;
  while ((match = timeRegex.exec(line)) !== null) {
    const matchIndex = match.index;
    const isInsideOther = matches.some(
      m => matchIndex >= m.start && matchIndex < m.end
    );
    if (!isInsideOther) {
      matches.push({
        type: 'time',
        start: match.index,
        end: match.index + match[0].length,
        value: match[0],
      });
    }
  }

  // Ordenar matches por posição
  matches.sort((a, b) => a.start - b.start);

  // Construir resultado
  matches.forEach((m, idx) => {
    // Adicionar texto antes do match
    if (m.start > lastIndex) {
      result.push(
        <span key={`text-${idx}-pre`}>
          {line.slice(lastIndex, m.start)}
        </span>
      );
    }

    // Adicionar o elemento formatado
    switch (m.type) {
      case 'bold':
        if (m.captured && isLikelyClientName(m.captured, fullContext)) {
          result.push(<ClientName key={`client-${idx}`} name={m.captured} />);
        } else if (m.captured) {
          result.push(<BoldText key={`bold-${idx}`}>{m.captured}</BoldText>);
        }
        break;
      case 'currency':
        result.push(<CurrencyValue key={`currency-${idx}`} value={m.value} />);
        break;
      case 'date':
        result.push(<DateValue key={`date-${idx}`} value={m.value} />);
        break;
      case 'time':
        result.push(<TimeValue key={`time-${idx}`} value={m.value} />);
        break;
    }

    lastIndex = m.end;
  });

  // Adicionar texto restante
  if (lastIndex < line.length) {
    result.push(
      <span key="text-end">
        {line.slice(lastIndex)}
      </span>
    );
  }

  return result.length > 0 ? result : [<span key="empty">{line}</span>];
}

/**
 * Componente principal para renderizar conteúdo formatado
 */
export function FormattedContent({ content, className }: FormattedContentProps) {
  const formattedContent = useMemo(() => processContent(content), [content]);

  return (
    <div className={cn('text-[15px] leading-relaxed', className)}>
      {formattedContent}
    </div>
  );
}
