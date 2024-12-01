const admin = require("firebase-admin");
const vision = require("@google-cloud/vision");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Inicializar Firebase Admin SDK (si no se ha inicializado ya)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  });
}

const bucket = admin.storage().bucket();

// Inicializar cliente de Vision API
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_CREDENTIALS,
});

// Inicializar Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Crear una función para subir imagen al storage de firebase
async function uploadImageToFirebase(imageBuffer, imageName) {
  const file = bucket.file(imageName);
  try {
    await file.save(imageBuffer, {
      metadata: { contentType: "image/png" },
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${file.name}`;
    return publicUrl;
  } catch (error) {
    console.error("Error al subir la imagen a Firebase Storage:", error);
    return null;
  }
}

// Función para analizar el voucher usando Google Vision API
async function analyzeVoucher(imageUrl) {
  try {
    const [result] = await visionClient.textDetection(imageUrl);
    const detections = result.textAnnotations;

    if (detections.length > 0) {
      const text = detections[0].description;
      console.log("Texto extraído del voucher:", text);

      // Pasar el texto extraído a Gemini para obtener datos más estructurados
      const prompt = `
        Analiza el siguiente texto extraído de la imagen de un voucher y devuelve los siguientes datos en formato JSON:
        {
          "nombre": "Nombre del cliente",
          "fecha": "Fecha de emisión en formato DD/MM/AAAA",
          "monto": "Monto total en soles",
          "numOperacion": "Número de operación, solo dígitos relevantes",
          "banco": "Nombre del banco"
        }
        Solo proporciona el JSON sin texto adicional.
      `;

      const resultGemini = await genAI
        .getGenerativeModel({ model: "gemini-1.5-pro" })
        .generateContent([prompt, text]);
      const response = await resultGemini.response;
      let parsedResponse = await response.text();

      // Limpiar el JSON recibido para convertirlo en un objeto
      parsedResponse = parsedResponse.trim();
      if (parsedResponse.startsWith("```json")) {
        parsedResponse = parsedResponse.slice(7); // Elimina "```json\n"
      }
      if (parsedResponse.endsWith("```")) {
        parsedResponse = parsedResponse.slice(0, -3); // Elimina "```" al final
      }

      try {
        // Parsear el JSON y devolverlo como datosVoucher
        const datosVoucher = JSON.parse(parsedResponse);
        console.log("Datos extraídos por Gemini:", datosVoucher);
        return datosVoucher;
      } catch (error) {
        console.error("Error al analizar la respuesta de Gemini:", error);
        return null;
      }
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error al analizar el voucher:", error);
    return null;
  }
}

module.exports = { analyzeVoucher, uploadImageToFirebase };