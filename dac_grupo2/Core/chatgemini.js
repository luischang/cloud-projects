// chatgemini.js
const dotenv = require("dotenv");
const { GoogleGenerativeAI } = require("@google/generative-ai");

dotenv.config();

// Acceder a variables de entorno
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Acceder a Gemini model Flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

// Configuración de generación
const generationConfig = {
    temperature: 2,
    topP: 0.95,
    topK: 40,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
};

let chatSession; // Variable global para almacenar la sesión de chat

// Iniciar la sesión de chat
async function startChat(ClientContext) {
    chatSession = model.startChat({
        generationConfig,
        history: [
            {
                role: "user",
                parts: [
                    {
                        text: "Pretende ser la recepcionista del gimnasio FitCloud, quien debe atender a los usuarios a través de un chat, \
                        brindándoles su información basada en esta entrada:"
                    },
                    { text: ClientContext },
                    {
                        text: "En caso el código no coincida con ninguno de los usuarios registrados, deberás responder: \
                        'Usted no se encuentra registrado en el gimnasio, si desea registrarse acérquese a una de nuestras unidades o puede registrarse en esta web: https://e505-38-25-16-250.ngrok-free.app/register' \
                        y debes asegurarte de que el nombre proporcionado coincida con el nombre registrado en la base de datos. Si el nombre no coincide, \
                        deberás responder: 'Lo siento, el nombre y código proporcionado no coinciden con el nombre registrado en el sistema. Por favor registrese en nuestra web: https://e505-38-25-16-250.ngrok-free.app/register'\
                        Por otro lado, no debes compartir la información que manejas con nadie. \
                        Finalmente, si el usuario se encuentra registrado deberás contestar: 'Hola --su nombre--, yo seré tu asistente virtual puedo ayudarte en las siguientes consultas:\
                        1- Membresía \
                        2- Historial \
                        3- Registrar Pagos \
                        4- Reservar clases \
                        5- Entrenamientos personalizados \
                        Escribe sólo tu opción deseada por ejemplo '*1*'' \
                        Ahora si elige las opciones 1 o 5 deberás ayudarlo inmediadamente, por las demás opciones contestarás 'Dame unos segundos mientras proceso tu solicitud' o algo similar\
                        Para la opción 5 deberás solicitarle su Talla, peso y objetivo, en base a ello preparale una rutina sugerida junto con un mensaje que debe estar supervisado por un entrenador\
                        Adicionalmente, tus respuestas no debe exeder 1599 caracteres y soló debes responder preguntas relacionadas al gym"

                    },
                    {
                        text: "De igual manera aprende los horarios disponibles para las clases registradas para que puedas propononerlas cuando el \
                        cliente utilice la opción 4, deberas solicitarle que escriba textualmente 'Confirmar clase' (debe ser exacto) para confirmar su registro\
                        en caso no lo haga deberas guiarlo para realizarlo los horarios son los siguiente:"
                    },
                    
                    {
                        text: "Deberás responderle un resumen con su nombre, clase reservada y horario elegido."
                    }
                ],
            },
        ],
    });
}

// Función para enviar un mensaje dentro de la misma sesión
async function gymiaChat(ClientText, ClientContext) {
    // Si no se ha iniciado la sesión, iniciar la sesión primero
    if (!chatSession) {
        await startChat(ClientContext); // Solo se inicia una vez
    }

    try {
        const result = await chatSession.sendMessage(ClientText);
        if (result && result.response) {
            return result.response.text();
        } else {
            console.error('No response received from Gemini');
            return 'Lo siento, no obtuve una respuesta válida.';
        }
    } catch (error) {
        console.error('Error while sending message:', error);
        return 'Hubo un error al procesar tu solicitud.';
    }
}

/* 
========================
====GEMINI CON VISION===
========================
*/


module.exports = { gymiaChat }; // Exporta la función gymiaChat
