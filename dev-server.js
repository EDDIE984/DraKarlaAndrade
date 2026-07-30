const fs = require("fs");
const http = require("http");
const path = require("path");
const enviar = require("./api/enviar");

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 3000;
const MAX_BODY_SIZE = 1_000_000;
const MIME_TYPES = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".otf": "font/otf",
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ttf": "font/ttf",
  ".webp": "image/webp",
};

function loadEnvFile(filename) {
  const envPath = path.join(ROOT, filename);

  if (!fs.existsSync(envPath)) return;

  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;

    const separator = trimmed.indexOf("=");
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed
      .slice(separator + 1)
      .trim()
      .replace(/^(['"])(.*)\1$/, "$2");

    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

function addResponseHelpers(res) {
  res.status = (statusCode) => {
    res.statusCode = statusCode;
    return res;
  };
  res.json = (data) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(data));
  };
}

async function handleApi(req, res) {
  addResponseHelpers(res);

  if (req.method !== "POST") {
    return enviar(req, res);
  }

  let body = "";

  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      return res.status(413).json({ error: "La solicitud es demasiado grande." });
    }
  }

  try {
    req.body = body ? JSON.parse(body) : {};
  } catch {
    return res.status(400).json({ error: "El cuerpo debe ser JSON valido." });
  }

  return enviar(req, res);
}

function serveStatic(req, res) {
  const requestPath = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  const relativePath = requestPath === "/" ? "index.html" : requestPath.replace(/^\/+/, "");
  const filePath = path.resolve(ROOT, relativePath);

  if (!filePath.startsWith(`${ROOT}${path.sep}`) || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    res.end("No encontrado");
    return;
  }

  res.setHeader("Content-Type", MIME_TYPES[path.extname(filePath).toLowerCase()] || "application/octet-stream");
  res.statusCode = 200;

  if (req.method === "HEAD") {
    res.end();
    return;
  }

  fs.createReadStream(filePath).pipe(res);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url === "/api/enviar" || req.url.startsWith("/api/enviar?")) {
      await handleApi(req, res);
      return;
    }

    if (!["GET", "HEAD"].includes(req.method)) {
      res.statusCode = 405;
      res.end("Metodo no permitido");
      return;
    }

    serveStatic(req, res);
  } catch (error) {
    console.error("Error en el servidor local:", error);
    if (!res.headersSent) res.statusCode = 500;
    if (!res.writableEnded) res.end("Error interno del servidor");
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Sitio disponible en http://localhost:${PORT}`);
});
