import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Eye, Edit, ArrowLeft, Menu, X, Clock, DollarSign, Calendar, CheckCircle, AlertCircle, ChevronRight } from 'lucide-react'; 
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
  const [services, setServices] = useState([]);
  const [validationError, setValidationError] = useState('');

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

  const { appointments } = useAppointments();

  // Fetch services
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

  // Fetch professionals
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

  // Progress Steps
  const steps = [
    { key: 'welcome', label: 'Nome' },
    { key: 'choose_action', label: 'Ação' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Telefone' },
    { key: 'service', label: 'Serviço' },
    { key: 'professional', label: 'Profissional' },
    { key: 'date', label: 'Data' },
    { key: 'time', label: 'Horário' },
    { key: 'confirmation', label: 'Confirmação' }
  ];

  const getCurrentStepIndex = () => {
    const index = steps.findIndex(s => s.key === currentStep);
    return index === -1 ? 0 : index;
  };

  const generateSummaryCard = () => {
    const service = services.find(s => s.id === formData.service);
    const professional = professionals.find(p => p.id === formData.professionalId);
    
    return {
      name: formData.name,
      email: formData.email,
      phone: formData.phone ? formatPhoneNumber(formData.phone) : '',
      service: service?.name || '',
      servicePrice: service?.price || 0,
      professional: professional?.name || '',
      date: formData.date ? new Date(formData.date + 'T00:00:00').toLocaleDateString('pt-BR') : '',
      time: formData.time
    };
  };

  const generateGoogleCalendarLink = (appointmentData) => {
    const { service, date, time } = appointmentData;
    const serviceInfo = services.find(s => s.id === service);
    if (!serviceInfo) return '#';

    const startTime = new Date(`${date}T${time}:00`);
    const startTimeISO = startTime.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endTime = new Date(startTime.getTime() + serviceInfo.duration * 60000);
    const endTimeISO = endTime.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const googleCalendarUrl = new URL("https://www.google.com/calendar/render");
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
      setMessages(prev => [...prev, { type: 'bot', text, options, isSystem, timestamp: new Date() }]);
      setIsTyping(false);
    }, 600);
  };

  const addUserMessage = (text) => setMessages(prev => [...prev, { type: 'user', text, timestamp: new Date() }]);

  const generateConfirmationMessage = (data) => {
    const serviceInfo = services.find(s => s.id === data.service);
    const professionalInfo = professionals.find(p => p.id === data.professionalId);
    return `\nConfirme seus dados:\n\n👤 Nome: ${data.name}\n📧 E-mail: ${data.email}\n📱 Telefone: ${formatPhoneNumber(data.phone)}\n✂️ Serviço: ${serviceInfo?.name}\n💇 Profissional: ${professionalInfo?.name}\n💰 Valor: R$ ${serviceInfo?.price}\n📅 Data: ${data.date.split('-').reverse().join('/')}\n🕐 Horário: ${data.time}\n\nDigite "SIM" para confirmar ou "ALTERAR" para modificar.\n`;
  };

  // Initial welcome message
  useEffect(() => {
    if (hasSentWelcome.current || professionals.length === 0 || services.length === 0) return;
    hasSentWelcome.current = true;
  
    if (editingAppointment) {
      setFormData(editingAppointment);
      setCurrentStep('confirmation');
      const confirmationText = generateConfirmationMessage(editingAppointment);
      setTimeout(() => addBotMessage(`Você está editando seu agendamento.${confirmationText}`), 500);
    } else {
      setTimeout(() => {
        addBotMessage("👋 Olá! Sou a assistente virtual e vou te ajudar a agendar seu serviço.");
        setTimeout(() => addBotMessage("Qual o seu nome completo?"), 1000);
      }, 500);
    }
  }, [editingAppointment, professionals, services]); 
  
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => phone.replace(/\D/g, '').length >= 10;

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
  };

  const handleSend = () => {
    if (!currentInput.trim()) return;
    setValidationError('');
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
      setTimeout(() => addBotMessage(`Perfeito! Vamos fazer sua reserva. 🎯\n\nPreciso do seu e-mail para enviar a confirmação.`), 500);
      return;
    }
    if (value === 'voltar_chat') {
      setViewMode('chat');
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

  const handleKeyPress = (e) => { 
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const processUserInput = async (input) => {
    switch (currentStep) {
      case 'welcome':
        if (input.trim().split(' ').length < 2) {
          setValidationError('Por favor, digite seu nome completo.');
          addBotMessage("❌ Por favor, digite seu nome completo (nome e sobrenome).", null, true);
          return;
        }
        setFormData(prev => ({ ...prev, name: input }));
        setCurrentStep('choose_action');
        addBotMessage(`Prazer em conhecê-lo, ${input.split(' ')[0]}! 😊`);
        setTimeout(() => {
          addBotMessage(
            "O que você gostaria de fazer?",
            [
              { value: 'ver_servicos', name: '👁️ Ver Serviços Disponíveis' },
              { value: 'fazer_reserva', name: '📅 Fazer uma Reserva' }
            ]
          );
        }, 800);
        break;

      case 'choose_action':
        // Já tratado em handleOptionClick
        break;

      case 'email':
        if (!validateEmail(input)) {
          setValidationError('E-mail inválido.');
          addBotMessage("❌ Por favor, digite um e-mail válido (exemplo: seu@email.com).", null, true);
          return;
        }
        setFormData(prev => ({ ...prev, email: input }));
        setUserEmail(input);
        setCurrentStep('phone');
        addBotMessage("✅ E-mail registrado!");
        setTimeout(() => {
          addBotMessage("Agora, seu telefone com DDD (exemplo: 21987654321):");
        }, 800);
        break;

      case 'phone':
        if (!validatePhone(input)) {
          setValidationError('Telefone inválido.');
          addBotMessage("❌ Digite um telefone válido com DDD (10 ou 11 dígitos).", null, true);
          return;
        }
        setFormData(prev => ({ ...prev, phone: input.replace(/\D/g, '') }));
        if (formData.service) {
          setCurrentStep('professional');
          addBotMessage("✅ Telefone registrado!");
          setTimeout(() => {
            addBotMessage("Agora, escolha o profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
          }, 800);
        } else {
          setCurrentStep('service');
          addBotMessage("✅ Telefone registrado!");
          setTimeout(() => {
            addBotMessage("Agora, escolha o serviço desejado:", services.map(s => ({ value: s.id, name: `${s.name} - R$ ${s.price} (${s.duration}min)` })));
          }, 800);
        }
        break;

      case 'service':
        const selectedService = services.find(s => s.id === input);
        if (!selectedService) return addBotMessage("❌ Selecione um serviço válido.", null, true);
        
        const updatedDataService = { ...formData, service: input };
        setFormData(updatedDataService);

        if (editingField) {
          setEditingField(null);
          setCurrentStep('confirmation');
          addBotMessage(`✅ Serviço alterado para: ${selectedService.name}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataService)), 500);
        } else {
          setCurrentStep('professional');
          addBotMessage(`✅ ${selectedService.name} selecionado!`);
          setTimeout(() => {
            addBotMessage("Agora, escolha o profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
          }, 800);
        }
        break;

      case 'professional':
        const selectedProfessional = professionals.find(p => p.id === input);
        if (!selectedProfessional) return addBotMessage("❌ Selecione um profissional válido.", null, true);

        const updatedDataProf = { ...formData, professionalId: input };
        setFormData(updatedDataProf);

        if (editingField) {
          setEditingField(null);
          setCurrentStep('confirmation');
          addBotMessage(`✅ Profissional alterado para: ${selectedProfessional.name}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataProf)), 500);
        } else {
          setCurrentStep('date');
          addBotMessage(`✅ ${selectedProfessional.name} selecionado!`);
          setTimeout(() => {
            addBotMessage("Agora, escolha a data desejada:");
          }, 800);
        }
        break;

      case 'date':
        if (!input) return;
        const updatedDataDate = { ...formData, date: input };
        setFormData(updatedDataDate);
        
        if (editingField) {
          setEditingField(null);
          setCurrentStep('time');
          addBotMessage(`✅ Data alterada para: ${input.split('-').reverse().join('/')}. Escolha um novo horário.`);
          await checkAvailableSlots(input, formData.professionalId);
        } else {
          setCurrentStep('time');
          addBotMessage(`✅ Data selecionada: ${new Date(input + 'T00:00:00').toLocaleDateString('pt-BR')}`);
          setTimeout(() => {
            addBotMessage("Agora escolha o melhor horário:");
          }, 800);
          await checkAvailableSlots(input, formData.professionalId);
        }
        break;

      case 'time':
        if (!TIME_SLOTS.includes(input)) return addBotMessage("❌ Escolha um horário disponível.", null, true);
        
        const updatedDataTime = { ...formData, time: input };
        setFormData(updatedDataTime);

        setCurrentStep('confirmation');
        setEditingField(null);
        addBotMessage(`✅ Horário selecionado: ${input}.`);
        setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataTime)), 500);
        break;

      case 'confirmation':
        if (input.toLowerCase() === 'sim') return handleFinalSubmit();
        if (input.toLowerCase() === 'alterar') {
          setCurrentStep('ask_edit_field');
          const editOptions = [
            { value: 'service', name: '✂️ Serviço' },
            { value: 'professional', name: '👨‍💼 Profissional' },
            { value: 'date', name: '📅 Data' },
            { value: 'time', name: '🕐 Horário' },
            { value: 'cancel', name: '🔄 Recomeçar' }
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
          time: "Ok, escolha o novo horário."
        };
        addBotMessage(fieldMap[input] || "Ok, vamos alterar isso.");
        
        if (input === 'service') {
          setTimeout(() => {
            addBotMessage("Escolha o novo serviço:", services.map(s => ({ value: s.id, name: `${s.name} - R$ ${s.price}`, price: s.price, duration: s.duration })));
          }, 500);
        }
        if (input === 'professional') {
          setTimeout(() => {
            addBotMessage("Escolha o novo profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
          }, 500);
        }
        if (input === 'time') {
          await checkAvailableSlots(formData.date, formData.professionalId);
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
      addBotMessage("❌ Ops! Este horário acabou de ser reservado. Por favor, escolha outro horário.", null, true);
      setCurrentStep('time');
      setEditingField('time');
      await checkAvailableSlots(formData.date, formData.professionalId);
      return;
    }

    const result = await onSubmit(formData);
    if (result.success) {
      setCurrentStep('completed');
      const calendarLink = generateGoogleCalendarLink(formData);
      addBotMessage("🎉 Agendamento confirmado com sucesso!");
      setTimeout(() => {
        addBotMessage(
          "Você receberá um e-mail de confirmação em breve.",
          [{ 
            value: calendarLink, 
            name: '📅 Adicionar ao Google Agenda',
            isLink: true
          }]
        );
      }, 1000);
    } else {
      addBotMessage(`❌ Ocorreu um erro: ${result.error || 'Tente novamente.'}`, null, true);
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
    addBotMessage(`✅ Você selecionou: ${selectedService.name}!`);
    setTimeout(() => {
      addBotMessage("Agora, preciso do seu e-mail para continuar o agendamento.");
    }, 800);
  };

  // COMPONENTS
  const ProgressBar = () => {
    const currentIndex = getCurrentStepIndex();
    const progress = ((currentIndex + 1) / steps.length) * 100;

    return (
      <div className="px-4 py-3 bg-white border-b">
        <div className="flex items-center justify-between mb-2 text-xs text-gray-600">
          <span>Etapa {currentIndex + 1} de {steps.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-gray-800 to-gray-900 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  };

  const SummaryPanel = () => {
    const summary = generateSummaryCard();
    if (!formData.name) return null;

    return (
      <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 border-b">
        <div className="text-xs text-gray-500 mb-2 font-medium">📋 Resumo do Agendamento</div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {summary.name && (
            <div className="flex items-center gap-1">
              <User className="h-3 w-3 text-gray-400" />
              <span className="text-gray-700 truncate">{summary.name.split(' ')[0]}</span>
            </div>
          )}
          {summary.service && (
            <div className="flex items-center gap-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-gray-700 truncate">{summary.service}</span>
            </div>
          )}
          {summary.date && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-gray-400" />
              <span className="text-gray-700">{summary.date}</span>
            </div>
          )}
          {summary.time && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-400" />
              <span className="text-gray-700">{summary.time}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const Header = ({ title, showBackButton = false }) => (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white p-4 md:p-6 rounded-t-lg flex justify-between items-center sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-3">
        {showBackButton && (
          <button
            onClick={handleBackToChat}
            className="p-2 hover:bg-gray-700 rounded-lg transition-colors md:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg md:text-xl font-bold truncate">{title}</h1>
          <p className="text-xs text-gray-300 hidden md:block">Agendamento Online</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="hidden md:flex gap-2">
          {viewMode === 'chat' && (
            <button
              onClick={handleCheckReservations}
              className="flex items-center gap-2 bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <Eye className="h-4 w-4" /> Ver Reservas
            </button>
          )}
          {viewMode !== 'chat' && (
            <button
              onClick={handleBackToChat}
              className="bg-white text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Voltar
            </button>
          )}
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-gray-700 rounded-lg transition-colors md:hidden"
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
    <div className="bg-white rounded-xl border-2 border-gray-200 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all duration-300 overflow-hidden group">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{service.name}</h3>
          <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
            <div className="text-2xl">✂️</div>
          </div>
        </div>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>{service.duration} minutos</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-gray-600" />
            <span className="text-2xl font-bold text-gray-900">R$ {service.price}</span>
          </div>
        </div>
        <button 
          onClick={() => onSelect(service.id)} 
          className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 active:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2"
        >
          Agendar <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  const ServicesView = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-t-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Nossos Serviços</h1>
              <p className="text-gray-600 mt-1">Escolha o serviço ideal para você</p>
            </div>
            <button
              onClick={() => handleOptionClick('voltar_chat')}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map(service => (
            <ServiceCard key={service.id} service={service} onSelect={handleServiceSelect} />
          ))}
        </div>
      </div>
    </div>
  );

  const ReservationsView = () => (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-t-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Reservas</h1>
              <p className="text-gray-600 mt-1">Gerencie seus agendamentos</p>
            </div>
            <button
              onClick={handleBackToChat}
              className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar
            </button>
          </div>
        </div>

        {userAppointments.length === 0 ? (
          <div className="bg-white rounded-xl p-8 text-center shadow-sm">
            <div className="text-gray-400 mb-4">
              <Calendar className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma reserva encontrada</h3>
            <p className="text-gray-600">Você ainda não possui agendamentos.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {userAppointments.map(appointment => {
              const service = services.find(s => s.id === appointment.service);
              const professional = professionals.find(p => p.id === appointment.professionalId);
              
              return (
                <div key={appointment.id} className="bg-white rounded-xl border-2 border-gray-200 shadow-sm p-6 hover:shadow-lg transition-all">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{service?.name}</h3>
                      <p className="text-sm text-gray-600">com {professional?.name}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {appointment.status === 'confirmed' ? 'Confirmado' :
                       appointment.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="h-4 w-4" />
                      <span>{appointment.date.split('-').reverse().join('/')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      <span>{appointment.time}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <DollarSign className="h-4 w-4" />
                      <span>R$ {service?.price}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <User className="h-4 w-4" />
                      <span>{appointment.name}</span>
                    </div>
                  </div>

                  {appointment.status !== 'cancelled' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAppointment(appointment)}
                        className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Edit className="h-4 w-4" /> Editar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const TimeSlotGrid = ({ onSelect }) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {availableSlots.map((slot, idx) => {
        const isSelected = formData.time === slot.time;
        const isAvailable = slot.available;

        return (
          <button
            key={idx}
            onClick={() => isAvailable && onSelect(slot.time)}
            disabled={!isAvailable}
            className={`p-3 rounded-lg border-2 transition-all ${
              isSelected
                ? 'bg-gray-900 text-white border-gray-900 scale-105'
                : isAvailable
                ? 'bg-white text-gray-700 border-gray-200 hover:border-gray-400'
                : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50'
            }`}
          >
            <div className="font-semibold">{slot.time}</div>
            {!isAvailable && <div className="text-xs mt-1">Ocupado</div>}
          </button>
        );
      })}
    </div>
  );

  // Render based on viewMode
  if (viewMode === 'services') return <ServicesView />;
  if (viewMode === 'reservations') return <ReservationsView />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 flex items-center justify-center"  style={{
      backgroundImage: `url(${bgImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center'
    }}>
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[700px]">
        <Header title="💈 Salão Ipanema" />
        <MobileMenu />
        <ProgressBar />
        <SummaryPanel />

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.type === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              <div className={`max-w-[80%] p-3 rounded-2xl shadow-sm ${
                m.type === 'user'
                  ? 'bg-gray-900 text-white rounded-br-sm'
                  : m.isSystem
                  ? 'bg-red-50 text-red-800 border border-red-200 rounded-bl-sm'
                  : 'bg-white text-gray-900 border border-gray-200 rounded-bl-sm'
              }`}>
                <p className="text-sm leading-relaxed whitespace-pre-line">{m.text}</p>
                {m.options && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {m.options.map((option, optIdx) => 
                      option.isLink ? (
                        <a
                          key={optIdx}
                          href={option.value}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-1"
                        >
                          {option.name}
                        </a>
                      ) : (
                        <button
                          key={optIdx}
                          onClick={() => handleOptionClick(option.value)}
                          className="px-3 py-2 rounded-lg text-sm font-medium transition-all bg-gray-900 hover:bg-gray-800 text-white flex items-center gap-1"
                        >
                          {option.name}
                        </button>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {currentStep === 'date' && (
            <div className="flex justify-start animate-fadeIn">
              <div className="max-w-[90%] p-4 rounded-2xl bg-white border border-gray-200 rounded-bl-sm">
                <p className="text-sm mb-3 text-gray-700">📅 Selecione a data:</p>
                <DateSelector 
                  selectedDate={formData.date} 
                  onDateSelect={(date) => processUserInput(date)} 
                  availableSlots={availableSlots} 
                />
              </div>
            </div>
          )}

          {currentStep === 'time' && (
            <div className="flex justify-start animate-fadeIn">
              <div className="max-w-[90%] p-4 rounded-2xl bg-white border border-gray-200 rounded-bl-sm">
                <p className="text-sm mb-3 text-gray-700">🕐 Escolha o horário:</p>
                <TimeSlotGrid onSelect={(time) => processUserInput(time)} />
              </div>
            </div>
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-3 rounded-2xl rounded-bl-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t bg-white">
          {validationError && (
            <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              {validationError}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type={currentStep === 'phone' ? 'tel' : currentStep === 'email' ? 'email' : 'text'}
              className="flex-1 p-3 rounded-xl bg-gray-50 border-2 border-gray-200 focus:border-gray-900 focus:outline-none transition-all"
              placeholder={
                currentStep === 'phone' ? '(21) 98765-4321' :
                currentStep === 'email' ? 'seu@email.com' :
                'Digite sua mensagem...'
              }
              value={currentInput}
              onChange={currentStep === 'phone' ? handlePhoneChange : (e) => setCurrentInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={currentStep === 'date' || currentStep === 'time' || currentStep === 'completed' || loading}
            />
            <button
              onClick={handleSend}
              disabled={!currentInput.trim() || currentStep === 'date' || currentStep === 'time' || currentStep === 'completed' || loading}
              className="bg-gray-900 text-white p-3 rounded-xl hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default ChatBookingForm;