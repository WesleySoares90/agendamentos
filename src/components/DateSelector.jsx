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
        <div className="text-xs font-semibold uppercase">{dayName}</div>
        <div className="text-2xl font-bold mt-1">{dayNumber}</div>
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
    <div className="flex justify-between space-x-2 overflow-x-auto pb-2">
      {dates.map((date, index) => (
        <button
          key={index}
          onClick={() => onDateSelect(formatDataForForm(date))}
          className="flex-1 min-w-[80px] p-3 bg-gray-700 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {formatDateCard(date)}
        </button>
      ))}
    </div>
  );
};

export default DateSelector;
