const admin = require("firebase-admin");
const express = require("express");
const axios = require("axios");
const twilio = require("twilio");
const vision = require("@google-cloud/vision");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

// Inicializar Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET
});

const bucket = admin.storage().bucket();
const db = admin.firestore();

// Inicializar cliente de Vision API
const visionClient = new vision.ImageAnnotatorClient({
  keyFilename: process.env.GOOGLE_VISION_CREDENTIALS
});

// Inicializar generatuve AI y Twilio
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Crearuna funci´øn para subir imagen al storage de firebase
async function uploadImageToFirebase(imageBuffer, imageName) {
  const file = bucket.file(imageName);
  try {
    await file.save(imageBuffer, {
      metadata: { contentType: "image/png" }
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
  
        const resultGemini = await genAI.getGenerativeModel({ model: "gemini-1.5-pro" }).generateContent([prompt, text]);
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
  

// Webhook de Twilio para recibir la imagen y procesarla
app.post("/whatsapp", async (req, res) => {
  const mediaUrl = req.body.MediaUrl0;
  const from = req.body.From;

  if (!mediaUrl) {
    return res.send("<Response><Message>Por favor, envía una imagen del voucher.</Message></Response>");
  }

  try {
 // Descargar la imagen desde Twilio
    const response = await axios.get(mediaUrl, {
      responseType: "arraybuffer",
      auth: {
        username: process.env.TWILIO_ACCOUNT_SID,
        password: process.env.TWILIO_AUTH_TOKEN
      }
    });
    const imageBuffer = Buffer.from(response.data, "binary");

    // Subir la imagen a Firebase Storage
    const firebaseUrl = await uploadImageToFirebase(imageBuffer, `voucher_${Date.now()}.jpg`);

    if (!firebaseUrl) {
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        body: "Error al subir la imagen. Inténtalo nuevamente."
      });
      return res.send("<Response></Response>");
    }

    // Analizar el voucher usando Vision y Gemini
    const datosVoucher = await analyzeVoucher(firebaseUrl);

    if (datosVoucher) {
      const mensajeRespuesta = `
        Nombre del cliente: ${datosVoucher.nombre || "No encontrado"}
        Fecha de emisión: ${datosVoucher.fecha || "No encontrada"}
        Monto total en soles: S/${datosVoucher.monto || "No encontrado"}
        Número de operación: ${datosVoucher.numOperacion || "No encontrado"}
        Banco: ${datosVoucher.banco || "No encontrado"}
      `;
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        body: mensajeRespuesta
      });

      //Guardar los datos del voucher en Firestore
      await db.collection("vouchers").add({
        fecha: datosVoucher.fecha,
        monto: datosVoucher.monto,
        numOperacion: datosVoucher.numOperacion,
        banco: datosVoucher.banco,
        imageUrl: firebaseUrl,
        user: from,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await client.messages.create({
        from: process.env.TWILIO_WHATSAPP_NUMBER,
        to: from,
        body: "No se pudo extraer la información. Por favor intenta nuevamente."
      });
    }

    res.send("<Response></Response>");
  } catch (error) {
    console.error("Error al procesar la imagen:", error);
    res.status(500).send("Error procesando la solicitud.");
  }
});

// Inicializar el servidor en el puerto 3001
app.listen(3001, () => {
  console.log("Servidor en ejecución en el puerto 3001");
});
