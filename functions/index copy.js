const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configura tu correo emisor (Gmail, por ejemplo)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "conputodonoreply@gmail.com",
    pass: "crsl bmhs bclb qyf", // OJO: Usa "App Password" de Google, no tu clave normal
  },
});

exports.sendWholesaleEmail = functions.firestore
  .document("wholesale_requests/{docId}")
  .onCreate((snap, context) => {
    const data = snap.data();

    const mailOptions = {
      from: "Conputodo Web <noreply@conputodo.com>",
      to: "vicentesok@gmail.com", // El correo del responsable
      subject: `Nuevo Mayorista: ${data.companyName}`,
      html: `
        <h1>Solicitud de Mayorista</h1>
        <p><strong>Empresa:</strong> ${data.companyName}</p>
        <p><strong>RIF:</strong> ${data.companyRif}</p>
        <p><strong>Contacto:</strong> ${data.phone}</p>
        <p><strong>Correo:</strong> ${data.email}</p>
        <hr />
        <p><strong>Mensaje:</strong></p>
        <p>${data.message}</p>
      `,
    };

    return transporter.sendMail(mailOptions)
      .then(() => console.log("Correo enviado"))
      .catch((error) => console.error("Error enviando correo:", error));
  });