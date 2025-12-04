/**
 * @file email.ts
 * @description Serviço de envio de emails usando Resend
 * @module lib
 */

import { Resend } from 'resend';

import { APP_NAME } from './constants';

interface SendInviteEmailParams {
  to: string;
  memberName: string;
  ownerName?: string;
  role: string;
  inviteLink: string;
}

/**
 * Envia email de convite para membro da equipe
 */
export async function sendInviteEmail({
  to,
  memberName,
  ownerName,
  role,
  inviteLink,
}: SendInviteEmailParams): Promise<{ success: boolean; error?: string }> {
  // Verifica se a API key está configurada
  if (!process.env.RESEND_API_KEY) {
    console.error('[Email] RESEND_API_KEY não configurada - email não enviado');
    return { success: false, error: 'Email não configurado. Configure RESEND_API_KEY no .env.local' };
  }

  // Inicializa o cliente Resend apenas quando necessário
  const resend = new Resend(process.env.RESEND_API_KEY);

  // Email de envio (use seu domínio verificado ou onboarding@resend.dev para testes)
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

  const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    member: 'Membro',
    viewer: 'Visualizador',
  };

  const roleLabel = roleLabels[role] || role;

  try {
    const { error } = await resend.emails.send({
      from: `${APP_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject: `Convite para participar da equipe no ${APP_NAME}`,
      html: generateInviteEmailHTML({
        memberName,
        ownerName,
        roleLabel,
        inviteLink,
      }),
    });

    if (error) {
      console.error('[Email] Erro ao enviar:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro desconhecido';
    console.error('[Email] Erro inesperado:', err);
    return { success: false, error: message };
  }
}

interface GenerateEmailParams {
  memberName: string;
  ownerName?: string;
  roleLabel: string;
  inviteLink: string;
}

/**
 * Gera o HTML do email de convite
 */
function generateInviteEmailHTML({
  memberName,
  ownerName,
  roleLabel,
  inviteLink,
}: GenerateEmailParams): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite para ${APP_NAME}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0f;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" style="width: 100%; max-width: 600px; border-collapse: collapse;">

          <!-- Logo/Header -->
          <tr>
            <td align="center" style="padding-bottom: 30px;">
              <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #8b5cf6, #6366f1); border-radius: 16px; display: inline-flex; align-items: center; justify-content: center;">
                <span style="color: white; font-size: 24px; font-weight: bold;">M</span>
              </div>
              <h1 style="margin: 16px 0 0 0; color: #ffffff; font-size: 24px; font-weight: 700;">${APP_NAME}</h1>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 40px;">
              <h2 style="margin: 0 0 16px 0; color: #ffffff; font-size: 20px; font-weight: 600;">
                Olá, ${memberName}!
              </h2>

              <p style="margin: 0 0 24px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                ${ownerName ? `<strong style="color: #ffffff;">${ownerName}</strong> convidou você` : 'Você foi convidado(a)'} para fazer parte da equipe no <strong style="color: #8b5cf6;">${APP_NAME}</strong> como <strong style="color: #ffffff;">${roleLabel}</strong>.
              </p>

              <p style="margin: 0 0 32px 0; color: #a1a1aa; font-size: 16px; line-height: 1.6;">
                Clique no botão abaixo para criar sua conta e começar a usar a plataforma:
              </p>

              <!-- CTA Button -->
              <table role="presentation" style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td align="center">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 600; border-radius: 12px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                      Aceitar Convite
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 32px 0 0 0; color: #71717a; font-size: 14px; line-height: 1.6;">
                Ou copie e cole este link no seu navegador:<br>
                <a href="${inviteLink}" style="color: #8b5cf6; word-break: break-all;">${inviteLink}</a>
              </p>

              <hr style="margin: 32px 0; border: none; border-top: 1px solid rgba(255, 255, 255, 0.08);">

              <p style="margin: 0; color: #71717a; font-size: 13px; line-height: 1.5;">
                <strong style="color: #a1a1aa;">Importante:</strong> Este convite expira em 7 dias. Se você não solicitou este convite, pode ignorar este email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding-top: 30px;">
              <p style="margin: 0; color: #52525b; font-size: 12px;">
                © ${new Date().getFullYear()} ${APP_NAME}. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
