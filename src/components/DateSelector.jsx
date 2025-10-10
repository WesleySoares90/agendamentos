import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DateSelector = ({ onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Formata uma data para o formato 'YYYY-MM-DD'
  const formatDataForForm = (date) => {
    if (!date) return '';
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Gera os dias visíveis no calendário para o mês atual
  const getDaysInMonth = (year, month) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayOfWeek = date.getDay(); // 0 = Domingo, 1 = Segunda, etc.

    // Adiciona dias em branco para o início do mês
    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    // Adiciona os dias do mês
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const calendarDays = getDaysInMonth(year, month);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Função para lidar com a seleção do input[type=date]
  const handleDateInput = (e) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onDateSelect(dateValue);
      // Opcional: ajustar o calendário para o mês selecionado
      const [y, m, d] = dateValue.split('-').map(Number);
      setCurrentDate(new Date(y, m - 1, d));
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isPast = (date) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data
    return date < today;
  };

  return (
    <div className="w-full py-2 bg-white rounded-lg">
      {/* Cabeçalho com Navegação e Seletor de Calendário */}
      <div className="flex items-center justify-between px-2 mb-3">
        <button onClick={handlePrevMonth} className="p-2 rounded-full hover:bg-gray-100">
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        <h3 className="text-sm font-semibold text-gray-800 capitalize">
          {new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(currentDate)}
        </h3>
        <div className="flex items-center gap-2">
          {/* Botão para abrir o seletor de data nativo */}
          <label className="relative cursor-pointer p-2 rounded-full hover:bg-gray-100">
            <Calendar className="h-5 w-5 text-gray-600" />
            <input
              type="date"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleDateInput}
              min={formatDataForForm(new Date())} // Impede a seleção de datas passadas
            />
          </label>
          <button onClick={handleNextMonth} className="p-2 rounded-full hover:bg-gray-100">
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Grid do Calendário */}
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
          const isPastDate = isPast(date);

          return (
            <button
              key={index}
              onClick={() => !isPastDate && onDateSelect(formattedDate)}
              disabled={isPastDate}
              className={`h-9 w-9 rounded-full transition-colors duration-200 flex items-center justify-center
                ${isPastDate ? 'text-gray-300 cursor-not-allowed' : 'hover:bg-gray-100'}
                ${isSelected ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-transparent'}
                ${isToday(date) && !isSelected ? 'border border-blue-500' : ''}
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
