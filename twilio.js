const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

// Configuración de Twilio
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

/**
 * Función para enviar un mensaje por WhatsApp
 * @param {string} to Número de WhatsApp del destinatario (incluye el código de país, por ejemplo: +51xxxxxxxxxx)
 * @param {string} message Contenido del mensaje a enviar
 */
async function sendWhatsApp(to, message) {
    try {
        const response = await client.messages.create({
            body: message,
            from: `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`, // Número habilitado para WhatsApp en Twilio
            to: `whatsapp:${to}`,
        });
        console.log(`Mensaje enviado con éxito al número ${to}. SID: ${response.sid}`);
        return `Mensaje enviado al número ${to}.`;
    } catch (error) {
        console.error(`Error al enviar mensaje: ${error.message}`);
        return `No se pudo enviar el mensaje: ${error.message}`;
    }
}

module.exports = { sendWhatsApp };
