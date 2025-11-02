const pdf = require('pdf-parse');
const fs = require('fs');

module.exports = async function buscarPalabraEnPDF(rutaPDF, palabraClave) {
  const dataBuffer = fs.readFileSync(rutaPDF);
  const data = await pdf(dataBuffer);

  // Aquí puedes correr el console.log para ver el texto extraído
  console.log("Texto extraído del PDF:", data.text.slice(0, 1000)); // muestra los primeros 1000 caracteres

  const textoLower = data.text.toLowerCase();
  const claveLower = palabraClave.toLowerCase();
  const idx = textoLower.indexOf(claveLower);
  if (idx !== -1) {
    return data.text.substring(Math.max(0, idx - 100), idx + 400);
  } else {
    return null;
  }
}
