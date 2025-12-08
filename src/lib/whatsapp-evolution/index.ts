/**
 * @file index.ts
 * @description Exportações do módulo WhatsApp Evolution
 * @module lib/whatsapp-evolution
 */

export {
  criarInstanciaWhatsApp,
  obterQRCode,
  verificarStatus,
  estaConectado,
  enviarMensagem,
  desconectarWhatsApp,
  deletarInstancia,
  listarInstancias,
  formatarNumero,
  enviarMensagemParaLead,
  gerarNomeInstancia,
  mapDbInstanciaToTs,
  mapDbMensagemToTs,
} from './service';
