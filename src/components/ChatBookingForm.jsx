import React, { useState, useEffect, useRef } from 'react';
import { Send, Eye, Edit } from 'lucide-react';
import { SERVICES, TIME_SLOTS } from '../utils/constants';
import { useAppointments } from '../hooks/useAppointments';
import { appointmentService } from '../services/appointmentService';
import DateSelector from './DateSelector'; // Importação do novo componente

import bgImage from '../img/salao-ipanema-1024x576.jpg.webp';

const ChatBookingForm = ({ onSubmit, loading, editingAppointment = null }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [currentStep, setCurrentStep] = useState('welcome');
  const [viewMode, setViewMode] = useState('chat');
  const [userEmail, setUserEmail] = useState('');
  const [userAppointments, setUserAppointments] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
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

  const addBotMessage = (text, options = null) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text, options }]);
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
        if (!validateEmail(input)) return addBotMessage("Digite um e-mail válido.");
        setFormData(prev => ({ ...prev, email: input }));
        setUserEmail(input);
        // Se o serviço já foi selecionado via grid, pular para 'date'
        if (formData.service) {
          setCurrentStep('date');
          const selectedService = SERVICES.find(s => s.id === formData.service);
          setTimeout(() => addBotMessage(`Você selecionou: ${selectedService.name}. Agora, escolha a data desejada.`), 500);
        } else {
          setCurrentStep('phone');
          setTimeout(() => addBotMessage("Digite seu telefone com DDD (exemplo: 11999999999)"), 500);
        }
        break;

      case 'phone':
        if (!validatePhone(input)) return addBotMessage("Digite um telefone válido com DDD.");
        setFormData(prev => ({ ...prev, phone: input }));
        setCurrentStep('service');
        setTimeout(() => {
          const serviceOptions = SERVICES.map(s => ({ value: s.id, name: s.name, price: s.price, duration: s.duration }));
          addBotMessage("Escolha o serviço desejado:", serviceOptions);
        }, 500);
        break;

      case 'service':
        const selectedService = SERVICES.find(s => s.id === input);
        if (!selectedService) return addBotMessage("Selecione um serviço válido.");
        setFormData(prev => ({ ...prev, service: input }));
        setCurrentStep('date');
        setTimeout(() => addBotMessage(`Você selecionou: ${selectedService.name}. Agora, escolha a data desejada.`), 500);
        break;

      case 'date':
        if (!input) return;
        setFormData(prev => ({ ...prev, date: input }));
        setCurrentStep('time');
        
        const slotsStatus = await checkAvailableSlots(input);
        
        setTimeout(() => {
          const timeOptions = slotsStatus.map(slot => ({ 
            value: slot.time, 
            label: slot.time, 
            available: slot.available,
            count: slot.count
          }));
          addBotMessage("Escolha o horário disponível:", timeOptions);
        }, 500);
        break;

      case 'time':
        if (!TIME_SLOTS.includes(input)) return addBotMessage("Escolha um horário disponível.");
        
        const slotInfo = availableSlots.find(slot => slot.time === input);
        if (slotInfo && !slotInfo.available) {
          return addBotMessage("Este horário não está mais disponível. Escolha outro horário.");
        }
        
        setFormData(prev => ({ ...prev, time: input }));
        setCurrentStep('confirmation');
        const serviceInfo = SERVICES.find(s => s.id === formData.service);
        setTimeout(() => {
          addBotMessage(`\nConfirme seus dados:\n\n👤 Nome: ${formData.name}\n📧 E-mail: ${formData.email}\n📱 Telefone: ${formatPhoneNumber(formData.phone)}\n✂️ Serviço: ${serviceInfo?.name}\n💰 Valor: R$ ${serviceInfo?.price}\n📅 Data: ${formData.date.split('-').reverse().join('/')}\n🕐 Horário: ${formData.time}\n\nDigite "SIM" para confirmar ou "ALTERAR" para modificar.\n`);
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
        addBotMessage("Digite 'SIM' para confirmar ou 'ALTERAR' para modificar.");
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
      return addBotMessage("Ops! Este horário acabou de ser reservado. Escolha outro horário.");
    }
    
    const result = await onSubmit(formData);
    if (result.success) {
      setCurrentStep('completed');
      addBotMessage("🎉 Agendamento realizado com sucesso!");
    } else {
      addBotMessage("Ocorreu um erro ao processar seu agendamento. Tente novamente.");
    }
  };

  const handleCheckReservations = () => {
    const reservations = getUserAppointments(userEmail || formData.email);
    setUserAppointments(reservations);
    setViewMode('reservations');
  };

  const handleBackToChat = () => setViewMode('chat');

  const handleEditAppointment = (appointment) => {
    // Verificar se o agendamento foi criado hoje
    const today = new Date();
    const createdDate = new Date(appointment.createdAt);
    
    // Comparar apenas a data (ignorar horário)
    const isToday = today.toDateString() === createdDate.toDateString();
    
    if (!isToday) {
      addBotMessage("Desculpe, você só pode alterar reservas no mesmo dia em que foram feitas.");
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
    setCurrentStep('email'); // Agora vai para o email
    setMessages([]);
    hasSentWelcome.current = true;
    
    const selectedService = SERVICES.find(s => s.id === serviceId);
    addBotMessage(`Você selecionou: ${selectedService.name}. Agora, preciso do seu e-mail para continuar o agendamento.`);
  };

  const renderServices = () => (
    <div className="max-w-6xl mx-auto bg-gray-900 rounded-lg shadow-lg">
      <div className="bg-gray-800 p-4 rounded-t-lg flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Nossos Serviços</h1>
        <button onClick={handleBackToChat} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Voltar</button>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES.map(service => (
            <div key={service.id} className="bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow">
              <div className="h-48 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <div className="text-white text-6xl">✂️</div>
              </div>
              <div className="p-6">
                <h3 className="text-white font-bold text-xl mb-2">{service.name}</h3>
                <p className="text-gray-300 mb-2">Duração: {service.duration} minutos</p>
                <p className="text-green-400 font-bold text-2xl mb-4">R$ ${service.price}</p>
                <button 
                  onClick={() => handleServiceSelect(service.id)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Reservar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderReservations = () => (
    <div className="max-w-2xl mx-auto bg-gray-900 rounded-lg shadow-lg">
      <div className="bg-gray-800 p-4 rounded-t-lg flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">Minhas Reservas</h1>
        <button onClick={handleBackToChat} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Voltar</button>
      </div>
      <div className="p-6 space-y-4">
        {userAppointments.length === 0 ? (
          <p className="text-gray-400 text-center">Você não possui agendamentos.</p>
        ) : userAppointments.map(a => {
          const service = SERVICES.find(s => s.id === a.service);
          return (
            <div key={a.id} className="bg-gray-800 p-6 rounded-xl shadow-md flex justify-between items-center hover:shadow-lg transition-shadow">
              <div>
                <h3 className="text-white font-bold text-lg">{service?.name}</h3>
                <p className="text-gray-300">📅 ${a.date.split('-').reverse().join('/')}</p>
                <p className="text-gray-300">🕐 ${a.time}</p>
                <p className="text-gray-300 font-semibold">💰 R$ ${service?.price}</p>
              </div>
              <button onClick={() => handleEditAppointment(a)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition-colors">
                <Edit className="h-4 w-4" /> Editar
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (viewMode === 'reservations') return renderReservations();
  if (viewMode === 'services') return renderServices();

  return (
    <div 
      className="flex justify-center items-center min-h-screen p-4 bg-cover bg-center bg-fixed bg-no-repeat"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="max-w-2xl mx-auto bg-gray-900 bg-opacity-90 rounded-lg shadow-lg h-[600px] flex flex-col">
        <div className="bg-gray-800 bg-opacity-90 p-4 rounded-t-lg flex justify-between items-center border-b border-gray-700">
          <h1 className="text-xl font-bold text-white">Agendamento</h1>
          <button onClick={handleCheckReservations} className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600">
            <Eye className="h-4 w-4" /> Ver Reservas
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-xl shadow-md ${m.type === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-white'}`}>
                <p className="text-sm whitespace-pre-line">{m.text}</p>

                {m.options && currentStep === 'choose_action' && (
                  <div className="mt-4 space-y-2">
                    {m.options.map((opt, i) => (
                      <button
                        key={i}
                        onClick={() => handleOptionClick(opt.value)}
                        className="w-full p-3 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors font-semibold"
                      >
                        {opt.name}
                      </button>
                    ))}
                  </div>
                )}

                {m.options && currentStep === 'service' && (
                  <div className="mt-4 space-y-3">
                    {m.options.map((opt, i) => {
                      const service = SERVICES.find(s => s.id === opt.value);
                      return (
                        <div
                          key={i}
                          onClick={() => handleOptionClick(opt.value)}
                          className="flex justify-between items-center p-4 rounded-lg bg-gray-700 text-white cursor-pointer hover:bg-gray-600 transition-colors duration-200"
                        >
                          <div>
                            <span className="font-semibold text-lg">{service?.name}</span>
                            <p className="text-gray-400 text-sm">R$ ${service?.price} • ${service?.duration}min</p>
                          </div>
                          <button className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Selecionar
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {m.options && currentStep === 'time' && (
                  <div className="mt-4">
                    <div className="grid grid-cols-2 gap-3">
                      {m.options.map((opt, i) => {
                        const isAvailable = opt.available;
                        const conflictCount = opt.count;
                        
                        return (
                          <button
                            key={i}
                            onClick={() => isAvailable && handleOptionClick(opt.value)}
                            disabled={!isAvailable}
                            className={`flex flex-col items-center justify-center p-4 rounded-lg transition-all duration-300 ${
                              isAvailable 
                                ? 'bg-gray-700 hover:bg-blue-600 text-white cursor-pointer' 
                                : 'bg-gray-800 text-gray-400 cursor-not-allowed opacity-60'
                            }`}
                          >
                            <span className="text-xl font-bold">${opt.label}</span>
                            <span className="text-xs mt-1">
                              ${isAvailable ? 'Disponível' : 'Indisponível'}
                            </span>
                            {!isAvailable && conflictCount > 0 && (
                              <span className="text-red-300 text-xs mt-1">
                                (${conflictCount} agendamento${conflictCount > 1 ? 's' : ''})
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isTyping && <div className="flex justify-start"><div className="bg-gray-700 px-4 py-3 rounded-xl animate-pulse text-white">Digitando...</div></div>}
          <div ref={messagesEndRef} />
        </div>

        {currentStep === 'date' && (
          <div className="p-4 border-t border-gray-700">
            <DateSelector
              selectedDate={formData.date}
              onDateSelect={(date) => processUserInput(date)}
              appointments={appointments}
            />
          </div>
        )}

        {currentStep !== 'date' && currentStep !== 'completed' && (
          <div className="p-4 border-t border-gray-700">
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentInput}
                onChange={currentStep === 'phone' ? handlePhoneChange : (e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
                className="flex-1 px-4 py-2 border border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-800 text-white placeholder-gray-400"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !currentInput.trim()}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBookingForm;
