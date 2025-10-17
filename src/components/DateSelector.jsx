import React, { useState, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { appointmentService } from '../services/appointmentService';

const DateSelector = ({ onDateSelect, selectedDate }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [settings, setSettings] = useState(null);

  // Busca as configurações ao montar o componente
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const settingsData = await appointmentService.getSettings();
        setSettings(settingsData);
      } catch (error) {
        console.error('Erro ao buscar configurações:', error);
      }
    };
    fetchSettings();
  }, []);

  // Verifica se a data está bloqueada nas configurações
  const isDateBlocked = (date) => {
    if (!date || !settings?.blockedDates) return false;

    const dateStr = formatDataForForm(date);
    return settings.blockedDates.some(blocked => blocked.date === dateStr);
  };

  // Verifica se é dia de funcionamento do estabelecimento
  const isBusinessDay = (date) => {
    if (!date || !settings?.businessHours) return true;

    const daysMap = {
      0: 'sunday',
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
      6: 'saturday'
    };

    const dayOfWeek = daysMap[date.getDay()];
    return settings.businessHours[dayOfWeek]?.enabled ?? true;
  };

  // Função que valida se o dia está disponível para agendamento
  const isWorkingDay = (date) => {
    if (!date) return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Bloqueia datas passadas
    if (date < today) return false;

    // Bloqueia datas bloqueadas manualmente (feriados, férias)
    if (isDateBlocked(date)) return false;

    // Bloqueia dias que o estabelecimento não funciona
    if (!isBusinessDay(date)) return false;

    return true;
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

  // Obtém o motivo do bloqueio (se houver)
  const getBlockReason = (date) => {
    if (!date || !settings?.blockedDates) return null;

    const dateStr = formatDataForForm(date);
    const blocked = settings.blockedDates.find(b => b.date === dateStr);
    return blocked?.reason || null;
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

      {/* Legenda */}
      <div className="px-2 mb-3 flex flex-wrap gap-2 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-900"></div>
          <span className="text-gray-600">Selecionado</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full border-2 border-blue-500"></div>
          <span className="text-gray-600">Hoje</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded-full bg-gray-200"></div>
          <span className="text-gray-600">Indisponível</span>
        </div>
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
          const isAvailable = isWorkingDay(date);
          const blockReason = getBlockReason(date);

          // ❌ Oculta completamente se o dia for bloqueado
          if (!isAvailable) {
            return (
              <div
                key={`blocked-${index}`}
                className="h-9 w-9 text-gray-300 bg-gray-50 rounded-full flex items-center justify-center cursor-not-allowed"
                title={blockReason || 'Indisponível'}
              >
                {date.getDate()}
              </div>
            );
          }

          // ✅ Exibe normalmente se disponível
          return (
            <div key={index} className="relative group">
              <button
                onClick={() => onDateSelect(formattedDate)}
                className={`h-9 w-9 rounded-full transition-colors duration-200 flex items-center justify-center text-sm
          ${isSelected
                    ? 'bg-gray-900 text-white hover:bg-gray-800 font-semibold'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
          ${isToday(date) && !isSelected ? 'border-2 border-blue-500 font-semibold' : ''}
        `}
              >
                {date.getDate()}
              </button>
            </div>
          );
        })}
      </div>

      {/* Informação adicional */}
      {settings?.blockedDates?.length > 0 && (
        <div className="mt-3 px-2 text-xs text-gray-500 text-center">
          {settings.blockedDates.length} data(s) bloqueada(s) neste período
        </div>
      )}
    </div>
  );
};

export default DateSelector;