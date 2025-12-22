import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Usamos las credenciales directas para asegurar la conexión inmediata
const firebaseConfig = {
apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// --- AGREGAR ESTO PARA DEBUG (Bórralo después) ---
console.log("DEBUG CONFIG:", {
  apiKey: firebaseConfig.apiKey ? "OK" : "MISSING",
  projectId: firebaseConfig.projectId ? "OK" : "MISSING",
  fullConfig: firebaseConfig // Solo para ver si están undefined
});
// ------------------------------------------------

// Inicializamos la app
const app = initializeApp(firebaseConfig);

// Inicializamos y exportamos los servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);