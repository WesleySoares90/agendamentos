import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../config/firebase'; // Este é o caminho correto

const functions = getFunctions(app);
const sendConfirmationEmail = httpsCallable(functions, 'sendConfirmationEmail');

export const emailService = {
  async sendConfirmation(appointmentData) {
    try {
      console.log('📧 O envio de e-mail de confirmação foi desabilitado.');
      // O código abaixo foi comentado para desativar a funcionalidade de envio de e-mail.
      // const result = await sendConfirmationEmail(appointmentData);
      // console.log('✅ E-mail enviado com sucesso:', result.data);
      // return result.data;
    } catch (error) {
      console.error('Erro ao enviar e-mail:', error);
      throw error;
    }
  },
};