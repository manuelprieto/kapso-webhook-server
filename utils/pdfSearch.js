const pdf = require('pdf-parse');
const fs = require('fs');

module.exports = async function buscarPalabraEnPDF(rutaPDF, palabraClave) {
  try {
    console.log('Entrando a buscarPalabraEnPDF');
    console.log('Ruta PDF:', rutaPDF);
    console.log('Palabra clave recibida:', palabraClave);

    // Verificamos si la palabra clave es válida
    if (!palabraClave || typeof palabraClave !== 'string') {
      console.log('Palabra clave inválida:', palabraClave);
      return null;
    }

    // Revisamos si el archivo existe y leemos el buffer
    if (!fs.existsSync(rutaPDF)) {
      console.log('El archivo no existe en la ruta:', rutaPDF);
      return null;
    }

    const dataBuffer = fs.readFileSync(rutaPDF);
    const data = await pdf(dataBuffer);

    // Mostramos una parte del texto extraído para depuración
    if (data.text) {
      console.log("Texto extraído del PDF (primeros 1000 caracteres):\\n", data.text.slice(0, 1000));
    } else {
      console.log("No se extrajo ningún texto del PDF.");
    }

    // Procesamos la búsqueda
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

