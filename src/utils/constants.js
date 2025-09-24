export const SERVICES = [
    { id: 'haircut', name: 'Corte de Cabelo', duration: 60, price: 50 },
    { id: 'massage', name: 'Massagem Relaxante', duration: 90, price: 80 },
    { id: 'facial', name: 'Limpeza de Pele', duration: 75, price: 65 },
    { id: 'manicure', name: 'Manicure', duration: 45, price: 35 }
  ];
  
  export const TIME_SLOTS = [
    '09:00', '10:00', '11:00', '14:00', '15:00', '16:00', '17:00', '18:00'
  ];
  
  export const APPOINTMENT_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    CANCELLED: 'cancelled'
  };