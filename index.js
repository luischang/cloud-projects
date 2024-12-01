// index.js
const { gymiaChat } = require('./chatgemini'); 
const { getDataColection } = require('./firebase');
const twilio = require('twilio'); 
const express = require('express');
//const { processWithGemini } = require("./processor"); 

// Tus variables de entorno
const accountSid = process.env.TWILIO_ACCOUNT_SID; 
const authToken = process.env.TWILIO_AUTH_TOKEN;
const  whatsappNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = new twilio(accountSid, authToken);

const app = express();

app.use(express.urlencoded({ extended: false }));

app.post('/whatsapp', async (req, res) => {
    const twilioMessage = req.body.Body; 
    const senderNumber = req.body.From; 

    try {
        const ClientContext = await getDataColection();
        const aiResponse = await gymiaChat(twilioMessage, ClientContext); 

        const option = twilioMessage
        const split = option.split("\n")[0]
        console.log("mensaje",option)
        //MENU PRINCIPAL
        if(split=='2'){
            console.log("Llamar a Historial",split)
        }
        if(split=='3'){
            console.log("Llamar a Registro de pagos - G Vision",split)
        }
        if(split.toLowerCase()=='confirmar clase'){
            console.log("Llamar a Reservar Clases",split)
            //const datosProcesados = await processWithGemini(aiResponse);

            
        }


        client.messages 
            .create({ 
                body: aiResponse, 
                from: whatsappNumber, 
                to: senderNumber
            }) 
            .then(message => console.log(message.sid)); 

        res.send('Mensaje recibido y respondido!');
    } catch (error) {
        console.error(error);
        res.status(500).send('Error al procesar el mensaje.');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Servidor web en ejecución en el puerto ${port}`);
});