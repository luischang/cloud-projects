const express = require("express");
const bodyParser = require("body-parser");
const admin = require("firebase-admin");

// Inicializar Firebase Admin SDK
const serviceAccount = require("./serviceAccountKey.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://<your-database-name>.firebaseio.com",
});

const db = admin.firestore();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

// Ruta para el formulario de registro
app.get("/register", (req, res) => {
  res.sendFile(__dirname + "/views/register.html");
});

// Ruta para manejar el envío de datos del formulario
app.post("/register", async (req, res) => {
  const {
    name,
    email,
    DNI,
    phone,
    age,
    weight,
    height,
    goal
  } = req.body;

  try {
    // Guardar los datos en Firestore
    await db.collection("usuarios").add({
      name,
      email,
      DNI,
      phone,
      age: parseInt(age),
      weight: parseFloat(weight),
      height: parseFloat(height),
      goal,
      createdAt: admin.firestore.Timestamp.now(),
    });
    res.send(`
      <h1>¡Registro Exitoso!</h1>
      <p>Gracias por registrarte, ${name}. Hemos guardado tus datos.</p>
      <a href="/register">Volver al formulario</a>
    `);
  } catch (error) {
    console.error("Error al registrar el usuario:", error);
    res.status(500).send(`
      <h1>Error</h1>
      <p>No se pudo completar el registro. Por favor, intenta nuevamente.</p>
      <a href="/register">Volver al formulario</a>
    `);
  }
});

// Iniciar el servidor
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});
