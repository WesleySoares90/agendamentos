import React, { useState, useEffect, useRef } from 'react';
import { Send, Eye, Edit, ArrowLeft, Menu, X, Clock, DollarSign, Calendar } from 'lucide-react';
import { SERVICES, TIME_SLOTS } from '../utils/constants';
import { useAppointments } from '../hooks/useAppointments';
import { appointmentService } from '../services/appointmentService';
import DateSelector from './DateSelector';

import bgImage from '../img/salao-ipanema-1024x576.jpg.webp';

const ChatBookingForm = ({ onSubmit, loading, editingAppointment = null }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState('welcome');
  const [viewMode, setViewMode] = useState('chat');
  const [userEmail, setUserEmail] = useState('');
  const [userAppointments, setUserAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: editingAppointment?.name || '',
    email: editingAppointment?.email || '',
    phone: editingAppointment?.phone || '',
    service: editingAppointment?.service || '',
    date: editingAppointment?.date || '',
    time: editingAppointment?.time || ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const hasSentWelcome = useRef(false);

  const { appointments, fetchAppointments } = useAppointments();

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const getUserAppointments = (email) => appointments.filter(a => a.email?.toLowerCase() === email?.toLowerCase());

  const checkAvailableSlots = async (selectedDate) => {
    if (!selectedDate) return;

    try {
      const dayAppointments = appointments.filter(apt =>
        apt.date === selectedDate &&
        apt.status !== 'cancelled'
      );

      const slotsStatus = TIME_SLOTS.map(time => {
        const conflictingAppointments = dayAppointments.filter(apt => apt.time === time);
        return {
          time,
          available: conflictingAppointments.length === 0,
          count: conflictingAppointments.length
        };
      });

      setAvailableSlots(slotsStatus);
      return slotsStatus;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return TIME_SLOTS.map(time => ({ time, available: true, count: 0 }));
    }
  };

  useEffect(() => {
    if (hasSentWelcome.current || editingAppointment) return;
    hasSentWelcome.current = true;
    setTimeout(() => {
      addBotMessage("Olá! Eu sou a assistente virtual da empresa X e cuido dos agendamentos de serviços.");
      setTimeout(() => addBotMessage("Qual o seu nome? Por favor, escreva seu nome e sobrenome."), 1000);
    }, 500);
  }, []);

  useEffect(() => {
    if (!editingAppointment) return;
    hasSentWelcome.current = true;
    setCurrentStep('confirmation');
    const selectedService = SERVICES.find(s => s.id === editingAppointment.service);
    const confirmationText = `\nVocê está editando seu agendamento:\n\n👤 Nome: ${editingAppointment.name}\n📧 E-mail: ${editingAppointment.email}\n📱 Telefone: ${editingAppointment.phone}\n✂️ Serviço: ${selectedService?.name}\n💰 Valor: R$ ${selectedService?.price}\n📅 Data: ${editingAppointment.date.split('-').reverse().join('/')}\n🕐 Horário: ${editingAppointment.time}\n\nDigite "ALTERAR" para modificar ou "SIM" para confirmar.\n`;
    setTimeout(() => addBotMessage(confirmationText), 500);
  }, [editingAppointment]);

  const addBotMessage = (text, options = null, isSystem = false) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text, options, isSystem }]);
      setIsTyping(false);
    }, 800);
  };

  const addUserMessage = (text) => setMessages(prev => [...prev, { type: 'user', text }]);

  const validateEmail = (email) => /\S+@\S+\.\S+/.test(email);
  const validatePhone = (phone) => phone.replace(/\D/g, '').length >= 10;

  const handleSend = () => {
    if (!currentInput.trim()) return;
    addUserMessage(currentInput);
    processUserInput(currentInput);
    setCurrentInput('');
  };

  const handleOptionClick = (value) => {
    if (value === 'ver_servicos') {
      addUserMessage('Ver Serviços');
      setViewMode('services');
      return;
    }

    if (value === 'fazer_reserva') {
      addUserMessage('Fazer Reserva');
      setCurrentStep('email');
      setTimeout(() => addBotMessage(`Perfeito, ${formData.name}! Agora preciso do seu e-mail.`), 500);
      return;
    }

    const selectedService = SERVICES.find(s => s.id === value);
    addUserMessage(selectedService?.name || value);
    processUserInput(value);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSend(); };

  // Função para formatar o telefone
  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    }
    if (phoneNumberLength < 11) {
      return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
    }
    return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`;
  };

  const handlePhoneChange = (e) => {
    const formattedPhoneNumber = formatPhoneNumber(e.target.value);
    setCurrentInput(formattedPhoneNumber);
    setFormData(prev => ({ ...prev, phone: formattedPhoneNumber.replace(/[^\d]/g, '') }));
  };

  const processUserInput = async (input) => {
    switch (currentStep) {
      case 'welcome':
        setFormData(prev => ({ ...prev, name: input }));
        setCurrentStep('choose_action');
        setTimeout(() => {
          const actionOptions = [
            { value: 'ver_servicos', name: 'Ver Serviços' },
            { value: 'fazer_reserva', name: 'Fazer Reserva' }
          ];
          addBotMessage(`Prazer em conhecê-lo, ${input}! O que você gostaria de fazer?`, actionOptions);
        }, 500);
        break;

      case 'email':
        if (!validateEmail(input)) {
          addBotMessage("Digite um e-mail válido.", null, true);
          return;
        }
        setFormData(prev => ({ ...prev, email: input }));
        setUserEmail(input);
        // Próximo passo: pedir telefone
        setCurrentStep('phone');
        addBotMessage("Ótimo! Agora, digite seu telefone com DDD (exemplo: 11999999999)");
        break;

      case 'phone':
        if (!validatePhone(input)) {
          addBotMessage("Digite um telefone válido com DDD.", null, true);
          return;
        }
        setFormData(prev => ({ ...prev, phone: input }));

        if (formData.service) {
          // Serviço já selecionado → pula para data
          setCurrentStep('date');
          addBotMessage("Agora, escolha a data desejada:");
        } else {
          // Serviço ainda não selecionado → pede serviço
          setCurrentStep('service');
          setTimeout(() => {
            const serviceOptions = SERVICES.map(s => ({
              value: s.id,
              name: s.name,
              price: s.price,
              duration: s.duration
            }));
            addBotMessage("Agora, escolha o serviço desejado:", serviceOptions);
          }, 500);
        }
        break;

      case 'service':
        const selectedService = SERVICES.find(s => s.id === input);
        if (!selectedService) {
          addBotMessage("Selecione um serviço válido.", null, true);
          return;
        }
        setFormData(prev => ({ ...prev, service: input }));
        setCurrentStep('date');
        addBotMessage(`Você selecionou: ${selectedService.name}. Agora, escolha a data desejada.`);
        break;


      case 'date':
        if (!input) return;
        setFormData(prev => ({ ...prev, date: input }));
        setCurrentStep('time');

        const slotsStatus = await checkAvailableSlots(input);

        break;

      case 'time':
        // Valida se o horário escolhido existe
        if (!TIME_SLOTS.includes(input)) {
          addBotMessage("Escolha um horário disponível.", null, true);
          return;
        }

        // Salva o horário
        setFormData(prev => ({ ...prev, time: input }));
        setCurrentStep('confirmation');

        // Busca infos do serviço selecionado
        const serviceInfo = SERVICES.find(s => s.id === formData.service);

        // Mostra a tela de confirmação
        setTimeout(() => {
          addBotMessage(
            `\nConfirme seus dados:\n\n👤 Nome: ${formData.name}\n📧 E-mail: ${formData.email}\n📱 Telefone: ${formatPhoneNumber(formData.phone)}\n✂️ Serviço: ${serviceInfo?.name}\n💰 Valor: R$ ${serviceInfo?.price}\n📅 Data: ${formData.date.split('-').reverse().join('/')}\n🕐 Horário: ${input}\n\nDigite "SIM" para confirmar ou "ALTERAR" para modificar.\n`
          );
        }, 500);
        break;


      case 'confirmation':
        if (input.toLowerCase() === 'sim') return handleFinalSubmit();
        if (input.toLowerCase() === 'alterar') {
          setCurrentStep('welcome');
          setFormData({ name: '', email: '', phone: '', service: '', date: '', time: '' });
          setMessages([]);
          hasSentWelcome.current = false;
          return setTimeout(() => addBotMessage("Vamos recomeçar. Qual o seu nome?"), 500);
        }
        addBotMessage("Digite 'SIM' para confirmar ou 'ALTERAR' para modificar.", null, true);
        break;
    }
  };

  const handleFinalSubmit = async () => {
    const finalCheck = await appointmentService.checkTimeConflict(
      formData.date,
      formData.time,
      editingAppointment?.id
    );

    if (finalCheck) {
      addBotMessage("Ops! Este horário acabou de ser reservado. Escolha outro horário.", null, true);
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      setCurrentStep('completed');
      addBotMessage("🎉 Agendamento realizado com sucesso!");
    } else {
      addBotMessage("Ocorreu um erro ao processar seu agendamento. Tente novamente.", null, true);
    }
  };

  const handleCheckReservations = () => {
    const reservations = getUserAppointments(userEmail || formData.email);
    setUserAppointments(reservations);
    setViewMode('reservations');
    setIsMobileMenuOpen(false);
  };

  const handleBackToChat = () => {
    setViewMode('chat');
    setIsMobileMenuOpen(false);
  };

  const handleEditAppointment = (appointment) => {
    const today = new Date();
    const createdDate = new Date(appointment.createdAt);
    const isToday = today.toDateString() === createdDate.toDateString();

    if (!isToday) {
      addBotMessage("Desculpe, você só pode alterar reservas no mesmo dia em que foram feitas.", null, true);
      return;
    }

    setFormData(appointment);
    setCurrentStep('confirmation');
    setMessages([]);
    hasSentWelcome.current = true;
    setViewMode('chat');
    const selectedService = SERVICES.find(s => s.id === appointment.service);
    addBotMessage(`\nVocê está editando seu agendamento:\n\n👤 Nome: ${appointment.name}\n📧 E-mail: ${appointment.email}\n📱 Telefone: ${appointment.phone}\n✂️ Serviço: ${selectedService?.name}\n💰 Valor: R$ ${selectedService?.price}\n📅 Data: ${appointment.date.split('-').reverse().join('/')}\n🕐 Horário: ${appointment.time}\n\nDigite "ALTERAR" para modificar ou "SIM" para confirmar.\n`);
  };

  const handleServiceSelect = (serviceId) => {
    setFormData(prev => ({ ...prev, service: serviceId }));
    setViewMode('chat');
    setCurrentStep('email');
    setMessages([]);
    hasSentWelcome.current = true;

    const selectedService = SERVICES.find(s => s.id === serviceId);
    addBotMessage(`Você selecionou: ${selectedService.name}. Agora, preciso do seu e-mail para continuar o agendamento.`);
  };

  // Header Component
  const Header = ({ title, showBackButton = false }) => (
    <div className="bg-white border-b border-gray-200 p-4 md:p-6 rounded-t-lg flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={handleBackToChat}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <h1 className="text-lg md:text-xl font-semibold text-gray-900 truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Desktop buttons */}
        <div className="hidden md:flex gap-2">
          {viewMode === 'chat' && (
            <button
              onClick={handleCheckReservations}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <Eye className="h-4 w-4" /> Ver Reservas
            </button>
          )}
          {viewMode !== 'chat' && (
            <button
              onClick={handleBackToChat}
              className="bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              Voltar
            </button>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

  // Mobile Menu Component
  const MobileMenu = () => (
    <div className={`md:hidden bg-white border-b border-gray-200 transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
      <div className="p-4 space-y-2">
        {viewMode === 'chat' && (
          <button
            onClick={handleCheckReservations}
            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Eye className="h-4 w-4" /> Ver Reservas
          </button>
        )}
        {viewMode !== 'chat' && (
          <button
            onClick={handleBackToChat}
            className="w-full bg-gray-900 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          >
            Voltar
          </button>
        )}
      </div>
    </div>
  );

  // Service Card Component
  const ServiceCard = ({ service, onSelect }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
            {service.name}
          </h3>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-600 text-xl">✨</div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{service.duration} minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-gray-600" />
            <span className="text-xl font-bold text-gray-900">R$ {service.price}</span>
          </div>
        </div>

        <button
          onClick={() => onSelect(service.id)}
          className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors font-medium"
        >
          Agendar Serviço
        </button>
      </div>
    </div>
  );

  // Time Slot Card Component
  const TimeSlotCard = ({ slot, onSelect, isSelected }) => (
    <button
      onClick={() => onSelect(slot.time)}
      disabled={!slot.available}
      className={`p-4 rounded-lg border transition-all duration-200 ${isSelected
        ? 'bg-gray-900 text-white border-gray-900'
        : slot.available
          ? 'bg-white text-gray-900 border-gray-200 hover:border-gray-300 hover:shadow-sm'
          : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
        }`}
    >
      <div className="text-center">
        <div className="font-semibold">{slot.time}</div>
        {!slot.available && (
          <div className="text-xs mt-1">Ocupado</div>
        )}
      </div>
    </button>
  );

  const renderServices = () => (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      <Header title="Nossos Serviços" showBackButton={true} />
      <MobileMenu />

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {SERVICES.map(service => (
            <ServiceCard
              key={service.id}
              service={service}
              onSelect={handleServiceSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderReservations = () => (
    <div className="w-full max-w-4xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      <Header title="Minhas Reservas" showBackButton={true} />
      <MobileMenu />

      <div className="p-4 md:p-6">
        {userAppointments.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500 text-lg">Você não possui agendamentos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userAppointments.map(a => {
              const service = SERVICES.find(s => s.id === a.service);
              return (
                <div key={a.id} className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-all duration-300">
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{service?.name}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4" />
                          <span>{a.date.split('-').reverse().join('/')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{a.time}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <DollarSign className="h-4 w-4" />
                          <span className="font-semibold">R$ {service?.price}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{service?.duration}min</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleEditAppointment(a)}
                      className="w-full lg:w-auto bg-gray-900 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-800 transition-colors font-medium"
                    >
                      <Edit className="h-4 w-4" /> Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  if (viewMode === 'reservations') return (
    <div className="min-h-screen p-2 md:p-4 bg-gray-50 flex items-center justify-center">
      {renderReservations()}
    </div>
  );

  if (viewMode === 'services') return (
    <div className="min-h-screen p-2 md:p-4 bg-gray-50 flex items-center justify-center">
      {renderServices()}
    </div>
  );

  return (
    <div
      className="fixed inset-0 p-2 md:p-4 bg-cover bg-center bg-no-repeat flex items-center justify-center overflow-auto z-40"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg h-[80vh] max-h-[650px] flex flex-col overflow-hidden">
        <Header title="Agendamento" />
        <MobileMenu />

        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm ${m.type === 'user'
                ? 'bg-gray-900 text-white rounded-br-md'
                : m.isSystem
                  ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-md'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                }`}>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">{m.text}</p>
                {m.options && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {m.options.map((option, optIdx) => (
                      <button
                        key={optIdx}
                        onClick={() => handleOptionClick(option.value)}
                        className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${option.available === false
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                          : 'bg-gray-900 hover:bg-gray-800 text-white'
                          }`}
                        disabled={option.available === false}
                      >
                        {option.label || option.name} {option.count > 0 && `(${option.count})`}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {/* Render DateSelector outside of messages.map when currentStep is 'date' */}
          {currentStep === 'date' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm bg-white text-gray-900 border border-gray-200 rounded-bl-md">
                <p className="text-sm md:text-base leading-relaxed mb-4">Escolha a data desejada:</p>
                <DateSelector
                  selectedDate={formData.date}
                  onDateSelect={(date) => processUserInput(date)}
                  availableSlots={availableSlots}
                />
              </div>
            </div>
          )}
          {/* Render Time Slots outside of messages.map when currentStep is 'time' */}
          {currentStep === 'time' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm bg-white text-gray-900 border border-gray-200 rounded-bl-md">
                <p className="text-sm md:text-base leading-relaxed mb-4">Escolha o horário disponível:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot, slotIdx) => (
                    <TimeSlotCard
                      key={slotIdx}
                      slot={slot}
                      onSelect={(time) => processUserInput(time)}
                      isSelected={formData.time === slot.time}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 text-gray-900 p-3 md:p-4 rounded-2xl rounded-bl-md max-w-[85%] md:max-w-[75%] shadow-sm">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-sm md:text-base">Digitando...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 md:p-4 border-t border-gray-200 bg-white">
          <div className="flex items-center gap-2 md:gap-3">
            <input
              type={currentStep === 'phone' ? 'tel' : 'text'}
              className="flex-1 p-3 md:p-4 rounded-xl bg-gray-50 text-gray-900 border border-gray-200 focus:outline-none focus:border-gray-900 focus:ring-2 focus:ring-gray-900 focus:ring-opacity-10 transition-all duration-200 text-sm md:text-base"
              placeholder={currentStep === 'phone' ? 'Seu telefone com DDD' : 'Digite sua mensagem...'}
              value={currentInput}
              onChange={currentStep === 'phone'
                ? handlePhoneChange
                : (e) => setCurrentInput(e.target.value)
              }
              onKeyPress={handleKeyPress}
            />

            <button
              onClick={handleSend}
              className="bg-gray-900 text-white p-3 md:p-4 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || currentStep === 'date' || currentStep === 'time' || !currentInput.trim()}
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBookingForm;
