import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Filter,
  LogOut,
  RefreshCw,
  User,
  Mail,
  Phone,
  Calendar,
  Search,
  Download,
  TrendingUp,
  DollarSign,
  Users,
  AlertCircle,
  ChevronDown,
  Settings,
  Bell,
  Plus,
  Scissors,
  UserPlus,
  Trash2
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { appointmentService } from '../services/appointmentService';
import { SERVICES, APPOINTMENT_STATUS } from '../utils/constants';
import EditProfessionalModal from './EditProfessionalModal'

// Componente de Analytics
const AnalyticsDashboard = ({ appointments, professionals }) => {
  const today = new Date();
  const thisMonth = today.getMonth();
  const thisYear = today.getFullYear();

  const monthlyAppointments = appointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate.getMonth() === thisMonth && aptDate.getFullYear() === thisYear;
  });

  const revenue = monthlyAppointments
    .filter(apt => apt.status === 'approved')
    .reduce((sum, apt) => {
      const service = SERVICES.find(s => s.id === apt.service);
      return sum + parseFloat(service?.price || 0);
    }, 0);

  const averageTicket = monthlyAppointments.filter(apt => apt.status === 'approved').length > 0
    ? revenue / monthlyAppointments.filter(apt => apt.status === 'approved').length
    : 0;

  const uniqueClients = new Set(appointments.map(apt => apt.email)).size;

  // Analytics por profissional
  const professionalStats = professionals.map(prof => {
    const profAppointments = appointments.filter(apt => apt.professionalId === prof.id);
    const profRevenue = profAppointments
      .filter(apt => apt.status === 'approved')
      .reduce((sum, apt) => {
        const service = SERVICES.find(s => s.id === apt.service);
        return sum + parseFloat(service?.price || 0);
      }, 0);

    return {
      ...prof,
      appointmentsCount: profAppointments.length,
      revenue: profRevenue,
      approvedCount: profAppointments.filter(apt => apt.status === 'approved').length
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // Serviços mais populares
  const serviceStats = SERVICES.map(service => {
    const count = appointments.filter(apt => apt.service === service.id).length;
    const revenue = appointments
      .filter(apt => apt.service === service.id && apt.status === 'approved')
      .reduce((sum, apt) => sum + parseFloat(service.price), 0);

    return { ...service, count, revenue };
  }).sort((a, b) => b.count - a.count);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Cards de Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl text-white shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-white/20 rounded-lg">
              <DollarSign className="h-6 w-6" />
            </div>
            <TrendingUp className="h-5 w-5" />
          </div>
          <p className="text-sm font-medium opacity-90 mb-1">Receita Mensal</p>
          <p className="text-3xl font-bold">{formatCurrency(revenue)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Calendar className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Agendamentos (Mês)</p>
          <p className="text-3xl font-bold text-gray-900">{monthlyAppointments.length}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Clientes Únicos</p>
          <p className="text-3xl font-bold text-gray-900">{uniqueClients}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="p-3 bg-orange-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-gray-600 mb-1">Ticket Médio</p>
          <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageTicket)}</p>
        </div>
      </div>

      {/* Performance por Profissional */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Profissional</h3>
        <div className="space-y-3">
          {professionalStats.map((prof, idx) => (
            <div key={prof.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full text-blue-600 font-semibold">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{prof.name}</p>
                <p className="text-sm text-gray-600">
                  {prof.appointmentsCount} agendamentos • {prof.approvedCount} aprovados
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">{formatCurrency(prof.revenue)}</p>
                <p className="text-xs text-gray-500">receita</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Serviços Mais Populares */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Serviços Mais Populares</h3>
        <div className="space-y-3">
          {serviceStats.slice(0, 5).map((service) => (
            <div key={service.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Scissors className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-600">{service.count} agendamentos</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">{formatCurrency(service.revenue)}</p>
                <p className="text-xs text-gray-500">receita total</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Componente de Gestão de Profissionais
const ProfessionalManager = ({ professionals, onAdd, onEdit, onDelete, appointments }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', specialty: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(formData);
    setFormData({ name: '', email: '', phone: '', specialty: '' });
    setShowAddForm(false);
  };

  const getApprovedClientsCount = (professionalId) => {
    return appointments.filter(apt => apt.professionalId === professionalId && apt.status === 'approved').length;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Profissionais</h2>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto justify-center"
        >
          <Plus className="h-5 w-5" />
          Adicionar Profissional
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Novo Profissional</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Especialidade</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Corte, Barba, Coloração"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {professionals.map((prof) => (
          <div key={prof.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{prof.name}</h3>
                  <p className="text-sm text-gray-600">{prof.specialty}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2 text-sm flex-grow">
              <div className="flex items-center gap-2 text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{prof.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{prof.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600 pt-2">
                <Users className="h-4 w-4" />
                <span className="font-medium">{getApprovedClientsCount(prof.id)} clientes aprovados</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => onEdit(prof)} // Ação de edição já estava correta
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                <Edit className="h-4 w-4" />
                Editar
              </button>
              {/* 3. Adicione o botão de exclusão */}
              <button
                onClick={() => onDelete(prof.id)}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors text-sm"
                aria-label="Excluir profissional"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// Componente Principal do AdminPanel
const AdminPanel = ({
  appointments,
  loading,
  onUpdateStatus,
  onEditAppointment,
  onRefresh
}) => {
  // --- 1. DECLARAÇÃO DE TODOS OS ESTADOS ---
  // Estados para filtros e dados
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [professionalFilter, setProfessionalFilter] = useState('all');
  const [localAppointments, setLocalAppointments] = useState(appointments);
  const [professionals, setProfessionals] = useState([]);

  // Estados para controle da UI (Interface do Usuário)
  const [activeTab, setActiveTab] = useState('appointments');
  const [showFilters, setShowFilters] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProfessional, setEditingProfessional] = useState(null);
  const [isLoadingProfessionals, setIsLoadingProfessionals] = useState(false); // CORREÇÃO: Estado declarado aqui

  // --- 2. FUNÇÕES DE LÓGICA E MANIPULAÇÃO DE DADOS (HANDLERS) ---

  // Função centralizada para buscar profissionais
  const fetchProfessionals = useCallback(async () => {
    setIsLoadingProfessionals(true); // Agora a função existe
    try {
      const profs = await appointmentService.getAllProfessionals();
      setProfessionals(profs);
    } catch (error) {
      console.error("Erro ao buscar profissionais:", error);
      alert("Ocorreu um erro ao carregar a lista de profissionais. Verifique o console.");
    } finally {
      setIsLoadingProfessionals(false);
    }
  }, []); // useCallback com array de dependências vazio

  // Funções para controlar o modal de edição
  const handleCloseModal = () => {
    setShowEditModal(false);
    setEditingProfessional(null);
  };

  const handleEditProfessional = (prof) => {
    setEditingProfessional(prof);
    setShowEditModal(true);
  };

  // Função de logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  // --- 3. EFEITOS COLATERAIS (useEffect) ---

  // Efeito para sincronizar os agendamentos recebidos via props
  useEffect(() => {
    setLocalAppointments(appointments);
  }, [appointments]);

  // Efeito para buscar os profissionais na montagem inicial do componente
  useEffect(() => {
    fetchProfessionals();
  }, [fetchProfessionals]); // Dependência correta

  const formatLocalDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  const handleUpdateStatus = async (appointmentId, newStatus) => {
    setUpdatingStatus(prev => ({ ...prev, [appointmentId]: true }));

    try {
      await onUpdateStatus(appointmentId, newStatus);
      setLocalAppointments(prev =>
        prev.map(apt =>
          apt.id === appointmentId ? { ...apt, status: newStatus } : apt
        )
      );
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setUpdatingStatus(prev => {
        const updated = { ...prev };
        delete updated[appointmentId];
        return updated;
      });
    }
  };

  const handleUpdateProfessional = async (updatedData) => {
    if (!editingProfessional) return;
    try {
      await appointmentService.updateProfessional(editingProfessional.id, updatedData);
      await fetchProfessionals(); // Recarrega a lista do banco
      handleCloseModal();
    } catch (error) {
      console.error("Erro ao atualizar profissional:", error);
      alert("Não foi possível salvar as alterações. Verifique o console.");
    }
  };

  const handleDeleteProfessional = async (profId) => {
    if (window.confirm("Tem certeza que deseja excluir este profissional? Esta ação não pode ser desfeita.")) {
      try {
        await appointmentService.deleteProfessional(profId);
        await fetchProfessionals(); // Recarrega a lista do banco
      } catch (error) {
        console.error("Erro ao excluir profissional:", error);
        alert("Não foi possível excluir o profissional. Verifique o console.");
      }
    }
  };

  const filteredAppointments = localAppointments.filter(apt => {
    if (selectedFilter !== 'all' && apt.status !== selectedFilter) return false;
    if (professionalFilter !== 'all' && apt.professionalId !== professionalFilter) return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchName = apt.name?.toLowerCase().includes(search);
      const matchEmail = apt.email?.toLowerCase().includes(search);
      const matchPhone = apt.phone?.includes(searchTerm.replace(/\D/g, ''));
      if (!matchName && !matchEmail && !matchPhone) return false;
    }

    if (dateFilter.start) {
      const start = new Date(dateFilter.start);
      if (new Date(apt.date) < start) return false;
    }

    if (dateFilter.end) {
      const end = new Date(dateFilter.end + 'T23:59:59');
      if (new Date(apt.date) > end) return false;
    }

    return true;
  });

  const stats = {
    total: localAppointments.length,
    pending: localAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.PENDING).length,
    approved: localAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.APPROVED).length,
    cancelled: localAppointments.filter(apt => apt.status === APPOINTMENT_STATUS.CANCELLED).length
  };

  const exportToCSV = () => {
    const headers = ['Nome', 'Email', 'Telefone', 'Serviço', 'Profissional', 'Data', 'Horário', 'Status'];
    const rows = filteredAppointments.map(apt => {
      const service = SERVICES.find(s => s.id === apt.service);
      const professional = professionals.find(p => p.id === apt.professionalId);
      return [
        apt.name,
        apt.email,
        apt.phone,
        service?.name,
        professional?.name || 'Não atribuído',
        formatLocalDate(apt.date),
        apt.time,
        apt.status
      ].map(field => `"${String(field || '').replace(/"/g, '""')}"`); // Handle commas and quotes
    });

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([`\uFEFF${csvContent}`], { type: 'text/csv;charset=utf-8;' }); // Add BOM for Excel
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agendamentos-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleAddProfessional = async (profData) => {
    try {
      await appointmentService.createProfessional(profData);
      await fetchProfessionals(); // Recarrega a lista do banco
    } catch (error) {
      console.error("Erro ao adicionar profissional:", error);
      alert("Não foi possível adicionar o profissional. Verifique o console.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Dashboard Admin</h1>
              <p className="text-gray-600">Gerencie agendamentos, profissionais e visualize métricas</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Configurações</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('appointments')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'appointments'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Agendamentos
            </button>
            <button
              onClick={() => setActiveTab('professionals')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'professionals'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Profissionais
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${activeTab === 'analytics'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {activeTab === 'appointments' && (
          <>
            {/* Cards de Estatísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${selectedFilter === 'all' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <BarChart3 className="h-6 w-6 text-blue-600" />
                  </div>
                  <TrendingUp className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </button>

              <button
                onClick={() => setSelectedFilter('pending')}
                className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${selectedFilter === 'pending' ? 'border-yellow-500 ring-2 ring-yellow-200' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-yellow-50 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Pendentes</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </button>

              <button
                onClick={() => setSelectedFilter('approved')}
                className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${selectedFilter === 'approved' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Aprovados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </button>

              <button
                onClick={() => setSelectedFilter('cancelled')}
                className={`bg-white p-6 rounded-xl shadow-sm border-2 transition-all hover:shadow-md ${selectedFilter === 'cancelled' ? 'border-red-500 ring-2 ring-red-200' : 'border-gray-200'
                  }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="p-3 bg-red-50 rounded-lg">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 font-medium">Cancelados</p>
                <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
              </button>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nome, email ou telefone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <Filter className="h-4 w-4" />
                    <span className="hidden sm:inline">Filtros</span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                  </button>
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span className="hidden sm:inline">Exportar</span>
                  </button>
                  <button
                    onClick={() => onRefresh()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Atualizar</span>
                  </button>
                </div>
              </div>

              {showFilters && (
                <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                    <select
                      value={selectedFilter}
                      onChange={(e) => setSelectedFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos</option>
                      <option value="pending">Pendentes</option>
                      <option value="approved">Aprovados</option>
                      <option value="cancelled">Cancelados</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Profissional</label>
                    <select
                      value={professionalFilter}
                      onChange={(e) => setProfessionalFilter(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">Todos</option>
                      {professionals.map(prof => (
                        <option key={prof.id} value={prof.id}>{prof.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                    <input
                      type="date"
                      value={dateFilter.start}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                    <input
                      type="date"
                      value={dateFilter.end}
                      onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Lista de Agendamentos */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  Agendamentos ({filteredAppointments.length})
                </h2>
              </div>

              {filteredAppointments.length === 0 ? (
                <div className="p-12 text-center">
                  <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 text-lg">Nenhum agendamento encontrado</p>
                  <p className="text-gray-400 text-sm mt-1">Tente ajustar os filtros de busca</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {filteredAppointments.map(apt => {
                    const service = SERVICES.find(s => s.id === apt.service);
                    const professional = professionals.find(p => p.id === apt.professionalId);
                    const isUpdating = updatingStatus[apt.id];

                    return (
                      <div key={apt.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex flex-col lg:flex-row gap-6">
                          <div className="flex-1">
                            <div className="flex items-start gap-4">
                              <div className="p-3 bg-gray-100 rounded-full">
                                <User className="h-6 w-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-semibold text-gray-900 text-lg mb-2">{apt.name}</h3>
                                <div className="space-y-1 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    <span>{apt.email}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4" />
                                    <span>{apt.phone}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Serviço</p>
                              <p className="font-semibold text-gray-900 mb-2">{service?.name}</p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-4 w-4" />
                                  <span>R$ {service?.price}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  <span>{service?.duration}min</span>
                                </div>
                              </div>
                              {professional && (
                                <div className="mt-2 flex items-center gap-2 text-sm text-gray-600">
                                  <UserPlus className="h-4 w-4" />
                                  <span>{professional.name}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex-1">
                            <div className="p-4 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-600 uppercase tracking-wide mb-1">Agendamento</p>
                              <div className="flex items-center gap-2 mb-1">
                                <Calendar className="h-4 w-4 text-blue-600" />
                                <span className="font-semibold text-gray-900">{formatLocalDate(apt.date)}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-blue-600" />
                                <span className="text-gray-700">{apt.time}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 lg:w-48">
                            <span className={`inline-flex items-center justify-center px-3 py-2 text-sm rounded-lg font-medium ${apt.status === 'approved' ? 'bg-green-100 text-green-800' :
                              apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                              {apt.status === 'approved' ? '✓ Aprovado' :
                                apt.status === 'pending' ? '⏳ Pendente' : '✕ Cancelado'}
                            </span>

                            {isUpdating && (
                              <div className="flex items-center justify-center text-sm text-gray-500">
                                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                Atualizando...
                              </div>
                            )}

                            {apt.status === 'pending' && !isUpdating && (
                              <div className="flex flex-col gap-2">
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'approved')}
                                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  Aprovar
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(apt.id, 'cancelled')}
                                  className="flex items-center justify-center gap-2 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                                >
                                  <XCircle className="h-4 w-4" />
                                  Recusar
                                </button>
                              </div>
                            )}

                            <button
                              onClick={() => onEditAppointment(apt)}
                              disabled={isUpdating}
                              className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors text-sm font-medium"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'professionals' && (
          isLoadingProfessionals ? (
            <div className="text-center p-10">
              <p className="text-gray-500">Carregando profissionais...</p>
            </div>
          ) : (
            <ProfessionalManager
              // CORREÇÃO: Filtre a lista para garantir que todos os itens tenham um ID válido
              professionals={professionals.filter(prof => prof && prof.id)}
              onAdd={handleAddProfessional}
              onEdit={handleEditProfessional}
              onDelete={handleDeleteProfessional}
              appointments={localAppointments}
            />
          )
        )}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard
            appointments={localAppointments}
            professionals={professionals}
          />
        )}

        {showEditModal && editingProfessional && (
          <EditProfessionalModal
            professional={editingProfessional}
            onClose={handleCloseModal}
            onSave={handleUpdateProfessional}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPanel;