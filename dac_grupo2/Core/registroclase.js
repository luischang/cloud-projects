const { db } = require("./firebase"); // Importar conexión a Firebase desde firebase.js
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Inicializar cliente de Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Configuración de generación
const generationConfig = {
  temperature: 0.7,
  topP: 0.9,
  maxOutputTokens: 1024,
  responseMimeType: "text/plain",
};

// Función para procesar texto usando Gemini y devolver JSON estructurado
async function processWithGemini(inputText) {
  const prompt = `
    Analiza el siguiente texto y devuelve los datos estructurados en formato JSON con los campos:
    {
      "nombre": "Nombre del cliente",
      "clase": "Nombre de la clase del gym (ej zumba, yoga, spping, etc)",
      "horario": "Hora y Fecha"
    }
    Solo devuelve el JSON, sin ningún otro texto o explicación adicional.
  `;

  try {
    const chatSession = model.startChat({
      generationConfig,
      history: [{ role: "user", parts: [{ text: `${prompt}\n${inputText}` }] }],
    });

    const result = await chatSession.sendMessage(inputText);
    let response = result.response.text().trim();

    // Limpiar el formato si está rodeado de delimitadores como ```json
    if (response.startsWith("```json")) {
      response = response.slice(7);
    }
    if (response.endsWith("```")) {
      response = response.slice(0, -3);
    }

    const jsonResponse = JSON.parse(response); // Convertir a JSON
    console.log("Respuesta procesada:", jsonResponse);
    return jsonResponse;
  } catch (error) {
    console.error("Error procesando datos con Gemini:", error);
    return null;
  }
}

// Función para insertar datos en Firebase
async function InsertarDatosFirebase(datos) {
  try {
    await db.collection("vouchers").add({
      nombre: datos.nombre,
      fecha: datos.fecha,
      monto: datos.monto,
      numOperacion: datos.numOperacion,
      banco: datos.banco,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log("Datos guardados en Firebase:", datos);
  } catch (error) {
    console.error("Error al insertar datos en Firebase:", error);
  }
}

// Exportar funciones para su uso en index.js
module.exports = { processWithGemini, InsertarDatosFirebase };
