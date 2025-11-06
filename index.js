const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

// Sirve archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Buscar en la base de conocimiento
function searchKB(level, query) {
  const kbPath = path.join(__dirname, "data", "knowledge.json");
  let KB = [];
  try { KB = JSON.parse(fs.readFileSync(kbPath, "utf8")); } catch (err) { return null; }
  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[áéíóúüñ]/g, x =>
    ({á:'a',é:'e',í:'i',ó:'o',ú:'u',ü:'u',ñ:'n'})[x] || x);
  const q = norm(query || "");
  const items = KB.filter(x => x.level === level);
  let hit = items.find(x => (x.keywords||[]).some(k => q.includes(norm(k))));
  if (hit) return hit;
  if (/(horario|hora|jornada)/.test(q)) return items.find(x => x.topic === "horarios");
  if (/(matric|inscrip)/.test(q)) return items.find(x => x.topic === "matriculas");
  if (/(pago|pension|cuota|mensualidad)/.test(q)) return items.find(x => x.topic === "pagos");
  return null;
}

// Endpoint para consultar la base de conocimiento
app.post("/knowledge/query", async (req, res) => {
  console.log("Petición recibida en /knowledge/query:", req.body);
  const { level, query } = req.body || {};
  if (!level || !query) return res.status(400).json({ error: "level y query son requeridos" });
  const item = searchKB(level, query);
  if (!item) return res.json({ response: `No encontré información para "${query}" en ${level}.`, type: "none" });

  // --- NUEVO BLOQUE: lógica para registro/inscripción ---
  const registroIntentKeywords = ["registrarme", "registro", "inscribirme", "inscripción"];
  const lowerQuery = (query || "").toLowerCase();
  const isRegistroIntent = registroIntentKeywords.some(k => lowerQuery.includes(k));
  if (isRegistroIntent && item.registration_url) {
    return res.json({
      response: `Puedes iniciar el proceso de registro en el siguiente enlace: ${item.registration_url}`,
      type: "registration",
      url: item.registration_url,
      context: item.level,
      topic: item.topic
    });
  }
  // --- FIN DEL NUEVO BLOQUE ---

  // Responder solo con texto del JSON (como antes)
  return res.json({
    response: item.description || item.title,
    type: "text",
    context: item.level,
    topic: item.topic
  });
});

// Prueba de vida
app.get("/", (req, res) => {
  res.send("Servidor de Webhook activo 🚀");
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});