const { Resend } = require("resend");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUIRED_FIELDS = ["fecha", "hora", "nombre", "telefono"];
const FIELD_LIMITS = {
  fecha: 20,
  hora: 20,
  nombre: 120,
  telefono: 40,
  correo: 254,
  motivo: 1500,
};

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function normalizeValue(value, limit = 500) {
  if (value === null || value === undefined) {
    return "";
  }

  const normalized = Array.isArray(value) ? value.join(", ") : String(value);
  return normalized.replace(/\0/g, "").trim().slice(0, limit);
}

function sanitizePayload(data) {
  return Object.fromEntries(
    Object.entries(FIELD_LIMITS).map(([field, limit]) => [
      field,
      normalizeValue(data[field], limit),
    ])
  );
}

function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];

  if (typeof forwardedFor === "string" && forwardedFor.trim()) {
    return forwardedFor.split(",")[0].trim();
  }

  return req.socket?.remoteAddress || "";
}

function getFieldLabel(key) {
  const labels = {
    fecha: "Fecha solicitada",
    hora: "Hora solicitada",
    nombre: "Nombre",
    telefono: "Telefono",
    correo: "Correo",
    motivo: "Motivo de consulta",
  };

  return labels[key] || key;
}

function buildEmailContent(data, metadata) {
  const entries = Object.entries(data).map(([key, value]) => [
    getFieldLabel(key),
    value,
  ]);
  const note =
    "Origen de la solicitud: formulario web de agenda. Por favor comuniquense directamente con el paciente usando los datos proporcionados.";
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
    text: `Solicitud de cita recibida desde el sitio web.\n\n${note}\n\nDatos enviados:\n${textRows}\n\nRegistro interno:\nFecha de recepcion: ${metadata.receivedAt}\nIdentificador: ${metadata.requestId}`,
    html: `
      <div style="font-family:Arial,sans-serif;color:#1f2937;line-height:1.5;">
        <h1 style="font-size:20px;margin:0 0 16px;">Solicitud de cita recibida desde el sitio web</h1>
        <p>${escapeHtml(note)}</p>
        <h2 style="font-size:18px;margin:24px 0 12px;">Datos enviados</h2>
        <table cellpadding="0" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:640px;">
          <tbody>${htmlRows}</tbody>
        </table>
        <h2 style="font-size:18px;margin:24px 0 12px;">Registro interno</h2>
        <p style="margin:0;">Fecha de recepcion: ${escapeHtml(metadata.receivedAt)}</p>
        <p style="margin:0;">Identificador: ${escapeHtml(metadata.requestId)}</p>
        ${metadata.ip ? `<p style="margin:0;">IP de origen: ${escapeHtml(metadata.ip)}</p>` : ""}
      </div>`,
  };
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Metodo no permitido." });
  }

  const { RESEND_API_KEY, MAIL_FROM_NAME, MAIL_FROM, MAIL_TO } = process.env;
  const recipients = normalizeValue(MAIL_TO, 1000)
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  if (
    !RESEND_API_KEY ||
    !MAIL_FROM_NAME ||
    !EMAIL_REGEX.test(normalizeValue(MAIL_FROM, 254)) ||
    recipients.length === 0 ||
    recipients.some((email) => !EMAIL_REGEX.test(email))
  ) {
    console.error("Configuracion de Resend incompleta o invalida.");
    return res.status(500).json({ error: "El servicio de correo no esta disponible." });
  }

  let requestData = req.body;

  if (typeof requestData === "string") {
    try {
      requestData = JSON.parse(requestData);
    } catch (error) {
      return res.status(400).json({ error: "El cuerpo debe ser JSON valido." });
    }
  }

  if (!requestData || typeof requestData !== "object" || Array.isArray(requestData)) {
    return res.status(400).json({ error: "El cuerpo debe ser JSON valido." });
  }

  const data = sanitizePayload(requestData);
  const missingFields = REQUIRED_FIELDS.filter((field) => !data[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      error: "Faltan campos requeridos.",
      fields: missingFields,
    });
  }

  if (data.correo && !EMAIL_REGEX.test(data.correo)) {
    return res.status(400).json({ error: "El correo ingresado no es valido." });
  }

  const metadata = {
    receivedAt: new Date().toLocaleString("es-EC", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Guayaquil",
    }),
    requestId: `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
    ip: normalizeValue(getClientIp(req), 100),
  };
  const content = buildEmailContent(data, metadata);
  const subject = [
    `${MAIL_FROM_NAME} - Solicitud de cita`,
    data.nombre,
    data.fecha,
    data.hora,
  ].join(" - ");

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: `${MAIL_FROM_NAME} <${MAIL_FROM}>`,
      to: recipients,
      replyTo: data.correo || undefined,
      subject,
      text: content.text,
      html: content.html,
      headers: {
        "X-Entity-Ref-ID": metadata.requestId,
      },
    });

    if (error) {
      throw error;
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error("Error enviando correo con Resend:", error);
    return res.status(500).json({ error: "No se pudo enviar la solicitud." });
  }
};
