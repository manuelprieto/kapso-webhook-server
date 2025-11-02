const express = require("express");
const path = require("path");
const fs = require("fs");
const buscarPalabraEnPDF = require("./utils/pdfSearch"); // Importa tu función utilitaria

const app = express();
app.use(express.json());

// Servir PDFs de la carpeta /files
app.use("/files", express.static(path.join(__dirname, "files")));

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

  if ((item.content_type || "") === "pdf") {
    const pdfPath = path.join(__dirname, "files", path.basename(item.source_url));
    try {
      const fragmento = await buscarPalabraEnPDF(pdfPath, query);
      if (fragmento) {
        return res.json({
          response: `Esto encontré relacionado con "${query}":\\n${fragmento}`,
          type: "pdf-fragment",
          url: item.source_url,
          context: item.level,
          topic: item.topic
        });
      } else {
        return res.json({
          response: `No encontré ese tema exacto, pero aquí tienes el documento completo: ${item.source_url}`,
          type: "pdf",
          url: item.source_url,
          context: item.level,
          topic: item.topic
        });
      }
    } catch (err) {
      return res.json({
        response: `No pude leer el PDF. Aquí tienes el enlace directo: ${item.source_url}`,
        type: "pdf",
        url: item.source_url,
        context: item.level,
        topic: item.topic
      });
    }
  }

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
