// src/config/firebase.js

// Import SDKs necessários
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// opcional (se quiser usar Analytics no navegador com https)
import { getAnalytics } from "firebase/analytics";
import { getMessaging } from 'firebase/messaging';

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyB-zmBEaB41rKRBr84D9t5Ay0e0qLBzmPM",
  authDomain: "sistema-agendamento-2025.firebaseapp.com",
  projectId: "sistema-agendamento-2025",
  storageBucket: "sistema-agendamento-2025.firebasestorage.app",
  messagingSenderId: "110599137058",
  appId: "1:110599137058:web:a0fb321c4c0daf2fa2e77b",
  measurementId: "G-J6YLGY88R3"
};

export const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const analytics = getAnalytics(app);
export const messaging = getMessaging(app);