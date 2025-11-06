const express = require("express");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(express.json());

// Sirve archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Carga la base de conocimiento una sola vez en memoria
const kbPath = path.join(__dirname, "data", "knowledge.json");
let KB = {};
try {
  KB = JSON.parse(fs.readFileSync(kbPath, "utf8"));
} catch (err) {
  console.error("Error cargando knowledge.json:", err);
}

// Buscar en la base de conocimiento eficiente (objeto anidado)
function searchKB(level, query) {
  const norm = s => (s || "").toLowerCase().normalize("NFD").replace(/[áéíóúüñ]/g, x =>
    ({á:'a',é:'e',í:'i',ó:'o',ú:'u',ü:'u',ñ:'n'})[x] || x);
  const q = norm(query || "");
  if (!KB[level]) return null;

  // Busca coincidencia por keywords y permite consulta por topic directo
  for (const topicKey of Object.keys(KB[level])) {
    const item = KB[level][topicKey];
    if ((item.keywords||[]).some(k => q.includes(norm(k))))
      return { ...item, topic: topicKey, level };
    if (norm(topicKey).includes(q) || q.includes(norm(topicKey))) // match por topic
      return { ...item, topic: topicKey, level };
  }
  return null;
}

// Endpoint para consultar la base de conocimiento
app.post("/knowledge/query", async (req, res) => {
  console.log("Petición recibida en /knowledge/query:", req.body);
  const { level, query } = req.body || {};
  if (!level || !query) return res.status(400).json({ error: "level y query son requeridos" });
  const item = searchKB(level, query);
  if (!item) return res.json({ response: `No encontré información para "${query}" en ${level}.`, type: "none" });

  // Lógica para registro/inscripción
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

  // Responder solo con texto del JSON
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