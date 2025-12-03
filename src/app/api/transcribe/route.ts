/**
 * @file route.ts
 * @description API route para transcrição de áudio usando OpenAI Whisper
 * @module api/transcribe
 */

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

/**
 * Tamanho máximo do arquivo de áudio (25MB - limite do Whisper)
 */
const MAX_FILE_SIZE = 25 * 1024 * 1024;

/**
 * Formatos de áudio suportados pelo Whisper
 */
const SUPPORTED_FORMATS = [
  'audio/webm',
  'audio/mp3',
  'audio/mpeg',
  'audio/wav',
  'audio/m4a',
  'audio/ogg',
  'audio/flac',
];

/**
 * POST /api/transcribe
 * Transcreve arquivo de áudio para texto usando OpenAI Whisper
 *
 * @body FormData com campo 'audio' contendo o arquivo
 * @returns { text: string, duration: number, language: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Verificar se OpenAI está configurada
    const openaiKey = process.env.OPENAI_API_KEY;
    if (!openaiKey) {
      return NextResponse.json(
        { error: 'Serviço de transcrição não configurado. Contate o administrador.' },
        { status: 503 }
      );
    }

    // Obter arquivo do FormData
    const formData = await request.formData();
    const audioFile = formData.get('audio');

    if (!audioFile || !(audioFile instanceof File)) {
      return NextResponse.json(
        { error: 'Arquivo de áudio é obrigatório' },
        { status: 400 }
      );
    }

    // Validar tamanho
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo: 25MB' },
        { status: 400 }
      );
    }

    // Validar formato
    if (!SUPPORTED_FORMATS.some(format => {
      const subtype = format.split('/')[1];
      return subtype && audioFile.type.includes(subtype);
    })) {
      return NextResponse.json(
        { error: 'Formato de áudio não suportado. Use MP3, WAV, WebM, M4A, OGG ou FLAC.' },
        { status: 400 }
      );
    }

    // Preparar FormData para OpenAI
    const openaiFormData = new FormData();
    openaiFormData.append('file', audioFile);
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'pt'); // Português brasileiro
    openaiFormData.append('response_format', 'verbose_json');

    // Chamar API do Whisper
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: openaiFormData,
    });

    if (!whisperResponse.ok) {
      const errorData = await whisperResponse.json().catch(() => ({}));
      console.error('[API] POST /api/transcribe Whisper error:', errorData);

      if (whisperResponse.status === 401) {
        return NextResponse.json(
          { error: 'Chave de API inválida para transcrição.' },
          { status: 503 }
        );
      }

      if (whisperResponse.status === 429) {
        return NextResponse.json(
          { error: 'Limite de requisições excedido. Tente novamente em alguns minutos.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao transcrever áudio. Tente novamente.' },
        { status: 500 }
      );
    }

    const whisperData = await whisperResponse.json();

    // Validar resposta
    if (!whisperData.text) {
      return NextResponse.json(
        { error: 'Não foi possível transcrever o áudio. Tente falar mais claramente.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      text: whisperData.text,
      duration: whisperData.duration || 0,
      language: whisperData.language || 'pt',
    });
  } catch (error) {
    console.error('[API] POST /api/transcribe unexpected error:', error);

    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
