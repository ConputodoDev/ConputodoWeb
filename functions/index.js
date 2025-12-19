/**
 * Importamos las funciones de la v2 (Segunda Generación)
 * Esta sintaxis es más limpia y evita el error que tienes.
 */
const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const { setGlobalOptions } = require("firebase-functions/v2");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configuración opcional para evitar errores de memoria/tiempo
setGlobalOptions({ maxInstances: 10 });

// ==================================================================
// 1. CONFIGURACIÓN DE NODEMAILER (Tu Correo)
// ==================================================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    // 👇 REVISA QUE ESTOS DATOS SEAN LOS TUYOS
    user: "conputodonoreply@gmail.com", 
    pass: "opbmfvtbpqpvsquc", // Tu App Password de 16 letras
  },
});

// ==================================================================
// 2. FUNCIÓN (TRIGGER v2)
// ==================================================================
exports.sendWholesaleEmail = onDocumentCreated("wholesale_requests/{docId}", async (event) => {
    
    // En v2, los datos vienen dentro de event.data
    const snapshot = event.data;
    if (!snapshot) {
        console.log("No hay datos asociados al evento");
        return;
    }

    const data = snapshot.data(); // Obtenemos el objeto JSON (nombre, rif, etc)

    const mailOptions = {
      from: '"Conputodo Web" <noreply@conputodo.com>',
      to: "conputodomcygamer@gmail.com", // ¿A quién le llega el aviso?
      subject: `📢 Nuevo Mayorista: ${data.companyName}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #FF6600;">Nuevo Lead de Mayorista</h2>
          <p>Un cliente ha llenado el formulario en la web.</p>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px; font-weight: bold;">Empresa:</td><td style="padding: 8px;">${data.companyName}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">RIF:</td><td style="padding: 8px;">${data.companyRif}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Correo:</td><td style="padding: 8px;">${data.email}</td></tr>
            <tr><td style="padding: 8px; font-weight: bold;">Teléfono:</td><td style="padding: 8px;">${data.phone}</td></tr>
          </table>

          <h3 style="margin-top: 20px;">Mensaje / Requerimiento:</h3>
          <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${data.message}</p>
        </div>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Correo enviado exitosamente a: ${data.companyName}`);
      return snapshot.ref.update({ emailStatus: 'sent' });
    } catch (error) {
      console.error("❌ Error enviando correo:", error);
      return snapshot.ref.update({ emailStatus: 'error', errorDetails: error.toString() });
    }
});