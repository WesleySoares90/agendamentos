import React, { useState, useEffect } from 'react';
import { Save, Calendar, Clock, Trash2, Plus, AlertCircle, MessageSquare, Loader2 } from 'lucide-react';
import AdminUsersSettings from './AdminUsersSettings';

// --- COMPONENTE: HORÁRIOS DE FUNCIONAMENTO ---
const BusinessHoursSettings = ({ value, onChange }) => {
  const daysOfWeek = [
    { key: 'monday', label: 'Segunda-feira', shortKey: 'seg' },
    { key: 'tuesday', label: 'Terça-feira', shortKey: 'ter' },
    { key: 'wednesday', label: 'Quarta-feira', shortKey: 'qua' },
    { key: 'thursday', label: 'Quinta-feira', shortKey: 'qui' },
    { key: 'friday', label: 'Sexta-feira', shortKey: 'sex' },
    { key: 'saturday', label: 'Sábado', shortKey: 'sab' },
    { key: 'sunday', label: 'Domingo', shortKey: 'dom' }
  ];

  const handleToggleDay = (dayKey) => {
    onChange({
      ...value,
      [dayKey]: {
        ...value[dayKey],
        enabled: !value[dayKey]?.enabled
      }
    });
  };

  const handleTimeChange = (dayKey, field, time) => {
    onChange({
      ...value,
      [dayKey]: {
        ...value[dayKey],
        [field]: time
      }
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Clock className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Horário de Funcionamento</h2>
      </div>
      <p className="text-sm text-gray-600 mb-4">
        Defina os dias e horários em que o estabelecimento está aberto.
      </p>
      <div className="space-y-3">
        {daysOfWeek.map(day => (
          <div
            key={day.key}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-gray-50 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1 min-w-[140px]">
              <input
                type="checkbox"
                checked={value[day.key]?.enabled ?? true}
                onChange={() => handleToggleDay(day.key)}
                className="h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label className="font-medium text-gray-900">{day.label}</label>
            </div>

            {value[day.key]?.enabled !== false ? (
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Abre:</label>
                  <input
                    type="time"
                    value={value[day.key]?.open || '09:00'}
                    onChange={(e) => handleTimeChange(day.key, 'open', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Fecha:</label>
                  <input
                    type="time"
                    value={value[day.key]?.close || '18:00'}
                    onChange={(e) => handleTimeChange(day.key, 'close', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <span className="text-sm text-gray-500 italic">Fechado</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// --- COMPONENTE: DATAS BLOQUEADAS ---
const BlockedDatesSettings = ({ blockedDates, onChange }) => {
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const handleAddBlockedDate = () => {
    if (!newBlockedDate) {
      alert('Por favor, selecione uma data.');
      return;
    }

    const dateExists = blockedDates.some(d => d.date === newBlockedDate);
    if (dateExists) {
      alert('Esta data já está bloqueada.');
      return;
    }

    onChange([
      ...blockedDates,
      {
        date: newBlockedDate,
        reason: blockReason || 'Sem especificação',
        id: Date.now().toString()
      }
    ].sort((a, b) => new Date(a.date) - new Date(b.date)));

    setNewBlockedDate('');
    setBlockReason('');
  };

  const handleRemoveBlockedDate = (id) => {
    onChange(blockedDates.filter(d => d.id !== id));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <Calendar className="h-6 w-6 text-red-600" />
        <h2 className="text-xl font-semibold text-gray-900">Datas Bloqueadas</h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Importante:</p>
            <p>
              As datas bloqueadas aqui não estarão disponíveis para agendamento. 
              Use para feriados, férias, manutenção, etc.
            </p>
          </div>
        </div>
      </div>

      {/* Formulário para adicionar nova data bloqueada */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data
            </label>
            <input
              type="date"
              value={newBlockedDate}
              onChange={(e) => setNewBlockedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Motivo (Opcional)
            </label>
            <input
              type="text"
              value={blockReason}
              onChange={(e) => setBlockReason(e.target.value)}
              placeholder="Ex: Feriado Nacional"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handleAddBlockedDate}
              className="w-full flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Bloquear Data
            </button>
          </div>
        </div>
      </div>

      {/* Lista de datas bloqueadas */}
      {blockedDates.length > 0 ? (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-gray-700 mb-3">
            Datas Bloqueadas ({blockedDates.length})
          </h4>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {blockedDates.map(blockedDate => (
              <div
                key={blockedDate.id}
                className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {formatDate(blockedDate.date)}
                  </p>
                  <p className="text-sm text-gray-600">{blockedDate.reason}</p>
                </div>
                <button
                  onClick={() => handleRemoveBlockedDate(blockedDate.id)}
                  className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors flex-shrink-0"
                  aria-label="Remover data bloqueada"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-gray-500">
          <Calendar className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>Nenhuma data bloqueada</p>
        </div>
      )}
    </div>
  );
};

// --- COMPONENTE: MENSAGEM DE CONFIRMAÇÃO ---
const ConfirmationMessageSettings = ({ value, onChange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-4">
      <MessageSquare className="h-6 w-6 text-gray-700" />
      <h2 className="text-xl font-semibold text-gray-900">Mensagem de Confirmação</h2>
    </div>
    <p className="text-sm text-gray-600 mb-4">
      Personalize a mensagem que o cliente recebe por e-mail após o agendamento ser aprovado.
    </p>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows="4"
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
      placeholder="Ex: Seu agendamento para [SERVIÇO] foi confirmado!"
    />
  </div>
);

// --- COMPONENTE PRINCIPAL: SETTINGS PANEL ---
const SettingsPanel = ({ initialSettings, onSave }) => {
  const [businessHours, setBusinessHours] = useState({
    monday: { enabled: true, open: '09:00', close: '18:00' },
    tuesday: { enabled: true, open: '09:00', close: '18:00' },
    wednesday: { enabled: true, open: '09:00', close: '18:00' },
    thursday: { enabled: true, open: '09:00', close: '18:00' },
    friday: { enabled: true, open: '09:00', close: '18:00' },
    saturday: { enabled: true, open: '09:00', close: '14:00' },
    sunday: { enabled: false, open: '09:00', close: '18:00' }
  });
  const [blockedDates, setBlockedDates] = useState([]);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (initialSettings) {
      setBusinessHours(prev => ({
        ...prev,
        ...(initialSettings.businessHours || {})
      }));
      setBlockedDates(initialSettings.blockedDates || []);
      setConfirmationMessage(initialSettings.confirmationMessage || '');
    }
  }, [initialSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    setSaveMessage('');

    try {
      const success = await onSave({
        businessHours,
        blockedDates,
        confirmationMessage
      });

      if (success) {
        setSaveMessage('Configurações salvas com sucesso!');
        setTimeout(() => setSaveMessage(''), 3000);
      } else {
        setSaveMessage('Erro ao salvar configurações.');
      }
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      setSaveMessage('Erro ao salvar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!initialSettings) {
    return (
      <div className="flex justify-center items-center p-10">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="ml-3 text-gray-600">Carregando configurações...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Horários de Funcionamento */}
      <BusinessHoursSettings value={businessHours} onChange={setBusinessHours} />

      {/* Datas Bloqueadas */}
      <BlockedDatesSettings blockedDates={blockedDates} onChange={setBlockedDates} />

      {/* Mensagem de Confirmação */}
      <ConfirmationMessageSettings value={confirmationMessage} onChange={setConfirmationMessage} />

      {/* Gerenciamento de Usuários Admin */}
      <AdminUsersSettings />

      {/* Botão Salvar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {saveMessage && (
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                saveMessage.includes('sucesso')
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}
            >
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm font-medium">{saveMessage}</span>
            </div>
          )}
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Salvar Alterações
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;