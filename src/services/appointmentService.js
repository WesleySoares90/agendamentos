// src/services/appointmentService.js

import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  getDoc, 
  setDoc, 
} from 'firebase/firestore';
import { db } from '../config/firebase';

const COLLECTION_NAME = 'appointments';
const PROFESSIONALS_COLLECTION_NAME = 'professionals';
const SETTINGS_COLLECTION_NAME = 'settings';
const SETTINGS_DOC_ID = 'main'; 

export const appointmentService = {
  // ... (create, getAll, update, delete)
  async create(appointmentData) {
    try {
      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...appointmentData,
        status: appointmentData.status || 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar agendamento:', error.message);
      throw error;
    }
  },

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

  // **Função chave que agora será usada corretamente**
  async checkTimeConflict(date, time, professionalId, excludeId = null) {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('date', '==', date),
        where('time', '==', time),
        where('professionalId', '==', professionalId), // Filtro por profissional é crucial
        where('status', '!=', 'cancelled')
      );
      const querySnapshot = await getDocs(q);
      const conflicts = querySnapshot.docs.filter(doc => doc.id !== excludeId);
      return conflicts.length > 0;
    } catch (error) {
      console.error('Erro ao verificar conflito:', error);
      throw error;
    }
  },

  // --- Funções para Profissionais ---
  async createProfessional(profData) {
    try {
      const docRef = await addDoc(collection(db, PROFESSIONALS_COLLECTION_NAME), {
        ...profData,
        createdAt: new Date(),
      });
      return { ...profData, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar profissional:', error);
      throw error;
    }
  },

  async getAllProfessionals() {
    try {
      const q = query(
        collection(db, PROFESSIONALS_COLLECTION_NAME),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar profissionais:', error);
      throw error;
    }
  },
  async updateProfessional(id, updateData) {
    try {
      // Se 'db' for importado corretamente, esta linha funcionará.
      const docRef = doc(db, PROFESSIONALS_COLLECTION_NAME, id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      // O erro original acontecia antes de chegar aqui, mas agora o catch funcionará corretamente.
      console.error('Erro ao atualizar profissional:', error);
      throw error;
    }
  },

  async deleteProfessional(id) {
    try {
      const docRef = doc(db, PROFESSIONALS_COLLECTION_NAME, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar profissional:', error);
      throw error;
    }
  },

  async createService(serviceData) {
    try {
      const docRef = await addDoc(collection(db, 'services'), {
        ...serviceData,
        createdAt: new Date(),
      });
      return { ...serviceData, id: docRef.id };
    } catch (error) {
      console.error('Erro ao criar serviço:', error);
      throw error;
    }
  },

  async getAllServices() {
    try {
      const q = query(
        collection(db, 'services'),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Erro ao buscar serviços:', error);
      throw error;
    }
  },

  async updateService(id, updateData) {
    try {
      const docRef = doc(db, 'services', id);
      await updateDoc(docRef, {
        ...updateData,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error('Erro ao atualizar serviço:', error);
      throw error;
    }
  },

  async deleteService(id) {
    try {
      const docRef = doc(db, 'services', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Erro ao deletar serviço:', error);
      throw error;
    }
  },

  async getSettings() {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION_NAME, SETTINGS_DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return docSnap.data(); // Retorna as configurações existentes
      } else {
        // Se o documento não existe, cria um com valores padrão e o retorna
        console.log("Documento de configurações não encontrado, criando um novo.");
        const defaultSettings = {
          autoApprove: false,
          confirmationMessage: 'Seu agendamento foi confirmado com sucesso! Aguardamos você.',
          workingHours: {
            seg: { active: true, start: '09:00', end: '18:00' },
            ter: { active: true, start: '09:00', end: '18:00' },
            qua: { active: true, start: '09:00', end: '18:00' },
            qui: { active: true, start: '09:00', end: '18:00' },
            sex: { active: true, start: '09:00', end: '18:00' },
            sab: { active: false, start: '09:00', end: '14:00' },
            dom: { active: false, start: '09:00', end: '18:00' }
          }
        };
        await setDoc(docRef, defaultSettings, { merge: true });
        return defaultSettings;
      }
    } catch (error) {
      console.error("Erro ao buscar configurações:", error);
      throw error;
    }
  },

  /**
   * Atualiza o documento de configurações com novos dados.
   * @param {object} settingsData - Os campos a serem atualizados.
   */
  async updateSettings(settingsData) {
    try {
      const docRef = doc(db, SETTINGS_COLLECTION_NAME, SETTINGS_DOC_ID);
      // setDoc com { merge: true } atualiza os campos existentes sem sobrescrever o documento inteiro
      await setDoc(docRef, settingsData, { merge: true });
    } catch (error) {
      console.error("Erro ao atualizar configurações:", error);
      throw error;
    }
  },
};





