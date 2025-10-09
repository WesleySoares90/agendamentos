// src/components/DateSelector.js

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DateSelector = ({ onDateSelect, selectedDate, workingHours }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Mapeia o getDay() do JS (Dom=0) para as chaves do seu objeto de configuração
  const dayKeys = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];

  const isWorkingDay = (date) => {
    if (!date || !workingHours) {
      return false; // Por segurança, se as configurações não carregaram, desabilita tudo.
    }
    const dayOfWeek = date.getDay();
    const dayKey = dayKeys[dayOfWeek];
    return workingHours[dayKey]?.active || false;
  };

  // ... (outras funções como formatDataForForm, getDaysInMonth, etc. permanecem iguais)
  const formatDataForForm = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayOfWeek = date.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = getDaysInMonth(year, month);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const handleDateInput = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onDateSelect(dateValue);
      const [y, m, d] = dateValue.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, d));
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    return date.toDateString() === new Date().toDateString();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  return (
    <div className="w-full py-2 bg-white rounded-lg">
      {/* ... (cabeçalho do calendário - sem alterações) */}
      <div className="flex items-center justify-between px-2 mb-3">
        {/* ... */}
      </div>

      <div className="grid grid-cols-7 gap-1 px-2 text-center text-xs">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="font-medium text-gray-500">{day}</div>
        ))}
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9 w-9"></div>;
          }

          const formattedDate = formatDataForForm(date);
          const isSelected = formattedDate === selectedDate;
          
          // --- LÓGICA DE DESABILITAÇÃO CORRIGIDA ---
          const isPastDate = isPast(date);
          const isDayOff = !isWorkingDay(date); // Verifica se é um dia de folga
          const isDisabled = isPastDate || isDayOff;

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onDateSelect(formattedDate)}
              disabled={isDisabled}
              className={`h-9 w-9 rounded-full transition-colors duration-200 flex items-center justify-center
                ${isDisabled ? 'text-gray-300 cursor-not-allowed line-through' : 'hover:bg-gray-100'}
                ${isSelected ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-transparent'}
                ${isToday(date) && !isSelected && !isDisabled ? 'border border-blue-500' : ''}
              `}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default DateSelector;
