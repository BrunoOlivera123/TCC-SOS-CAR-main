// =================================================================
// Envio de e-mail para recuperação de senha
// Gmail + Nodemailer
// =================================================================

const nodemailer = require('nodemailer');

// Escapa caracteres especiais para evitar problemas no HTML
function escaparHtml(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));
}

// Verifica se o SMTP está configurado
function smtpConfigurado() {
  return Boolean(
    process.env.SMTP_USER &&
    process.env.SMTP_PASS
  );
}

// Transportador do Gmail
let transportador;

function obterTransportador() {
  if (!transportador) {
    transportador = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return transportador;
}

// Envia o e-mail de redefinição de senha
async function enviarEmailRedefinicao({
  paraEmail,
  nome,
  tipo,
  token,
  appUrl
}) {

  const baseUrl = appUrl ||
                  process.env.APP_URL ||
                  'http://localhost:3000';

  const link =
  `${baseUrl}/?tipo=${encodeURIComponent(tipo)}&token=${encodeURIComponent(token)}&redefinir=1`;

  // Caso o Gmail não esteja configurado
  if (!smtpConfigurado()) {

    console.warn(
      `[e-mail] SMTP não configurado.\n` +
      `Link de redefinição para ${paraEmail}:\n` +
      `${link}`
    );

    return {
      link,
      smtpConfigurado: false
    };
  }

  try {

    await obterTransportador().sendMail({

      from: process.env.SMTP_FROM || process.env.SMTP_USER,

      to: paraEmail,

      subject: 'SOS Car — Redefinição de senha',

      text:
        `Olá, ${nome}!\n\n` +
        `Recebemos um pedido para redefinir sua senha no SOS Car.\n\n` +
        `Acesse o link abaixo para escolher uma nova senha ` +
        `(válido por 1 hora):\n\n` +
        `${link}\n\n` +
        `Se você não pediu isso, apenas ignore este e-mail.`,

      html:
        `<p>Olá, ${escaparHtml(nome)}!</p>` +

        `<p>` +
        `Recebemos um pedido para redefinir sua senha no SOS Car.` +
        `</p>` +

        `<p>` +
        `Clique no botão abaixo para escolher uma nova senha ` +
        `(válido por 1 hora):` +
        `</p>` +

        `<p>` +
        `<a href="${escaparHtml(link)}" target="_self" ` +
        `style="display:inline-block;` +
        `padding:12px 20px;` +
        `background:#2563eb;` +
        `color:white;` +
        `text-decoration:none;` +
        `border-radius:8px;">` +
        `Redefinir minha senha` +
        `</a>` +
        `</p>` +

        `<p>` +
        `Se você não solicitou a redefinição, apenas ignore este e-mail.` +
        `</p>`
    });

    console.log(
      `[e-mail] E-mail de redefinição enviado para ${paraEmail}`
    );

    return {
      link,
      smtpConfigurado: true
    };

  } catch (erro) {

    console.warn(
      `[e-mail] Falha ao enviar para ${paraEmail}.`,
      erro.message
    );

    console.warn(
      `[e-mail] Link de redefinição (válido por 1 hora):\n${link}`
    );

    return {
      link,
      smtpConfigurado: false
    };
  }
}

module.exports = {
  enviarEmailRedefinicao
};