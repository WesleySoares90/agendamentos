import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { emailService } from '../services/emailService';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carregar agendamentos
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

  // Criar agendamento
  const createAppointment = async (appointmentData) => {
    setLoading(true);
    setError(null);
    try {
      // Verificar conflito
      const hasConflict = await appointmentService.checkTimeConflict(
        appointmentData.date, 
        appointmentData.time
      );
      
      if (hasConflict) {
        throw new Error('Este horário já está ocupado');
      }

      const id = await appointmentService.create(appointmentData);
      
      // Enviar e-mail de confirmação
      await emailService.sendConfirmation({ ...appointmentData, id });
      
      // Recarregar lista
      await fetchAppointments();
      
      return { success: true, id };
    } catch (err) {
      setError(err.message || 'Erro ao criar agendamento');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar status
  const updateAppointmentStatus = async (id, status) => {
    setLoading(true);
    setError(null);
    try {
      await appointmentService.update(id, { status });
      
      // Encontrar agendamento para enviar e-mail
      const appointment = appointments.find(apt => apt.id === id);
      if (appointment) {
        await emailService.sendStatusUpdate(appointment, status);
      }
      
      // Recarregar lista
      await fetchAppointments();
      
      return { success: true };
    } catch (err) {
      setError('Erro ao atualizar status');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Atualizar agendamento
  const updateAppointment = async (id, updateData) => {
    setLoading(true);
    setError(null);
    try {
      // Verificar conflito se mudou data/hora
      if (updateData.date || updateData.time) {
        const appointment = appointments.find(apt => apt.id === id);
        const newDate = updateData.date || appointment.date;
        const newTime = updateData.time || appointment.time;
        
        const hasConflict = await appointmentService.checkTimeConflict(
          newDate, 
          newTime, 
          id
        );
        
        if (hasConflict) {
          throw new Error('Este horário já está ocupado');
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

  // Carregar dados na inicialização
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
    updateAppointment
  };
};