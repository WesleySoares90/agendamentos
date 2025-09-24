import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './config/firebase';
import { useAppointments } from './hooks/useAppointments';
import BookingForm from './components/BookingForm';
import LoginForm from './components/LoginForm';
import AdminPanel from './components/AdminPanel';
import { Shield } from 'lucide-react';
import './index.css';

function App() {
  const [currentView, setCurrentView] = useState('booking');
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [editingAppointment, setEditingAppointment] = useState(null);

  const {
    appointments,
    loading,
    error,
    fetchAppointments,
    createAppointment,
    updateAppointmentStatus,
    updateAppointment
  } = useAppointments();

  // Monitorar autenticação
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setAuthLoading(false);
      if (user) {
        setCurrentView('admin');
      }
    });

    return () => unsubscribe();
  }, []);

  // Handlers
  const handleBookingSubmit = async (formData) => {
    if (editingAppointment) {
      const result = await updateAppointment(editingAppointment.id, formData);
      if (result.success) {
        setEditingAppointment(null);
        setCurrentView('admin');
      }
      return result;
    } else {
      return await createAppointment(formData);
    }
  };

  const handleLoginSuccess = () => {
    setCurrentView('admin');
  };

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
      <div className="container">
        <div className="card text-center">
          <p>Carregando...</p>
        </div>
      </div>
    );
  }

  // View: Login Admin
  if (currentView === 'login') {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
        <LoginForm 
          onSuccess={handleLoginSuccess}
          onBack={handleBackToBooking}
        />
      </div>
    );
  }

  // View: Admin Panel
  if (currentView === 'admin' && user) {
    return (
      <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
        <AdminPanel
          appointments={appointments}
          loading={loading}
          onUpdateStatus={updateAppointmentStatus}
          onEditAppointment={handleEditAppointment}
          onRefresh={fetchAppointments}
        />
      </div>
    );
  }

  // View: Booking Form (padrão)
  return (
    <div style={{ minHeight: '100vh', padding: '2rem 1rem' }}>
      <BookingForm
        onSubmit={handleBookingSubmit}
        loading={loading}
        editingAppointment={editingAppointment}
      />
      
      {error && (
        <div className="container" style={{ marginTop: '1rem' }}>
          <div className="alert alert-error">
            ⚠️ {error}
          </div>
        </div>
      )}

      {/* Botão Admin */}
      <div style={{ textAlign: 'center', marginTop: '2rem' }}>
        <button
          onClick={() => setCurrentView('login')}
          style={{
            background: 'none',
            border: 'none',
            color: '#3b82f6',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            margin: '0 auto',
            fontSize: '0.875rem'
          }}
        >
          <Shield size={16} />
          Acesso Administrativo
        </button>
      </div>
    </div>
  );
}

export default App;