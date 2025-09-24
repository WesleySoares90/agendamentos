// functions/index.js
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");

// Configurações do seu provedor de e-mail (ex: Gmail com Senha de App)
// É crucial não expor a senha no código. Use variáveis de ambiente do Firebase.
// firebase functions:config:set \
// mail.user="seu-email@gmail.com" mail.pass="sua-senha-app"
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().mail.user,
    pass: functions.config().mail.pass,
  },
});

exports.sendConfirmationEmail = functions.https.onCall(async (data, context) => {
  const { name, email, service, date, time } = data;

  const mailOptions = {
    from: "Sua Empresa <SUPORTEAPPSITE@GMAIL.COM>",
    to: email,
    subject: "Agendamento Confirmado!",
    html: `
      <h1>Olá, ${name}!</h1>
      <p>Seu agendamento para o serviço de ${service} foi confirmado.</p>
      <p>Data: ${date}</p>
      <p>Horário: ${time}</p>
      <p>Obrigado por escolher nossos serviços!</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("E-mail enviado com sucesso para:", email);
    return { success: true };
  } catch (error) {
    console.error("Erro ao enviar o e-mail:", error);
    throw new functions.https.HttpsError("internal", "Erro ao enviar e-mail.");
  }
});