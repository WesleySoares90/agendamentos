import React from 'react';

const DateSelector = ({ onDateSelect, selectedDate, availableSlots = [] }) => {
  const getNext7Days = () => {
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const dates = getNext7Days();

  const formatDateCard = (date) => {
    const dayName = new Intl.DateTimeFormat('pt-BR', { weekday: 'short' }).format(date);
    const dayNumber = date.getDate();
    const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'short' }).format(date);
    
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className="text-xs font-medium uppercase text-gray-500 mb-1">{dayName}</div>
        <div className="text-xl font-bold text-gray-900 mb-1">{dayNumber}</div>
        <div className="text-xs text-gray-500">{monthName}</div>
      </div>
    );
  };

  const formatDataForForm = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const isDateAvailable = (date) => {
    const formattedDate = formatDataForForm(date);
    // Se não há slots disponíveis, considerar como disponível
    if (!availableSlots || availableSlots.length === 0) return true;
    // Verificar se há pelo menos um slot disponível para esta data
    return availableSlots.some(slot => slot.available);
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  return (
    <div className="w-full py-3">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2">
        {dates.map((date, index) => {
          const formattedDate = formatDataForForm(date);
          const isSelected = formattedDate === selectedDate;
          const isAvailable = isDateAvailable(date);
          const isTodayDate = isToday(date);

          return (
            <button
              key={index}
              onClick={() => isAvailable && onDateSelect(formattedDate)}
              className={`relative flex flex-col items-center justify-center p-3 h-20 rounded-lg border transition-all duration-200 ${
                isSelected
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md'
                  : isAvailable
                  ? 'bg-white text-gray-900 border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
              }`}
              aria-label={`Selecionar data ${new Intl.DateTimeFormat("pt-BR", { 
                weekday: "long", 
                day: "numeric", 
                month: "long" 
              }).format(date)}`}
              disabled={!isAvailable}
            >
              {isTodayDate && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full"></div>
              )}
              {formatDateCard(date)}
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-0.5 h-full bg-gray-300 transform rotate-45"></div>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Hoje</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-900 rounded"></div>
          <span>Selecionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-gray-200 rounded relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-0.5 h-full bg-gray-400 transform rotate-45"></div>
            </div>
          </div>
          <span>Indisponível</span>
        </div>
      </div>
    </div>
  );
};

export default DateSelector;
