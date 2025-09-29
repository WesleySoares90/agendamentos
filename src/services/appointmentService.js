import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'appointments';

export const appointmentService = {
  // Criar novo agendamento
async create(appointmentData) {
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), { 
      ...appointmentData,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return docRef.id;
  } catch (error) {
    // Adicione esta linha para ver o erro detalhado no console
    console.error('Erro ao criar agendamento:', error.message); 
    throw error;
  }
},

  // Buscar todos os agendamentos
  async getAll() {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate()
      }));
    } catch (error) {
      console.error('Erro ao buscar agendamentos:', error);
      throw error;
    }
  },

  // Atualizar agendamento
  async update(id, updateData) {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar agendamento:', error);
      throw error;
    }
  },

  // Deletar agendamento
  async delete(id) {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
    } catch (error) {
      console.error('Erro ao deletar agendamento:', error);
      throw error;
    }
  },

  // Verificar conflitos de horário
  async checkTimeConflict(date, time, excludeId = null) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '==', date),
        where('time', '==', time),
        where('status', '!=', 'cancelled')
      );
      const querySnapshot = await getDocs(q);
      const conflicts = querySnapshot.docs.filter(doc => doc.id !== excludeId);
      return conflicts.length > 0;
    } catch (error) {
      console.error('Erro ao verificar conflito:', error);
      throw error;
    }
  }
};