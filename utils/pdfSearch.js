const fs = require('fs');
let pdf;
// Maneja ambas formas, según si 'default' existe o no (para compatibilidad)
try {
  pdf = require('pdf-parse');
  if (typeof pdf !== 'function' && pdf.default) {
    pdf = pdf.default;
  }
} catch (e) {
  console.log('No se pudo importar pdf-parse correctamente:', e);
}

module.exports = async function buscarPalabraEnPDF(rutaPDF, palabraClave) {
  try {
    console.log('Entrando a buscarPalabraEnPDF');
    console.log('Ruta PDF:', rutaPDF);
    console.log('Palabra clave recibida:', palabraClave);

    // Validar palabra clave
    if (!palabraClave || typeof palabraClave !== 'string') {
      console.log('Palabra clave inválida:', palabraClave);
      return null;
    }

    // Chequear existencia del archivo
    if (!fs.existsSync(rutaPDF)) {
      console.log('El archivo no existe en la ruta:', rutaPDF);
      return null;
    }

    const dataBuffer = fs.readFileSync(rutaPDF);
    const data = await pdf(dataBuffer);

    // Depuración: mostrar parte del texto extraído
    if (data.text) {
      console.log("Texto extraído del PDF (primeros 1000 caracteres):\\n", data.text.slice(0, 1000));
    } else {
      console.log("No se extrajo ningún texto del PDF.");
    }

    const textoLower = (data.text || '').toLowerCase();
    const claveLower = palabraClave.toLowerCase();
    const idx = textoLower.indexOf(claveLower);
    console.log('Resultado indexOf:', idx);

    if (idx !== -1) {
      console.log('Palabra clave encontrada en la posición', idx);
      return data.text.substring(Math.max(0, idx - 100), idx + 400);
    } else {
      console.log('Palabra clave no encontrada en el texto del PDF.');
      return null;
    }
  } catch (err) {
    console.log('Ocurrió un error en buscarPalabraEnPDF:', err);
    return null;
  }
};
