import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services/appointmentService';
import { emailService } from '../services/emailService';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // 🟢 ESTADO E FUNÇÃO PARA APROVAÇÃO AUTOMÁTICA
  const [autoApprove, setAutoApprove] = useState(false);

  const toggleAutoApprove = useCallback(() => {
    setAutoApprove(prev => !prev);
    // Idealmente, chame uma função aqui para persistir essa configuração no backend.
    console.log(`Auto Aprovação Alternada para: ${!autoApprove}`);
  }, [autoApprove]);


  const fetchAppointments = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await appointmentService.getAll();
      setAppointments(data);
    } catch (err) {
      setError('Erro ao carregar agendamentos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createAppointment = async (appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      // **Passa o professionalId para a verificação de conflito**
      const hasConflict = await appointmentService.checkTimeConflict(
        appointmentData.date,
        appointmentData.time,
        appointmentData.professionalId
      );

      if (hasConflict) {
        throw new Error('Este horário já está ocupado com o profissional selecionado.');
      }

      // 🎯 CORREÇÃO CRÍTICA: Define o status baseado no autoApprove
      const initialStatus = autoApprove ? 'approved' : 'pending';

      // 🎯 Passa o status inicial para a função de serviço
      const id = await appointmentService.create({
        ...appointmentData,
        status: initialStatus // Sobrescreve o status padrão, se a flag estiver ativa
      });

      await emailService.sendConfirmation({ ...appointmentData, id, status: initialStatus });

      await fetchAppointments();

      return { success: true, id };
    } catch (err) {
      setError(err.message || 'Erro ao criar agendamento');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = async (id, status) => {
    // ... (restante da função updateAppointmentStatus)
    setLoading(true);
    setError(null);
    try {
      await appointmentService.update(id, { status });

      const appointment = appointments.find(apt => apt.id === id);
      if (appointment) {
        await emailService.sendStatusUpdate(appointment, status);
      }

      await fetchAppointments();

      return { success: true };
    } catch (err) {
      setError('Erro ao atualizar status');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateAppointment = async (id, updateData) => {
    // ... (restante da função updateAppointment)
    setLoading(true);
    setError(null);
    try {
      if (updateData.date || updateData.time || updateData.professionalId) {
        const appointment = appointments.find(apt => apt.id === id);
        const newDate = updateData.date || appointment.date;
        const newTime = updateData.time || appointment.time;
        const professionalId = updateData.professionalId || appointment.professionalId;

        // **Passa o professionalId para a verificação de conflito**
        const hasConflict = await appointmentService.checkTimeConflict(
          newDate,
          newTime,
          professionalId,
          id // Exclui o próprio agendamento da verificação de conflito
        );

        if (hasConflict) {
          throw new Error('Este horário já está ocupado com o profissional selecionado');
        }
      }

      await appointmentService.update(id, updateData);
      await fetchAppointments();

      return { success: true };
    } catch (err) {
      setError(err.message || 'Erro ao atualizar agendamento');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    updateAppointment,
    autoApprove,
    toggleAutoApprove
  };
};