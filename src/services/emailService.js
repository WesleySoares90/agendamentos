// Simulação de serviço de e-mail
// Em produção, integre com SendGrid, EmailJS ou Firebase Functions

export const emailService = {
    async sendConfirmation(appointmentData) {
      console.log('📧 E-mail de confirmação enviado:', {
        to: appointmentData.email,
        subject: 'Agendamento Confirmado',
        template: 'confirmation',
        data: appointmentData
      });
      
      // Simular delay de envio
      return new Promise(resolve => setTimeout(resolve, 1000));
    },
  
    async sendStatusUpdate(appointmentData, status) {
      const statusMessages = {
        approved: 'Agendamento Aprovado',
        cancelled: 'Agendamento Cancelado'
      };
  
      console.log('📧 E-mail de atualização enviado:', {
        to: appointmentData.email,
        subject: statusMessages[status],
        template: 'status_update',
        data: { ...appointmentData, status }
      });
      
      return new Promise(resolve => setTimeout(resolve, 1000));
    }
  };