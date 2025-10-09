// src/components/SettingsPanel.js

import React, { useState, useEffect } from 'react';
import { Clock, MessageSquare, Save, Loader2 } from 'lucide-react';

// Importe o componente que estava faltando!
import AdminUsersSettings from './AdminUsersSettings'; 

// --- COMPONENTES INTERNOS PARA ORGANIZAÇÃO ---

const BusinessHoursSettings = ({ value, onChange }) => {
  // ... (o código deste componente está correto, não precisa mudar)
  const daysOfWeek = ['seg', 'ter', 'qua', 'qui', 'sex', 'sab', 'dom'];
  const dayLabels = { seg: 'Segunda', ter: 'Terça', qua: 'Quarta', qui: 'Quinta', sex: 'Sexta', sab: 'Sábado', dom: 'Domingo' };

  const handleToggleDay = (dayKey) => {
    onChange({ ...value, [dayKey]: { ...value[dayKey], active: !value[dayKey].active } });
  };

  const handleTimeChange = (dayKey, type, time) => {
    onChange({ ...value, [dayKey]: { ...value[dayKey], [type]: time } });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4"><Clock className="h-6 w-6 text-gray-700" /><h2 className="text-xl font-semibold text-gray-900">Horário de Funcionamento</h2></div>
      <p className="text-sm text-gray-600 mb-4">Defina os dias e horários em que o estabelecimento está aberto.</p>
      <div className="space-y-4">
        {daysOfWeek.map(day => (
          <div key={day} className="grid grid-cols-3 items-center gap-4 p-3 rounded-lg bg-gray-50">
            <div className="flex items-center gap-3"><input type="checkbox" checked={value[day]?.active || false} onChange={() => handleToggleDay(day)} className="h-5 w-5 rounded text-blue-600 focus:ring-blue-500" /><span className="font-medium text-gray-800">{dayLabels[day]}</span></div>
            <div className={`col-span-2 grid grid-cols-2 gap-2 transition-opacity ${value[day]?.active ? 'opacity-100' : 'opacity-40'}`}>
              <input type="time" value={value[day]?.start || '09:00'} onChange={(e) => handleTimeChange(day, 'start', e.target.value)} disabled={!value[day]?.active} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              <input type="time" value={value[day]?.end || '18:00'} onChange={(e) => handleTimeChange(day, 'end', e.target.value)} disabled={!value[day]?.active} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const ConfirmationMessageSettings = ({ value, onChange }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
    <div className="flex items-center gap-3 mb-4"><MessageSquare className="h-6 w-6 text-gray-700" /><h2 className="text-xl font-semibold text-gray-900">Mensagem de Confirmação</h2></div>
    <p className="text-sm text-gray-600 mb-4">Personalize a mensagem que o cliente recebe por e-mail após o agendamento ser aprovado.</p>
    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows="4" className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="Ex: Seu agendamento para [SERVIÇO] foi confirmado!" />
  </div>
);


// --- COMPONENTE PRINCIPAL DO PAINEL ---

const SettingsPanel = ({ initialSettings, onSave }) => {
  const [workingHours, setWorkingHours] = useState({});
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setWorkingHours(initialSettings.workingHours || {});
      setConfirmationMessage(initialSettings.confirmationMessage || '');
    }
  }, [initialSettings]);

  const handleSave = async () => {
    setIsLoading(true);
    const success = await onSave({
      workingHours,
      confirmationMessage,
    });
    if (success) {
      alert('Configurações salvas com sucesso!');
    } else {
      alert('Ocorreu um erro ao salvar. Tente novamente.');
    }
    setIsLoading(false);
  };

  if (!initialSettings) {
    return (
      <div className="flex justify-center items-center p-10"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /><p className="ml-3 text-gray-600">Carregando configurações...</p></div>
    );
  }

  return (
    <div className="space-y-8">
      <BusinessHoursSettings value={workingHours} onChange={setWorkingHours} />
      <ConfirmationMessageSettings value={confirmationMessage} onChange={setConfirmationMessage} />
      
      {/* ADICIONE O COMPONENTE DE VOLTA AQUI */}
      <AdminUsersSettings />

      <div className="flex justify-end">
        <button onClick={handleSave} disabled={isLoading} className="bg-green-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 font-semibold disabled:opacity-50 disabled:cursor-wait">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
          {isLoading ? 'Salvando...' : 'Salvar Alterações'}
        </button>
      </div>
    </div>
  );
};

export default SettingsPanel;
