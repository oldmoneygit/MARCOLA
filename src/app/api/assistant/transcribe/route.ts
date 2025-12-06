/**
 * @file route.ts
 * @description API de transcrição de áudio usando OpenAI Whisper
 * @module app/api/assistant/transcribe
 */

import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { createClient } from '@/lib/supabase/server';

// Modelo Whisper (único disponível atualmente)
const WHISPER_MODEL = 'whisper-1';

// Tamanho máximo do arquivo: 25MB (limite do Whisper)
const MAX_FILE_SIZE = 25 * 1024 * 1024;

// Cliente OpenAI (lazy initialization)
let openaiClient: OpenAI | null = null;

/**
 * Obtém o cliente OpenAI
 */
function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY não configurada');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

/**
 * POST /api/assistant/transcribe
 * Transcreve um arquivo de áudio para texto
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação
    const supabase = createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Não autorizado' },
        { status: 401 }
      );
    }

    // Obter arquivo de áudio do form data
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'Arquivo de áudio não fornecido' },
        { status: 400 }
      );
    }

    // Validar tamanho do arquivo
    if (audioFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo: 25MB' },
        { status: 400 }
      );
    }

    // Validar tipo do arquivo (aceitar formatos comuns de áudio)
    const validTypes = [
      'audio/webm',
      'audio/mp3',
      'audio/mpeg',
      'audio/mp4',
      'audio/m4a',
      'audio/wav',
      'audio/ogg',
      'audio/flac'
    ];

    // Whisper aceita vários formatos, vamos ser mais permissivos
    const isValidType = validTypes.some((type) => audioFile.type.includes(type.split('/')[1] || ''));

    if (!isValidType && audioFile.type !== '') {
      console.error('[transcribe] Tipo de arquivo inválido:', audioFile.type);
      // Continuar mesmo assim, pois alguns browsers reportam tipos incorretamente
    }

    // Verificar se o arquivo tem conteúdo
    if (audioFile.size < 100) {
      return NextResponse.json(
        { success: false, error: 'Arquivo de áudio muito curto ou vazio' },
        { status: 400 }
      );
    }

    // Transcrever com Whisper
    const openai = getOpenAIClient();

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: WHISPER_MODEL,
      language: 'pt', // Português brasileiro
      response_format: 'json'
    });

    // Verificar se obteve texto
    if (!transcription.text || transcription.text.trim() === '') {
      return NextResponse.json({
        success: true,
        text: '',
        message: 'Nenhum áudio detectado ou áudio muito curto'
      });
    }

    return NextResponse.json({
      success: true,
      text: transcription.text.trim()
    });

  } catch (error) {
    console.error('[transcribe] Erro na transcrição:', error);

    // Tratar erros específicos da OpenAI
    if (error instanceof OpenAI.APIError) {
      if (error.status === 401) {
        return NextResponse.json(
          { success: false, error: 'API key do OpenAI inválida' },
          { status: 500 }
        );
      }
      if (error.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Limite de requisições excedido. Tente novamente em alguns segundos.' },
          { status: 429 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Erro ao transcrever áudio. Tente novamente.'
      },
      { status: 500 }
    );
  }
}
