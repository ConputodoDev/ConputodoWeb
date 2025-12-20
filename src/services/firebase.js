import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Usamos las credenciales directas para asegurar la conexión inmediata
const firebaseConfig = {
  apiKey: "AIzaSyBQNJvum1U9JqnIiM-e_Nkibvjxa_o5OO8",
  authDomain: "tienda-admin-1c383.firebaseapp.com",
  projectId: "tienda-admin-1c383",
  storageBucket: "tienda-admin-1c383.firebasestorage.app",
  messagingSenderId: "869294981306",
  appId: "1:869294981306:web:92fdc803e7424bc3b50283",
  measurementId: "G-0PKGRZ1TD9"
};

// Inicializamos la app
const app = initializeApp(firebaseConfig);

// Inicializamos y exportamos los servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);