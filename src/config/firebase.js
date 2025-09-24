// src/config/firebase.js

// Import SDKs necessários
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// opcional (se quiser usar Analytics no navegador com https)
import { getAnalytics } from "firebase/analytics";

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

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const analytics = getAnalytics(app);

// Exporte os serviços para usar em outros arquivos
export { auth, db };
