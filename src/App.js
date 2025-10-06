// src/App.js

import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { useAppointments } from './hooks/useAppointments';
import { appointmentService } from './services/appointmentService';
import ChatBookingForm from './components/ChatBookingForm';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import { Shield } from 'lucide-react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('booking');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);
  const [professionals, setProfessionals] = useState([]);
  const [resetTrigger, setResetTrigger] = useState(0);

  const {
    appointments,
    loading,
    autoApprove,          
    toggleAutoApprove,   
    error,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    updateAppointment
  } = useAppointments();

  const fetchProfessionals = async () => {
    try {
      const profsData = await appointmentService.getAllProfessionals();
      setProfessionals(profsData);
    } catch (error) {
      console.error("Erro ao carregar profissionais:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      
      if (user) {
        setCurrentView('admin');
      } else {
        // Quando o usuário faz logout, resetar o chat
        setCurrentView('booking');
        setEditingAppointment(null);
        setResetTrigger(prev => prev + 1);
      }
    });
    
    fetchProfessionals();
    return () => unsubscribe();
  }, []);

  const handleBookingSubmit = async (formData) => {
    try {
      if (editingAppointment) {
        const result = await updateAppointment(editingAppointment.id, formData);
        if (result.success) {
          setEditingAppointment(null);
          setCurrentView('booking');
        }
        return result;
      } else {
        return await createAppointment(formData);
      }
    } catch (error) {
      console.error('Erro ao processar agendamento:', error);
      return { 
        success: false, 
        error: 'Erro ao processar agendamento. Tente novamente.' 
      };
    }
  };

  const handleLoginSuccess = () => setCurrentView('admin');
  
  const handleEditAppointment = (appointment) => {
    setEditingAppointment(appointment);
    setCurrentView('booking');
  };
  
  const handleBackToBooking = () => {
    setEditingAppointment(null);
    setCurrentView('booking');
  };

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (currentView === 'login') {
    return <LoginForm onSuccess={handleLoginSuccess} onBack={handleBackToBooking} />;
  }

  if (currentView === 'admin' && user) {
    return (
      <AdminPanel
        appointments={appointments}
        loading={loading}
        autoApprove={autoApprove}            
        onToggleAutoApprove={toggleAutoApprove} 
        onUpdateStatus={updateAppointmentStatus}
        onEditAppointment={handleEditAppointment}
        onRefresh={fetchAppointments}
        professionals={professionals}
        onProfessionalChange={fetchProfessionals}
      />
    );
  }

  return (
    <>
      {currentView !== 'admin' && (
        <div className="absolute top-4 right-4 z-50">
          <button
            onClick={() => setCurrentView(user ? 'admin' : 'login')}
            className="bg-gray-700 text-white p-3 rounded-full hover:bg-gray-800 transition-colors shadow-lg"
            aria-label="Acessar painel administrativo"
          >
            <Shield className="h-6 w-6" />
          </button>
        </div>
      )}

      <ChatBookingForm
        onSubmit={handleBookingSubmit}
        loading={loading}
        editingAppointment={editingAppointment}
        professionals={professionals}
        resetTrigger={resetTrigger}
      />

      {error && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 max-w-md p-4 bg-red-100 text-red-700 rounded-md text-center shadow-lg z-50">
          <p><strong>Erro:</strong> {error}</p>
        </div>
      )}
    </>
  );
}

export default App;