import React from 'react';

const DateSelector = ({ onDateSelect }) => {
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
    return (
      <div className="text-center">
        <div className="text-xs sm:text-sm font-semibold uppercase">{dayName}</div>
        <div className="text-2xl sm:text-xl font-bold mt-1">{dayNumber}</div>
      </div>
    );
  };

  const formatDataForForm = (date) => {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return (
    <div className="w-full pb-2">
      <div className="flex flex-wrap justify-center gap-2">
        {dates.map((date, index) => (
          <button
            key={index}
            onClick={() => onDateSelect(formatDataForForm(date))}
            className="w-24 p-3 bg-gray-700 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={`Selecionar data ${new Intl.DateTimeFormat("pt-BR", { weekday: "short" }).format(date)}, ${date.getDate()}`}
          >
            {formatDateCard(date)}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DateSelector;