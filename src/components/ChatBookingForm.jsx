import React, { useState, useEffect, useRef } from 'react';
import { User, Send, Eye, Edit, ArrowLeft, Menu, X, Clock, DollarSign, Calendar, CheckCircle, AlertCircle, ChevronRight, Shield } from 'lucide-react';
import { TIME_SLOTS } from '../utils/constants';
import { useAppointments } from '../hooks/useAppointments';
import { appointmentService } from '../services/appointmentService';
import DateSelector from './DateSelector';
import bgImage from '../img/salao-ipanema-1024x576.jpg.webp';

const ChatBookingForm = ({ onSubmit, loading, editingAppointment = null, user, setCurrentView }) => {
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
  const [showDatePicker, setShowDatePicker] = useState(false);

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

  useEffect(() => {
    document.documentElement.lang = 'pt-BR';
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

  // Adicione dentro do componente, antes do return
  useEffect(() => {
    // Adiciona estilo customizado ao scroll
    const style = document.createElement('style');
    style.textContent = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 3px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.3);
  }
`;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => scrollToBottom(), [messages]);

  // Progress Steps - NOVA ORDEM
  const steps = [
    { key: 'welcome', label: 'Nome' },
    { key: 'service', label: 'Serviço' }, // Alterado
    { key: 'professional', label: 'Profissional' },
    { key: 'date', label: 'Data' },
    { key: 'time', label: 'Horário' },
    { key: 'email_optional', label: 'Email (Opcional)' },
    { key: 'phone', label: 'Telefone' },
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
      const settings = await appointmentService.getSettings();
      
      const dateObj = new Date(selectedDate + 'T00:00:00');
      const dayOfWeek = dateObj.getDay();
  
      const daysMap = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday'
      };
  
      const dayKey = daysMap[dayOfWeek];
      const businessHours = settings?.businessHours?.[dayKey];
  
      if (businessHours?.enabled === false) {
        setAvailableSlots([]);
        return [];
      }
  
      const dayAppointments = appointments.filter(apt =>
        apt.date === selectedDate &&
        apt.professionalId === professionalId &&
        apt.status !== 'cancelled'
      );
  
      const openTime = businessHours?.open || '09:00';
      const closeTime = businessHours?.close || '18:00';
  
      // CORREÇÃO: Gerar slots dinamicamente baseado nos horários do expediente
      const slots = generateSlotsBetweenHours(openTime, closeTime);
  
      const slotsStatus = slots.map(time => ({
        time,
        available: !dayAppointments.some(apt => apt.time === time)
      }));
  
      setAvailableSlots(slotsStatus);
      return slotsStatus;
    } catch (error) {
      console.error('Erro ao verificar disponibilidade:', error);
      return TIME_SLOTS.map(time => ({ time, available: true }));
    }
  };
  
  // ADICIONAR esta função auxiliar
  const generateSlotsBetweenHours = (openTime, closeTime) => {
    const slots = [];
    const [openHour, openMin] = openTime.split(':').map(Number);
    const [closeHour, closeMin] = closeTime.split(':').map(Number);
  
    let currentHour = openHour;
    let currentMin = openMin;
  
    while (currentHour < closeHour || (currentHour === closeHour && currentMin < closeMin)) {
      const timeString = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
      slots.push(timeString);
  
      // Incrementar 1 hora
      currentHour += 1;
    }
  
    return slots;
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
    return `\nConfirme seus dados:\n\n👤 Nome: ${data.name}\n${data.email ? `📧 E-mail: ${data.email}\n` : ''}📱 Telefone: ${formatPhoneNumber(data.phone)}\n✂️ Serviço: ${serviceInfo?.name}\n💇 Profissional: ${professionalInfo?.name}\n💰 Valor: R$ ${serviceInfo?.price}\n📅 Data: ${data.date.split('-').reverse().join('/')}\n🕐 Horário: ${data.time}\n\nDigite "SIM" para confirmar ou "ALTERAR" para modificar.\n`;
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
        addBotMessage("👋 Olá! Sou a assistente virtual e vou te ajudar a agendar seu serviço. Qual o seu nome?"); // Alterado
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

  // LOCALIZAÇÃO: Após a linha ~193 (depois da função generateGoogleCalendarLink)

  const handleDateSelect = (date) => {
    setShowDatePicker(false);
    addUserMessage(new Date(date + 'T00:00:00').toLocaleDateString('pt-BR'));
    processUserInput(date);
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
      setCurrentStep('service');
      setTimeout(() => addBotMessage(`Perfeito! Vamos fazer sua reserva. 🎯\n\nPrimeiro, escolha o serviço desejado:`, services.map(s => ({ value: s.id, name: `${s.name} - R$ ${s.price} (${s.duration}min)` }))), 500);
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
        // Removida a validação de nome completo para simplificar
        setFormData(prev => ({ ...prev, name: input }));
        setCurrentStep('service'); // Direciona diretamente para a seleção de serviço
        addBotMessage(`Prazer em conhecê-lo, ${input.split(' ')[0]}! 😊`);
        setTimeout(() => {
          addBotMessage(
            `Vamos agendar seu serviço, ${input.split(' ')[0]}. 🎯\n\nPrimeiro, escolha o serviço desejado:`, // Mensagem alterada
            services.map(s => ({ value: s.id, name: `${s.name} - R$ ${s.price} (${s.duration}min)` }))
          );
        }, 800);
        break;

      case 'choose_action': // Este passo será removido do fluxo principal
        // Já tratado em handleOptionClick, mas não será mais acessado diretamente após o welcome
        break;

      case 'service':
        const selectedService = services.find(s => s.id === input);
        if (!selectedService) return addBotMessage("❌ Selecione um serviço válido.", null, true);

        const updatedDataService = { ...formData, service: input };
        setFormData(updatedDataService);

        if (editingField) {
          setEditingField(null);
          addBotMessage(`Serviço alterado para: ${selectedService.name}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataService)), 500);
          setCurrentStep('confirmation');
          return;
        }

        setCurrentStep('professional');
        addBotMessage(`✅ Você selecionou: ${selectedService.name}!`);
        setTimeout(() => {
          addBotMessage("Agora, escolha o profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
        }, 800);
        break;

      // LOCALIZAÇÃO: Linha ~340 (dentro do switch, caso 'professional')

      case 'professional':
        const selectedProfessional = professionals.find(p => p.id === input);
        if (!selectedProfessional) return addBotMessage("❌ Selecione um profissional válido.", null, true);

        const updatedDataProfessional = { ...formData, professionalId: input };
        setFormData(updatedDataProfessional);

        if (editingField) {
          setEditingField(null);
          addBotMessage(`Profissional alterado para: ${selectedProfessional.name}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataProfessional)), 500);
          setCurrentStep('confirmation');
          return;
        }

        setCurrentStep('date');
        addBotMessage(`Ótima escolha! Você selecionou ${selectedProfessional.name}.`);
        setTimeout(() => {
          addBotMessage("Agora, selecione a data para o seu agendamento:");
          setShowDatePicker(true);
        }, 800);
        break;

      case 'date':
        const selectedDate = input;
        if (!selectedDate) return addBotMessage("❌ Por favor, selecione uma data válida.", null, true);

        const updatedDataDate = { ...formData, date: selectedDate };
        setFormData(updatedDataDate);

        if (editingField) {
          setEditingField(null);
          addBotMessage(`Data alterada para: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`);
          const slots = await checkAvailableSlots(selectedDate, formData.professionalId);
          setTimeout(() => addBotMessage("Agora, escolha o horário disponível:", slots.filter(s => s.available).map(s => ({ value: s.time, name: s.time }))), 500);
          setCurrentStep('time');
          return;
        }

        setCurrentStep('time');
        addBotMessage(`Data selecionada: ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}.`);
        const slots = await checkAvailableSlots(selectedDate, formData.professionalId);
        setTimeout(() => {
          if (slots.filter(s => s.available).length === 0) {
            addBotMessage("Nenhum horário disponível para esta data e profissional. Por favor, escolha outra data.", null, true);
            setCurrentStep('date'); // Volta para a seleção de data
          } else {
            addBotMessage("Agora, escolha o horário disponível:", slots.filter(s => s.available).map(s => ({ value: s.time, name: s.time })));
          }
        }, 800);
        break;

      case 'time':
        const selectedTime = input;
        if (!selectedTime) return addBotMessage("❌ Por favor, selecione um horário válido.", null, true);

        const updatedDataTime = { ...formData, time: selectedTime };
        setFormData(updatedDataTime);

        if (editingField) {
          setEditingField(null);
          addBotMessage(`Horário alterado para: ${selectedTime}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage(updatedDataTime)), 500);
          setCurrentStep('confirmation');
          return;
        }

        setCurrentStep('email_optional');
        addBotMessage(`Horário selecionado: ${selectedTime}.`);
        setTimeout(() => addBotMessage("Qual o seu melhor e-mail? (Opcional, mas recomendado para receber confirmação)"), 800);
        break;
      case 'email_optional':
        if (input.toLowerCase() === 'pular' || input.toLowerCase() === 'skip') {
          setFormData(prev => ({ ...prev, email: '' }));
          addUserMessage('Pular');
          setCurrentStep('phone');
          addBotMessage("Ok, sem e-mail. Agora, por favor, digite seu número de telefone com DDD:");
        } else if (!validateEmail(input)) {
          setValidationError('Por favor, digite um e-mail válido ou "pular".');
          addBotMessage('❌ E-mail inválido. Por favor, digite um e-mail válido ou "pular".', null, true);
        } else {
          setFormData(prev => ({ ...prev, email: input }));
          setCurrentStep('phone');
          addBotMessage(`E-mail registrado: ${input}. Agora, por favor, digite seu número de telefone com DDD:`);
        }
        break;
      case 'phone':
        if (!validatePhone(input)) {
          setValidationError('Por favor, digite um número de telefone válido com DDD (ex: (11) 98765-4321).');
          addBotMessage("❌ Telefone inválido. Por favor, digite um número de telefone válido com DDD (ex: (11) 98765-4321).", null, true);
        } else {
          const formattedPhone = formatPhoneNumber(input);
          setFormData(prev => ({ ...prev, phone: formattedPhone }));
          setCurrentStep('confirmation');
          addBotMessage(`Telefone registrado: ${formattedPhone}.`);
          setTimeout(() => addBotMessage(generateConfirmationMessage({ ...formData, phone: formattedPhone })), 800);
        }
        break;

      case 'confirmation':
        if (input.toLowerCase() === 'sim') {
          addBotMessage("Confirmando seu agendamento...");
          handleSubmit();
        } else if (input.toLowerCase() === 'alterar') {
          addBotMessage("Qual campo você gostaria de alterar?", [
            { value: 'service', name: 'Serviço' },
            { value: 'professional', name: 'Profissional' },
            { value: 'date', name: 'Data' },
            { value: 'time', name: 'Horário' },
            { value: 'email_optional', name: 'E-mail' },
            { value: 'phone', name: 'Telefone' }
          ]);
        } else if (['service', 'professional', 'date', 'time', 'email_optional', 'phone'].includes(input.toLowerCase())) {
          setEditingField(input.toLowerCase());
          let promptMessage = '';
          switch (input.toLowerCase()) {
            case 'service':
              promptMessage = "Qual serviço você gostaria de agendar?";
              addBotMessage(promptMessage, services.map(s => ({ value: s.id, name: `${s.name} - R$ ${s.price} (${s.duration}min)` })));
              setCurrentStep('service');
              break;
            case 'professional':
              promptMessage = "Qual profissional você gostaria de escolher?";
              addBotMessage(promptMessage, professionals.map(p => ({ value: p.id, name: p.name })));
              setCurrentStep('professional');
              break;
              case 'date':
                addBotMessage("Qual data você gostaria de agendar?");
                setShowDatePicker(true);
                setCurrentStep('date');
                break;
            case 'time':
              promptMessage = "Qual horário você gostaria de agendar?";
              const slots = await checkAvailableSlots(formData.date, formData.professionalId);
              addBotMessage(promptMessage, slots.filter(s => s.available).map(s => ({ value: s.time, name: s.time })));
              setCurrentStep('time');
              break;
            case 'email_optional':
              promptMessage = "Qual o seu melhor e-mail?";
              addBotMessage(promptMessage);
              setCurrentStep('email_optional');
              break;
            case 'phone':
              promptMessage = "Qual o seu número de telefone com DDD?";
              addBotMessage(promptMessage);
              setCurrentStep('phone');
              break;
            default:
              addBotMessage("Opção inválida. Por favor, digite 'SIM' para confirmar, 'ALTERAR' para modificar, ou o nome do campo que deseja alterar.", null, true);
              break;
          }
        } else {
          addBotMessage("Opção inválida. Por favor, digite 'SIM' para confirmar ou 'ALTERAR' para modificar.", null, true);
        }
        break;

      default:
        addBotMessage("Desculpe, não entendi. Podemos começar de novo?", [
          { value: 'restart', name: 'Reiniciar' }
        ]);
        break;
    }
  };

  const handleSubmit = async () => {
    setIsTyping(true);
    const appointmentData = {
      ...formData,
      status: 'confirmed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      const result = await onSubmit(appointmentData);
      setIsTyping(false);

      if (result && result.success) {
        const calendarLink = generateGoogleCalendarLink(appointmentData);
        addBotMessage("🎉 Agendamento confirmado com sucesso!", null, true);
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
    } catch (error) {
      setIsTyping(false);
      console.error("Erro ao submeter agendamento:", error);
      addBotMessage("❌ Ocorreu um erro ao confirmar seu agendamento. Por favor, tente novamente mais tarde.", null, true);
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
    setCurrentStep('professional');
    setMessages([]);
    hasSentWelcome.current = true;
    const selectedService = services.find(s => s.id === serviceId);
    addBotMessage(`✅ Você selecionou: ${selectedService.name}!`);
    setShowDatePicker(true);
    setTimeout(() => {
      addBotMessage("Agora, escolha o profissional:", professionals.map(p => ({ value: p.id, name: p.name })));
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

        <button
          onClick={() => setCurrentView(user ? 'admin' : 'login')}
          className="w-full flex items-center justify-center gap-2 bg-gray-700 text-white px-4 py-3 rounded-lg hover:bg-gray-800 transition-colors"
          aria-label="Acessar painel administrativo"
        >
          <Shield className="h-4 w-4" />
          <span className="text-sm font-medium">
            {user ? 'Painel Admin' : 'Login'}
          </span>
        </button>
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
            <p className="text-gray-600 text-lg font-medium">Você não possui agendamentos.</p>
            <p className="text-gray-500 mt-2">Que tal fazer um agora?</p>
            <button
              onClick={() => {
                handleBackToChat();
                handleOptionClick('fazer_reserva');
              }}
              className="mt-6 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
            >
              Fazer um Agendamento
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {userAppointments.map(apt => (
              <div key={apt.id} className="bg-white rounded-xl shadow-sm p-5 border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-bold text-gray-800">{services.find(s => s.id === apt.service)?.name}</h3>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {apt.status === 'confirmed' ? 'Confirmado' : 'Pendente'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Com {professionals.find(p => p.id === apt.professionalId)?.name} em {new Date(apt.date + 'T00:00:00').toLocaleDateString('pt-BR')} às {apt.time}
                </p>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleEditAppointment(apt)}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm"
                  >
                    <Edit className="h-4 w-4" /> Editar
                  </button>
                  <button
                    onClick={() => alert('Funcionalidade de cancelamento ainda não implementada.')}
                    className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    <X className="h-4 w-4" /> Cancelar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans antialiased">
      <div className="relative flex flex-col w-full max-w-md mx-auto bg-white shadow-xl md:rounded-lg overflow-hidden md:my-4 h-full md:h-[calc(100vh-2rem)]">
        <Header title={viewMode === 'chat' ? 'Agendamento Online' : (viewMode === 'services' ? 'Nossos Serviços' : 'Minhas Reservas')} showBackButton={viewMode !== 'chat'} />
        <MobileMenu />

        {viewMode === 'services' && <ServicesView />}
        {viewMode === 'reservations' && <ReservationsView />}

        {viewMode === 'chat' && (
          <div className="flex flex-col h-full">
            <ProgressBar />
            <SummaryPanel />

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar" style={{ backgroundImage: `url(${bgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div className="flex flex-col space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] p-3 rounded-lg shadow-md ${msg.type === 'user' ? 'bg-gray-900 text-white' : (msg.isSystem ? 'bg-red-100 text-red-800' : 'bg-white text-gray-800')}`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      {msg.options && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {msg.options.map((option, optIndex) => (
                            option.isLink ? (
                              <a
                                key={optIndex}
                                href={option.value}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-600 transition-colors"
                              >
                                {option.name}
                              </a>
                            ) : (
                              <button
                                key={optIndex}
                                onClick={() => handleOptionClick(option.value)}
                                className="bg-gray-200 text-gray-800 text-xs px-3 py-1 rounded-full hover:bg-gray-300 transition-colors"
                              >
                                {option.name}
                              </button>
                            )
                          ))}
                        </div>
                      )}
                      {msg.component && <div className="mt-2">{msg.component}</div>}
                      <span className="block text-right text-xs text-gray-400 mt-1">
                        {msg.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))}
                {showDatePicker && (
                  <div className="flex justify-start">
                    <div className="max-w-[90%] bg-white p-2 rounded-lg shadow-md">
                      <DateSelector
                        onDateSelect={handleDateSelect}
                        selectedDate={formData.date}
                      />
                    </div>
                  </div>
                )}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] p-3 rounded-lg shadow-md bg-white text-gray-800">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {validationError && (
              <div className="bg-red-100 text-red-700 p-3 text-sm text-center">
                {validationError}
              </div>
            )}

            <div className="bg-white p-4 border-t flex items-center">
              <input
                type="text"
                className="flex-grow border rounded-full p-3 text-sm focus:outline-none focus:ring-2 focus:ring-gray-300"
                placeholder="Digite sua mensagem..."
                value={currentInput}
                onChange={(e) => {
                  if (currentStep === 'phone') {
                    handlePhoneChange(e);
                  } else {
                    setCurrentInput(e.target.value);
                  }
                }}
                onKeyPress={handleKeyPress}
                disabled={loading}
              />
              <button
                onClick={handleSend}
                className="ml-3 bg-gray-900 text-white p-3 rounded-full hover:bg-gray-800 transition-colors flex items-center justify-center"
                disabled={loading}
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
