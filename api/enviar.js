const nodemailer = require("nodemailer");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS = ["fecha", "hora", "nombre", "telefono"];

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeValue).join(", ");
  }

  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value).trim();
}

function getEmailField(data) {
  return normalizeValue(data.email || data.correo || data.mail);
}

function buildEmailContent(data) {
  const entries = Object.entries(data).map(([key, value]) => [
    key,
    normalizeValue(value),
  ]);

  const note =
    "Este correo fue generado desde el formulario web. Por favor comuniquense directamente con el paciente/cliente usando los datos proporcionados.";

  const textRows = entries
    .map(([key, value]) => `${key}: ${value || "(sin valor)"}`)
    .join("\n");

  const htmlRows = entries
    .map(
      ([key, value]) => `
        <tr>
          <th align="left" style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(key)}</th>
          <td style="padding:8px;border-bottom:1px solid #e5e7eb;">${escapeHtml(value || "(sin valor)")}</td>
        </tr>`
    )
    .join("");

  return {
    text: `${note}\n\nDatos enviados:\n${textRows}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5;">
        <p><strong>${escapeHtml(note)}</strong></p>
        <h2 style="font-size:18px;margin:24px 0 12px;">Datos enviados</h2>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;">
          <tbody>${htmlRows}</tbody>
        </table>
      </div>`,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    MAIL_TO,
    MAIL_FROM_NAME,
  } = process.env;

  const missingConfig = [
    ["SMTP_HOST", SMTP_HOST],
    ["SMTP_PORT", SMTP_PORT],
    ["SMTP_USER", SMTP_USER],
    ["SMTP_PASS", SMTP_PASS],
    ["MAIL_TO", MAIL_TO],
    ["MAIL_FROM_NAME", MAIL_FROM_NAME],
  ].filter(([, value]) => !value);

  if (missingConfig.length > 0) {
    return res.status(500).json({
      error: "Configuracion de correo incompleta.",
      missing: missingConfig.map(([key]) => key),
    });
  }

  let data = req.body;

  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch (error) {
      return res.status(400).json({ error: "El cuerpo debe ser JSON valido." });
    }
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return res.status(400).json({ error: "El cuerpo debe ser JSON valido." });
  }

  const missingFields = REQUIRED_FIELDS.filter((field) => !normalizeValue(data[field]));

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Faltan campos requeridos.",
      fields: missingFields,
    });
  }

  const replyTo = getEmailField(data);

  if (replyTo && !EMAIL_REGEX.test(replyTo)) {
    return res.status(400).json({ error: "El correo ingresado no es valido." });
  }

  if (!EMAIL_REGEX.test(MAIL_TO)) {
    return res.status(500).json({ error: "MAIL_TO no tiene un formato valido." });
  }

  if (!EMAIL_REGEX.test(SMTP_USER)) {
    return res.status(500).json({ error: "SMTP_USER no tiene un formato valido." });
  }

  const port = Number(SMTP_PORT);

  if (!Number.isInteger(port) || port <= 0) {
    return res.status(500).json({ error: "SMTP_PORT no tiene un valor valido." });
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  const content = buildEmailContent(data);

  try {
    await transporter.sendMail({
      from: {
        name: MAIL_FROM_NAME,
        address: SMTP_USER,
      },
      to: MAIL_TO,
      replyTo: replyTo || undefined,
      subject: `Nuevo mensaje desde el formulario web - ${MAIL_FROM_NAME}`,
      text: content.text,
      html: content.html,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error enviando correo:", error);
    return res.status(500).json({ error: "No se pudo enviar el correo." });
  }
};
