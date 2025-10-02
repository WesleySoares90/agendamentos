import { useState, useEffect } from 'react';
import { appointmentService } from '../services/appointmentService';
import { emailService } from '../services/emailService';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      // **ATUALIZADO: Passa o professionalId para a verificação de conflito**
      const hasConflict = await appointmentService.checkTimeConflict(
        appointmentData.date, 
        appointmentData.time,
        appointmentData.professionalId 
      );
      
      if (hasConflict) {
        throw new Error('Este horário já está ocupado com o profissional selecionado.');
      }

      const id = await appointmentService.create(appointmentData);
      
      await emailService.sendConfirmation({ ...appointmentData, id });
      
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
    setLoading(true);
    setError(null);
    try {
      if (updateData.date || updateData.time || updateData.professionalId) {
        const appointment = appointments.find(apt => apt.id === id);
        const newDate = updateData.date || appointment.date;
        const newTime = updateData.time || appointment.time;
        const professionalId = updateData.professionalId || appointment.professionalId;

        // **ATUALIZADO: Passa o professionalId para a verificação de conflito**
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
    updateAppointment
  };
};
