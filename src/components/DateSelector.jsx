import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

const DateSelector = ({ onDateSelect, selectedDate, availableSlots }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Função simplificada - só bloqueia datas passadas
  const isWorkingDay = (date) => {
    if (!date) return true;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Bloqueia apenas datas passadas
    return date >= today;
  };

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

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="w-full py-2 bg-white rounded-lg">
      {/* Cabeçalho do calendário */}
      <div className="flex items-center justify-between px-2 mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Mês anterior"
        >
          <ChevronLeft className="h-5 w-5 text-gray-600" />
        </button>
        
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-600" />
          <span className="font-semibold text-gray-900">
            {monthNames[month]} {year}
          </span>
        </div>
        
        <button
          onClick={handleNextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="Próximo mês"
        >
          <ChevronRight className="h-5 w-5 text-gray-600" />
        </button>
      </div>

      {/* Grid do calendário */}
      <div className="grid grid-cols-7 gap-1 px-2 text-center text-xs">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="font-medium text-gray-500 py-2">{day}</div>
        ))}
        
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9 w-9"></div>;
          }

          const formattedDate = formatDataForForm(date);
          const isSelected = formattedDate === selectedDate;
          const isPastDate = isPast(date);
          const isDisabled = isPastDate;

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onDateSelect(formattedDate)}
              disabled={isDisabled}
              className={`h-9 w-9 rounded-full transition-colors duration-200 flex items-center justify-center text-sm
                ${isDisabled 
                  ? 'text-gray-300 cursor-not-allowed' 
                  : 'hover:bg-gray-100 text-gray-700'
                }
                ${isSelected 
                  ? 'bg-gray-900 text-white hover:bg-gray-800 font-semibold' 
                  : 'bg-transparent'
                }
                ${isToday(date) && !isSelected && !isDisabled 
                  ? 'border-2 border-blue-500 font-semibold' 
                  : ''
                }
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