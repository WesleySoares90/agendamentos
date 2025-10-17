import { useState, useEffect, useCallback } from 'react';
import { appointmentService } from '../services/appointmentService';
import { emailService } from '../services/emailService';

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Estado para aprovação automática
  const [autoApprove, setAutoApprove] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Carrega as configurações ao montar o componente
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const settings = await appointmentService.getSettings();
        if (settings && settings.autoApprove !== undefined) {
          setAutoApprove(settings.autoApprove);
        }
      } catch (err) {
        console.error('Erro ao carregar configurações:', err);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadSettings();
  }, []);

  // Alterna e persiste a configuração de aprovação automática
  const toggleAutoApprove = useCallback(async () => {
    const newValue = !autoApprove;
    setAutoApprove(newValue);

    try {
      await appointmentService.updateSettings({ autoApprove: newValue });
      console.log(`Auto Aprovação alternada para: ${newValue}`);
    } catch (err) {
      console.error('Erro ao salvar configuração de auto aprovação:', err);
      // Reverte o estado em caso de erro
      setAutoApprove(!newValue);
      alert('Erro ao salvar configuração. Tente novamente.');
    }
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
      const hasConflict = await appointmentService.checkTimeConflict(
        appointmentData.date,
        appointmentData.time,
        appointmentData.professionalId
      );

      if (hasConflict) {
        throw new Error('Este horário já está ocupado com o profissional selecionado.');
      }

      // Usa o valor de autoApprove salvo no banco
      const initialStatus = autoApprove ? 'approved' : 'pending';

      const id = await appointmentService.create({
        ...appointmentData,
        status: initialStatus
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

        const hasConflict = await appointmentService.checkTimeConflict(
          newDate,
          newTime,
          professionalId,
          id
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
    toggleAutoApprove,
    isLoadingSettings
  };
};