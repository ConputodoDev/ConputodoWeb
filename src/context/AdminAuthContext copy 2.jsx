import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';

const AdminAuthContext = createContext();

export const useAdminAuth = () => {
  return useContext(AdminAuthContext);
};

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // Buscamos el rol en la base de datos
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.email));
          let role = 'admin'; // Rol por defecto (por seguridad o legacy)
          
          if (userDoc.exists()) {
            role = userDoc.data().role || 'admin';
          }
          
          // Inyectamos el rol en el objeto usuario
          setUser({ ...currentUser, role });
        } catch (error) {
          console.error("Error al obtener rol:", error);
          // En caso de error, asumimos admin para no bloquear al dueño si falla la red, 
          // o podrías poner 'sales' para ser más restrictivo.
          setUser({ ...currentUser, role: 'admin' });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const logout = () => {
    return signOut(auth);
  };

  const value = {
    user,
    loading,
    login,
    logout
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {!loading && children}
    </AdminAuthContext.Provider>
  );
};