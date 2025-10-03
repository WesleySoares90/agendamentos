import React, { useState, useEffect, useRef } from 'react';
// CORREÇÃO: Adicionados os ícones 'User', 'Send', 'Eye', 'Edit', 'ArrowLeft', 'Menu', 'X' que estavam faltando ou foram removidos.
import { User, Send, Eye, Edit, ArrowLeft, Menu, X, Clock, DollarSign, Calendar } from 'lucide-react'; 
import { TIME_SLOTS } from '../utils/constants';
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
  
  const [professionals, setProfessionals] = useState([]);

  const [formData, setFormData] = useState({
    name: editingAppointment?.name || '',
    email: editingAppointment?.email || '',
    phone: editingAppointment?.phone || '',
    service: editingAppointment?.service || '',
    professionalId: editingAppointment?.professionalId || '',
    date: editingAppointment?.date || '',
    time: editingAppointment?.time || ''
  });
  const [isTyping, setIsTyping] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const messagesEndRef = useRef(null);
  const hasSentWelcome = useRef(false);
  const [services, setServices] = useState([]);

  const { appointments } = useAppointments();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const servs = await appointmentService.getAllServices();
        const activeServices = servs.filter(s => s && s.id && s.name);
        setServices(activeServices);
      } catch (error) {
        console.error("Erro ao buscar serviços no chat:", error);
      }
    };
  
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchProfessionals = async () => {
      try {
        const profs = await appointmentService.getAllProfessionals();
    
        const activeProfessionals = profs.filter(p => p && p.id && p.name);
        
        setProfessionals(activeProfessionals);
  
      } catch (error) {
        console.error("Erro ao buscar profissionais no chat:", error);
      }
    };
  
    fetchProfessionals();
  
  }, []);


  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  const generateGoogleCalendarLink = (appointmentData) => {
    const { service, date, time } = appointmentData;
    const serviceInfo = services.find(s => s.id === service);

    if (!serviceInfo) return '#';

    const startTime = new Date(`${date}T${time}:00`);
    const startTimeISO = startTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    
    const endTime = new Date(startTime.getTime() + serviceInfo.duration * 60000);
    const endTimeISO = endTime.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const googleCalendarUrl = new URL("https://www.google.com/calendar/render" );
    googleCalendarUrl.searchParams.append("action", "TEMPLATE");
    googleCalendarUrl.searchParams.append("text", `Agendamento: ${serviceInfo.name}`);
    googleCalendarUrl.searchParams.append("dates", `${startTimeISO}/${endTimeISO}`);
    googleCalendarUrl.searchParams.append("details", `Seu agendamento para ${serviceInfo.name} está confirmado!`);

    return googleCalendarUrl.toString();
  };

  const getUserAppointments = (email) => appointments.filter(a => a.email?.toLowerCase() === email?.toLowerCase());

  const checkAvailableSlots = async (selectedDate, professionalId) => {
    if (!selectedDate || !professionalId) return;
    try {
      const dayAppointments = appointments.filter(apt => 
        apt.date === selectedDate && 
        apt.professionalId === professionalId &&
        apt.status !== 'cancelled'
      );
      const slotsStatus = TIME_SLOTS.map(time => ({ 
        time, 
        available: dayAppointments.filter(apt => apt.time === time).length === 0 
      }));
      setAvailableSlots(slotsStatus);
      return slotsStatus;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return TIME_SLOTS.map(time => ({ time, available: true }));
    }
  };

  const addBotMessage = (text, options = null, isSystem = false) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text, options, isSystem }]);
      setIsTyping(false);
    }, 800);
  };

  const addUserMessage = (text) => setMessages(prev => [...prev, { type: 'user', text }]);

  const generateConfirmationMessage = (data) => {
    // Busca serviço do estado dinâmico ao invés de SERVICES
    const serviceInfo = services.find(s => s.id === data.service);
    const professionalInfo = professionals.find(p => p.id === data.professionalId);
    return `\nConfirme seus dados:\n\n👤 Nome: ${data.name}\n📧 E-mail: ${data.email}\n📱 Telefone: ${formatPhoneNumber(data.phone)}\n✂️ Serviço: ${serviceInfo?.name}\n💇 Profissional: ${professionalInfo?.name}\n💰 Valor: R$ ${serviceInfo?.price}\n📅 Data: ${data.date.split('-').reverse().join('/')}\n🕐 Horário: ${data.time}\n\nDigite "SIM" para confirmar ou "ALTERAR" para modificar.\n`;
  };
  

  useEffect(() => {
    // Espera carregar tanto profissionais quanto serviços
    if (hasSentWelcome.current || professionals.length === 0 || services.length === 0) return;
    hasSentWelcome.current = true;
  
    if (editingAppointment) {
      setFormData(editingAppointment);
      setCurrentStep('confirmation');
      const confirmationText = generateConfirmationMessage(editingAppointment);
      setTimeout(() => addBotMessage(`Você está editando seu agendamento.${confirmationText}`), 500);
    } else {
      setTimeout(() => {
        addBotMessage("Olá! Eu sou a assistente virtual da empresa X e cuido dos agendamentos de serviços.");
        setTimeout(() => addBotMessage("Qual o seu nome? Por favor, escreva seu nome e sobrenome."), 1000);
      }, 500);
    }
  }, [editingAppointment, professionals, services]); 
  
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
    let messageText = value;
    if (currentStep === 'service') {
      const selectedService = services.find(s => s.id === value);
        messageText = selectedService?.name || value;
    } else if (currentStep === 'professional') {
        const selectedProf = professionals.find(p => p.id === value);
        messageText = selectedProf?.name || value;
    }

    addUserMessage(messageText);
    processUserInput(value);
  };

  const handleKeyPress = (e) => { if (e.key === 'Enter') handleSend(); };

  const formatPhoneNumber = (value) => {
    if (!value) return value;
    const phoneNumber = value.replace(/[^\d]/g, '');
    const phoneNumberLength = phoneNumber.length;
    if (phoneNumberLength < 3) return phoneNumber;
    if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`;
    if (phoneNumberLength < 11) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 6)}-${phoneNumber.slice(6, 10)}`;
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
          addBotMessage(`Prazer em conhecê-lo, ${input}! O que você gostaria de fazer?`, [
            { value: 'ver_servicos', name: 'Ver Serviços' },
            { value: 'fazer_reserva', name: 'Fazer Reserva' }
          ]);
        }, 500);
        break;

      case 'email':
        if (!validateEmail(input)) return addBotMessage("Digite um e-mail válido.", null, true);
        setFormData(prev => ({ ...prev, email: input }));
        setUserEmail(input);
        setCurrentStep('phone');
        addBotMessage("Ótimo! Agora, digite seu telefone com DDD.");
        break;

      case 'phone':
        if (!validatePhone(input)) return addBotMessage("Digite um telefone válido com DDD.", null, true);
        setFormData(prev => ({ ...prev, phone: input.replace(/\D/g, '') }));
        if (formData.service) {
          setCurrentStep('professional');
          addBotMessage("Agora, escolha o profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
        } else {
          setCurrentStep('service');
          addBotMessage("Agora, escolha o serviço desejado:", services.map(s => ({ value: s.id, name: s.name, price: s.price, duration: s.duration })));
        }
        break;

      case 'service':
        const selectedService = services.find(s => s.id === input);
        if (!selectedService) return addBotMessage("Selecione um serviço válido.", null, true);
        
        const updatedDataService = { ...formData, service: input };
        setFormData(updatedDataService);

        if (editingField) {
          setEditingField(null);
          setCurrentStep('confirmation');
          addBotMessage(`Serviço alterado para: ${selectedService.name}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataService)), 500);
        } else {
          setCurrentStep('professional');
          addBotMessage(`Você selecionou: ${selectedService.name}. Agora, escolha o profissional:`, professionals.map(p => ({ value: p.id, name: p.name })));
        }
        break;

      case 'professional':
        const selectedProfessional = professionals.find(p => p.id === input);
        if (!selectedProfessional) return addBotMessage("Selecione um profissional válido.", null, true);

        const updatedDataProf = { ...formData, professionalId: input };
        setFormData(updatedDataProf);

        if (editingField) {
            setEditingField(null);
            setCurrentStep('confirmation');
            addBotMessage(`Profissional alterado para: ${selectedProfessional.name}.`);
            setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataProf)), 500);
        } else {
            setCurrentStep('date');
            addBotMessage(`Você escolheu ${selectedProfessional.name}. Agora, escolha a data desejada.`);
        }
        break;

      case 'date':
        if (!input) return;
        const updatedDataDate = { ...formData, date: input };
        setFormData(updatedDataDate);
        
        if (editingField) {
          setEditingField(null);
          setCurrentStep('time');
          addBotMessage(`Data alterada para: ${input.split('-').reverse().join('/')}. Agora, escolha um novo horário.`);
          await checkAvailableSlots(input, formData.professionalId);
        } else {
          setCurrentStep('time');
          await checkAvailableSlots(input, formData.professionalId);
        }
        break;

      case 'time':
        if (!TIME_SLOTS.includes(input)) return addBotMessage("Escolha um horário disponível.", null, true);
        
        const updatedDataTime = { ...formData, time: input };
        setFormData(updatedDataTime);

        setCurrentStep('confirmation');
        setEditingField(null);
        addBotMessage(`Horário selecionado: ${input}.`);
        setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataTime)), 500);
        break;

      case 'confirmation':
        if (input.toLowerCase() === 'sim') return handleFinalSubmit();
        if (input.toLowerCase() === 'alterar') {
          setCurrentStep('ask_edit_field');
          const editOptions = [
            { value: 'service', name: 'Serviço' },
            { value: 'professional', name: 'Profissional' },
            { value: 'date', name: 'Data e Horário' },
            { value: 'cancel', name: 'Recomeçar' }
          ];
          addBotMessage("O que você gostaria de alterar?", editOptions);
          return;
        }
        addBotMessage("Digite 'SIM' para confirmar ou 'ALTERAR' para modificar.", null, true);
        break;

        case 'ask_edit_field':
          if (input === 'cancel') {
            setCurrentStep('welcome');
            setFormData({ name: '', email: '', phone: '', service: '', professionalId: '', date: '', time: '' });
            setMessages([]);
            hasSentWelcome.current = false;
            setTimeout(() => addBotMessage("Ok, vamos recomeçar. Qual o seu nome?"), 500);
            return;
          }
        
        setEditingField(input);
        setCurrentStep(input);

        const fieldMap = {
          service: "Ok, escolha o novo serviço.",
          professional: "Ok, escolha o novo profissional.",
          date: "Ok, escolha a nova data.",
        };
        addBotMessage(fieldMap[input] || "Ok, vamos alterar isso.");
        
        if (input === 'service') {
          addBotMessage("Escolha o novo serviço:", services.map(s => ({ value: s.id, name: s.name, price: s.price, duration: s.duration })));
        }
        if (input === 'professional') {
          addBotMessage("Escolha o novo profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
        }
        break;
    }
  };

  const handleFinalSubmit = async () => {
    const finalCheck = await appointmentService.checkTimeConflict(
      formData.date,
      formData.time,
      formData.professionalId,
      editingAppointment?.id
    );

    if (finalCheck) {
      addBotMessage("Ops! Este horário acabou de ser reservado com este profissional. Por favor, escolha outro horário.", null, true);
      setCurrentStep('time');
      setEditingField('time');
      await checkAvailableSlots(formData.date, formData.professionalId);
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      setCurrentStep('completed');
      
      const calendarLink = generateGoogleCalendarLink(formData);

      addBotMessage(
        "🎉 Agendamento confirmado com sucesso!",
        [{ 
          value: calendarLink, 
          name: '📅 Adicionar ao Google Agenda',
          isLink: true
        }]
      );
    } else {
      addBotMessage(`Ocorreu um erro: ${result.error || 'Tente novamente.'}`, null, true);
    }
  };

  // CORREÇÃO: Adicionadas as funções que estavam faltando.
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
    setFormData(appointment);
    setCurrentStep('confirmation');
    setMessages([]);
    hasSentWelcome.current = true;
    setViewMode('chat');
    const confirmationMessage = generateConfirmationMessage(appointment);
    addBotMessage(`Você está editando seu agendamento.${confirmationMessage}`);
  };

  const handleServiceSelect = (serviceId) => {
    setFormData(prev => ({ ...prev, service: serviceId }));
    setViewMode('chat');
    setCurrentStep('email');
    setMessages([]);
    hasSentWelcome.current = true;
    const selectedService = services.find(s => s.id === serviceId); 
  addBotMessage(`Você selecionou: ${selectedService.name}. Agora, preciso do seu e-mail para continuar o agendamento.`);
};

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
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>
    </div>
  );

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

  const ServiceCard = ({ service, onSelect }) => (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">{service.name}</h3>
          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-gray-600 text-xl">✨</div>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600"><Clock className="h-4 w-4" /><span>{service.duration} minutos</span></div>
          <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-gray-600" /><span className="text-xl font-bold text-gray-900">R$ {service.price}</span></div>
        </div>
        <button onClick={() => onSelect(service.id)} className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors font-medium">Agendar Serviço</button>
      </div>
    </div>
  );

  const TimeSlotCard = ({ slot, onSelect, isSelected }) => (
    <button
      onClick={() => onSelect(slot.time)}
      disabled={!slot.available}
      className={`p-4 rounded-lg border transition-all duration-200 ${isSelected ? 'bg-gray-900 text-white border-gray-900' : slot.available ? 'bg-white text-gray-900 border-gray-200 hover:border-gray-300 hover:shadow-sm' : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'}`}
    >
      <div className="text-center">
        <div className="font-semibold">{slot.time}</div>
        {!slot.available && (<div className="text-xs mt-1">Ocupado</div>)}
      </div>
    </button>
  );

  const renderServices = () => (
    <div className="w-full max-w-7xl mx-auto bg-white rounded-lg shadow-sm overflow-hidden">
      <Header title="Nossos Serviços" showBackButton={true} />
      <MobileMenu />
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          
          {services.map(service => (
            <ServiceCard key={service.id} service={service} onSelect={handleServiceSelect} />
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
              // Usa services dinâmico ao invés de SERVICES
              const service = services.find(s => s.id === a.service);
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

  if (viewMode === 'reservations') return (<div className="min-h-screen p-2 md:p-4 bg-gray-50 flex items-center justify-center">{renderReservations()}</div>);
  if (viewMode === 'services') return (<div className="min-h-screen p-2 md:p-4 bg-gray-50 flex items-center justify-center">{renderServices()}</div>);

  return (
    <div className="fixed inset-0 p-2 md:p-4 bg-cover bg-center bg-no-repeat flex items-center justify-center overflow-auto z-40" style={{ backgroundImage: `url(${bgImage})` }}>
      <div className="w-full max-w-2xl mx-auto bg-white rounded-lg shadow-lg h-[77vh] max-h-[650px] flex flex-col overflow-hidden">
        <Header title="Agendamento" />
        <MobileMenu />
        <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4 bg-gray-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm ${m.type === 'user' ? 'bg-gray-900 text-white rounded-br-md' : m.isSystem ? 'bg-red-100 text-red-800 border border-red-200 rounded-bl-md' : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'}`}>
                <p className="text-sm md:text-base leading-relaxed whitespace-pre-line">{m.text}</p>
                {m.options && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {m.options.map((option, optIdx) => {
                      if (option.isLink) {
                        return (
                          <a
                            key={optIdx}
                            href={option.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                          >
                            {option.name}
                          </a>
                        );
                      }
                      return (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionClick(option.value)}
                          className={`px-3 py-2 rounded-lg text-xs md:text-sm font-medium transition-all duration-200 ${option.available === false ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-gray-900 hover:bg-gray-800 text-white'}`}
                          disabled={option.available === false}
                        >
                          {option.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
          {currentStep === 'date' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm bg-white text-gray-900 border border-gray-200 rounded-bl-md">
                <p className="text-sm md:text-base leading-relaxed mb-4">Escolha a data desejada:</p>
                <DateSelector selectedDate={formData.date} onDateSelect={(date) => processUserInput(date)} availableSlots={availableSlots} />
              </div>
            </div>
          )}
          {currentStep === 'time' && (
            <div className="flex justify-start">
              <div className="max-w-[85%] md:max-w-[75%] p-3 md:p-4 rounded-2xl shadow-sm bg-white text-gray-900 border border-gray-200 rounded-bl-md">
                <p className="text-sm md:text-base leading-relaxed mb-4">Escolha o horário disponível:</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {availableSlots.map((slot, slotIdx) => (<TimeSlotCard key={slotIdx} slot={slot} onSelect={(time) => processUserInput(time)} isSelected={formData.time === slot.time} />))}
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
             onChange={currentStep === 'phone' ? handlePhoneChange : (e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading || currentStep === 'date' || currentStep === 'time' || currentStep === 'completed'}
            />
            <button
              onClick={handleSend}
              className="bg-gray-900 text-white p-3 md:p-4 rounded-xl hover:bg-gray-800 active:bg-gray-700 transition-all duration-200 flex items-center justify-center shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || currentStep === 'date' || currentStep === 'time' || currentStep === 'completed' || !currentInput.trim()}
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
