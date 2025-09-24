import React, { useState } from 'react';
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
  Calendar
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { SERVICES, APPOINTMENT_STATUS } from '../utils/constants';

const AdminPanel = ({ 
  appointments, 
  loading, 
  onUpdateStatus, 
  onEditAppointment, 
  onRefresh 
}) => {
  const [selectedFilter, setSelectedFilter] = useState('all');

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (selectedFilter === 'all') return true;
    return apt.status === selectedFilter;
  });

  const stats = {
    total: appointments.length,
    pending: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.PENDING).length,
    approved: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.APPROVED).length,
    cancelled: appointments.filter(apt => apt.status === APPOINTMENT_STATUS.CANCELLED).length
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <div className="flex items-center space-x-4">
            <button 
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>{loading ? 'Carregando...' : 'Atualizar'}</span>
            </button>
            <button 
              onClick={handleLogout}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Sair</span>
            </button>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Pendentes</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Aprovados</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-red-50 p-6 rounded-lg">
            <div className="flex items-center">
              <XCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Cancelados</p>
                <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex items-center space-x-4 mb-6">
          <Filter className="h-5 w-5 text-gray-600" />
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-w-48"
          >
            <option value="all">Todos os agendamentos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="cancelled">Cancelados</option>
          </select>
        </div>

        {/* Lista de Agendamentos */}
        <div>
          {filteredAppointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                {appointments.length === 0 ? 'Nenhum agendamento encontrado.' : 'Nenhum agendamento para este filtro.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAppointments.map(appointment => {
                const service = SERVICES.find(s => s.id === appointment.service);
                return (
                  <div 
                    key={appointment.id} 
                    className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Informações do Cliente */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {appointment.name}
                        </h4>
                        <div className="space-y-2">
                          <p className="text-sm text-gray-600 flex items-center">
                            <Mail className="h-3 w-3 mr-2" />
                            {appointment.email}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Phone className="h-3 w-3 mr-2" />
                            {appointment.phone}
                          </p>
                        </div>
                      </div>

                      {/* Serviço */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Serviço</h4>
                        <p className="text-gray-800">{service?.name}</p>
                        <p className="text-sm text-gray-600">
                          R$ {service?.price} - {service?.duration}min
                        </p>
                      </div>

                      {/* Data e Hora */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3 flex items-center">
                          <Calendar className="h-4 w-4 mr-2" />
                          Data/Hora
                        </h4>
                        <p className="text-gray-800">
                          {new Date(appointment.date).toLocaleDateString('pt-BR')}
                        </p>
                        <p className="text-sm text-gray-600">{appointment.time}</p>
                      </div>

                      {/* Status e Ações */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-3">Status</h4>
                        <div className="mb-4">
                          <span className={`inline-flex px-3 py-1 text-xs rounded-full font-medium ${
                            appointment.status === 'approved' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {appointment.status === 'approved' ? 'Aprovado' :
                             appointment.status === 'pending' ? 'Pendente' : 'Cancelado'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          {appointment.status === 'pending' && (
                            <>
                              <button
                                onClick={() => onUpdateStatus(appointment.id, 'approved')}
                                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
                              >
                                <CheckCircle className="h-3 w-3" />
                                <span>Aprovar</span>
                              </button>
                              <button
                                onClick={() => onUpdateStatus(appointment.id, 'cancelled')}
                                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
                              >
                                <XCircle className="h-3 w-3" />
                                <span>Cancelar</span>
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => onEditAppointment(appointment)}
                            className="flex items-center space-x-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-md text-sm hover:bg-gray-200 transition-colors"
                          >
                            <Edit className="h-3 w-3" />
                            <span>Editar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;