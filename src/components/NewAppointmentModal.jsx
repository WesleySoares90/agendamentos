import React, { useState, useEffect } from 'react';
import { Plus, X, RefreshCw, CheckCircle } from 'lucide-react';
// Ajuste o caminho para appointmentService conforme a estrutura do seu projeto
import { appointmentService } from '../services/appointmentService'; 

const NewAppointmentModal = ({
  showNewAppointmentModal,
  onClose,
  onRefresh,
  services,
  professionals,
  localAppointments // Passar localAppointments para checkAvailableSlotsForModal
}) => {
  const [newAppointmentData, setNewAppointmentData] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    professionalId: '',
    date: '',
    time: ''
  });
  const [availableSlotsModal, setAvailableSlotsModal] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!showNewAppointmentModal) {
      // Resetar o formulário quando o modal for fechado
      setNewAppointmentData({
        name: '',
        email: '',
        phone: '',
        service: '',
        professionalId: '',
        date: '',
        time: ''
      });
      setAvailableSlotsModal([]);
    }
  }, [showNewAppointmentModal]);

  useEffect(() => {
    if (newAppointmentData.date && newAppointmentData.professionalId && showNewAppointmentModal) {
      checkAvailableSlotsForModal(newAppointmentData.date, newAppointmentData.professionalId);
    }
  }, [newAppointmentData.date, newAppointmentData.professionalId, showNewAppointmentModal, localAppointments]);

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/\D/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    if (phoneNumberLength < 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const checkAvailableSlotsForModal = async (selectedDate, professionalId) => {
    if (!selectedDate || !professionalId) {
      setAvailableSlotsModal([]);
      return;
    }

    setLoadingSlots(true);
    try {
      const TIME_SLOTS = [
        '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
        '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
        '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00'
      ];
      const dayAppointments = localAppointments.filter(apt =>
        apt.date === selectedDate &&
        apt.professionalId === professionalId &&
        apt.status !== 'cancelled'
      );
      const slotsStatus = TIME_SLOTS.map(time => ({
        time,
        available: !dayAppointments.some(apt => apt.time === time)
      }));
      setAvailableSlotsModal(slotsStatus);
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      setAvailableSlotsModal([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCreateManualAppointment = async () => {
    // Validações
    if (!newAppointmentData.name || newAppointmentData.name.trim().split(' ').length < 2) {
      alert('Por favor, insira o nome completo.');
      return;
    }
    if (!newAppointmentData.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newAppointmentData.email)) {
      alert('Por favor, insira um e-mail válido.');
      return;
    }
    if (!newAppointmentData.phone || newAppointmentData.phone.replace(/\D/g, '').length < 10) {
      alert('Por favor, insira um telefone válido com DDD.');
      return;
    }
    if (!newAppointmentData.service) {
      alert('Por favor, selecione um serviço.');
      return;
    }
    if (!newAppointmentData.professionalId) {
      alert('Por favor, selecione um profissional.');
      return;
    }
    if (!newAppointmentData.date) {
      alert('Por favor, selecione uma data.');
      return;
    }
    if (!newAppointmentData.time) {
      alert('Por favor, selecione um horário.');
      return;
    }

    // Verificar conflito
    const hasConflict = await appointmentService.checkTimeConflict(
      newAppointmentData.date,
      newAppointmentData.time,
      newAppointmentData.professionalId
    );

    if (hasConflict) {
      alert('Este horário já está ocupado com o profissional selecionado.');
      return;
    }

    try {
      const appointmentToCreate = {
        ...newAppointmentData,
        status: 'approved' // Agendamentos manuais são aprovados automaticamente
      };

      await appointmentService.create(appointmentToCreate);
      await onRefresh();
      onClose(); // Fechar o modal após o sucesso
      alert('Agendamento criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar agendamento manual:', error);
      alert('Erro ao criar agendamento. Verifique o console.');
    }
  };

  if (!showNewAppointmentModal) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Novo Agendamento Manual</h2>
            <p className="text-blue-100 text-sm mt-1">Preencha todos os dados do cliente</p>
          </div>
          <button onClick={onClose} className="text-white hover:text-blue-100 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Nome Completo */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nome Completo *
            </label>
            <input
              type="text"
              value={newAppointmentData.name}
              onChange={(e) => setNewAppointmentData({ ...newAppointmentData, name: e.target.value })}
              placeholder="Nome e sobrenome"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Email e Telefone */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                E-mail *
              </label>
              <input
                type="email"
                value={newAppointmentData.email}
                onChange={(e) => setNewAppointmentData({ ...newAppointmentData, email: e.target.value })}
                placeholder="exemplo@email.com"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefone *
              </label>
              <input
                type="tel"
                value={formatPhoneNumber(newAppointmentData.phone)}
                onChange={(e) => setNewAppointmentData({
                  ...newAppointmentData,
                  phone: e.target.value.replace(/\D/g, '')
                })}
                placeholder="(21) 98765-4321"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          {/* Serviço */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Serviço *
            </label>
            <select
              value={newAppointmentData.service}
              onChange={(e) => setNewAppointmentData({ ...newAppointmentData, service: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Selecione um serviço</option>
              {services.map(service => (
                <option key={service.id} value={service.id}>
                  {service.name} - R$ {service.price} ({service.duration}min)
                </option>
              ))}
            </select>
          </div>

          {/* Profissional */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Profissional *
            </label>
            <select
              value={newAppointmentData.professionalId}
              onChange={(e) => {
                const profId = e.target.value;
                setNewAppointmentData({ ...newAppointmentData, professionalId: profId, time: '' });
                // checkAvailableSlotsForModal será chamado via useEffect
              }}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            >
              <option value="">Selecione um profissional</option>
              {professionals.filter(prof => prof && prof.id && prof.name).map(prof => (
                <option key={prof.id} value={prof.id}>
                  {prof.name} {prof.specialty && `- ${prof.specialty}`}
                </option>
              ))}
            </select>
          </div>

          {/* Data */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Data *
            </label>
            <input
              type="date"
              value={newAppointmentData.date}
              onChange={(e) => {
                const dateValue = e.target.value;
                setNewAppointmentData({ ...newAppointmentData, date: dateValue, time: '' });
                // checkAvailableSlotsForModal será chamado via useEffect
              }}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Horários Disponíveis */}
          {newAppointmentData.date && newAppointmentData.professionalId && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Horário Disponível *
              </label>
              {loadingSlots ? (
                <div className="text-center py-4">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <p className="text-sm text-gray-600 mt-2">Verificando disponibilidade...</p>
                </div>
              ) : availableSlotsModal.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                  {availableSlotsModal.map((slot, idx) => {
                    const isSelected = newAppointmentData.time === slot.time;
                    const isAvailable = slot.available;

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => isAvailable && setNewAppointmentData({ ...newAppointmentData, time: slot.time })}
                        disabled={!isAvailable}
                        className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${isSelected
                          ? 'bg-blue-600 text-white border-blue-600 scale-105'
                          : isAvailable
                            ? 'bg-white text-gray-700 border-gray-300 hover:border-blue-400 hover:bg-blue-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
                          }`}
                      >
                        {slot.time}
                        {!isAvailable && <div className="text-xs mt-1">Ocupado</div>}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Selecione uma data e profissional para ver os horários disponíveis
                </p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>Nota:</strong> Agendamentos manuais criados pelo administrador são aprovados automaticamente.
            </p>
          </div>
        </div>

        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl flex gap-3 border-t">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleCreateManualAppointment}
            disabled={!newAppointmentData.time}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="h-5 w-5" />
            Criar Agendamento
          </button>
        </div>
      </div>
    </div>
  );
};

export default NewAppointmentModal;
