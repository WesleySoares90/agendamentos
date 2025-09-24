import React, { useState, useEffect, useRef } from 'react';
import { Send, Eye, Edit } from 'lucide-react';
import { SERVICES, TIME_SLOTS } from '../utils/constants';
import { useAppointments } from '../hooks/useAppointments';
import { appointmentService } from '../services/appointmentService';

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
    const confirmationText = `
Você está editando seu agendamento:

👤 Nome: ${editingAppointment.name}
📧 E-mail: ${editingAppointment.email}
📱 Telefone: ${editingAppointment.phone}
✂️ Serviço: ${selectedService?.name}
💰 Valor: R$ ${selectedService?.price}
📅 Data: ${editingAppointment.date.split('-').reverse().join('/')}
🕐 Horário: ${editingAppointment.time}

Digite "ALTERAR" para modificar ou "SIM" para confirmar.
`;
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
        setCurrentStep('email');
        setTimeout(() => addBotMessage(`Prazer em conhecê-lo, ${input}! Agora preciso do seu e-mail.`), 500);
        break;

      case 'email':
        if (!validateEmail(input)) return addBotMessage("Digite um e-mail válido.");
        setFormData(prev => ({ ...prev, email: input }));
        setUserEmail(input);
        setCurrentStep('phone');
        setTimeout(() => addBotMessage("Digite seu telefone com DDD (exemplo: 11999999999)"), 500);
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
        setTimeout(() => addBotMessage(`Você selecionou: ${selectedService.name}. Escolha a data desejada.`), 500);
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
          addBotMessage(`
Confirme seus dados:

👤 Nome: ${formData.name}
📧 E-mail: ${formData.email}
📱 Telefone: ${formatPhoneNumber(formData.phone)}
✂️ Serviço: ${serviceInfo?.name}
💰 Valor: R$ ${serviceInfo?.price}
📅 Data: ${formData.date.split('-').reverse().join('/')}
🕐 Horário: ${formData.time}

Digite "SIM" para confirmar ou "ALTERAR" para modificar.
`);
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
    setFormData(appointment);
    setCurrentStep('confirmation');
    setMessages([]);
    hasSentWelcome.current = true;
    setViewMode('chat');
    const selectedService = SERVICES.find(s => s.id === appointment.service);
    addBotMessage(`
Você está editando seu agendamento:

👤 Nome: ${appointment.name}
📧 E-mail: ${appointment.email}
📱 Telefone: ${appointment.phone}
✂️ Serviço: ${selectedService?.name}
💰 Valor: R$ ${selectedService?.price}
📅 Data: ${appointment.date.split('-').reverse().join('/')}
🕐 Horário: ${appointment.time}

Digite "ALTERAR" para modificar ou "SIM" para confirmar.
`);
  };

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
                <p className="text-gray-300">📅 {a.date.split('-').reverse().join('/')}</p>
                <p className="text-gray-300">🕐 {a.time}</p>
                <p className="text-gray-300 font-semibold">💰 R$ {service?.price}</p>
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
                            <p className="text-gray-400 text-sm">R$ {service?.price} • {service?.duration}min</p>
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
                            <span className="text-xl font-bold">{opt.label}</span>
                            <span className="text-xs mt-1">
                              {isAvailable ? 'Disponível' : 'Indisponível'}
                            </span>
                            {!isAvailable && conflictCount > 0 && (
                              <span className="text-red-300 text-xs mt-1">
                                ({conflictCount} agendamento{conflictCount > 1 ? 's' : ''})
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

        {currentStep !== 'completed' && (
          <div className="p-4 border-t border-gray-700">
            {currentStep === 'date' ? (
              <div className="flex space-x-2">
                <input
                  type="date"
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.date || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-green-500 rounded-xl text-white"
                />
                <button
                  onClick={() => { if(formData.date) { addUserMessage(formData.date); processUserInput(formData.date); } }}
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700"
                >Confirmar Data</button>
              </div>
            ) : currentStep === 'phone' ? (
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={currentInput}
                  onChange={handlePhoneChange}
                  onKeyPress={handleKeyPress}
                  placeholder="(99) 99999-9999"
                  className="flex-1 px-4 py-3 bg-gray-800 border border-green-500 rounded-xl text-white"
                  disabled={loading || isTyping}
                />
                <button onClick={handleSend} disabled={loading || isTyping || !currentInput.trim()} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua resposta..."
                  className="flex-1 px-4 py-3 bg-gray-800 border border-green-500 rounded-xl text-white"
                  disabled={loading || isTyping}
                />
                <button onClick={handleSend} disabled={loading || isTyping || !currentInput.trim()} className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700">
                  <Send className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatBookingForm;