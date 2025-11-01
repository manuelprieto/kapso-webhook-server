const express = require("express");
const app = express();

// Middleware para parsear JSON
app.use(express.json());

// Ruta para recibir peticiones desde Kapso
app.post("/webhook", (req, res) => {
  console.log("📩 Webhook recibido:", req.body);
  res.status(200).json({ message: "Webhook recibido correctamente" });
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});
