// Importa el SDK de Firebase Admin
const admin = require('firebase-admin');

// Inicializa la aplicación de Firebase con la clave privada
const serviceAccount = require('./turismogobd-firebase-adminsdk-iaqf8-8fe12cd8b9.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Referencia a la base de datos Firestore
const db = admin.firestore();

// Función para obtener datos de una colección específica

async function getDataColection() {
  try {
    const snapshot = await db.collection('usuarios').get();

    if (snapshot.empty) {
      console.log('No se encontraron documentos.');
      return "No se encontraron documentos.";
    }
    const documents = [];

    snapshot.forEach(doc => {
      //documents.push(`Data: ${JSON.stringify(doc.data())}`);
      documents.push(JSON.stringify(doc.data()));
    });
    //console.log(documents.join("\n"));
    return documents.join("\n");

  } catch (error) {
    console.error('Error al obtener los documentos:', error);
    return `Error al obtener los documentos: ${error.message}`;
  }
}



//Funcion para insertar datos en una coleccion
async function insertDataColection() {
  try {
    const snapshot = await db.collection('usuarios').add({
      name: 'Alberto',
      lastname: 'Godoy',
      plan: 'Premium',
    });
    console.log('Document ID:', snapshot.id);
  } catch (error) {
    console.error('Error al insertar el documento:', error);
  }
}

//Funcion para buscar un documento por dni
async function getDocumentByDni(dni) {
  try {
    const snapshot = await db.collection('usuarios').where('dni', '==', dni).get();

    if (snapshot.empty) {
      console.log('No se encontraron documentos.');
      return "No se encontraron documentos.";
    }
    const documents = [];

    snapshot.forEach(doc => {
      documents.push(`Data: ${JSON.stringify(doc.data())}`);
    });
    console.log(documents.join("\n"));
  } catch (error) {
    console.error('Error al obtener los documentos:', error);
  }
}


module.exports = { getDataColection};
