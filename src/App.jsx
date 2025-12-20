import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Loader2, Lock, LogIn, ArrowLeft } from 'lucide-react';

// IMPORTA TUS COMPONENTES
import StoreFront from './StoreFront';
import FullDashboard from './FullDashboard'; // <--- ASEGÚRATE QUE ESTE NOMBRE SEA CORRECTO

function App() {
  const [user, setUser] = useState(null); // Usuario logueado
  const [loading, setLoading] = useState(true); // Cargando sesión
  const [showLogin, setShowLogin] = useState(false); // Mostrar formulario login

  const auth = getAuth();

  useEffect(() => {
    // 1. Detectar si hay alguien logueado (persistencia de sesión)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // 2. Detectar "Llave Secreta" en la URL (?admin=true)
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      setShowLogin(true);
    }

    return () => unsubscribe();
  }, []);

  // Función para cerrar sesión desde el Dashboard (pásasela como prop si quieres)
  const handleLogout = () => {
    signOut(auth);
    setShowLogin(false);
    // Limpiar URL
    window.history.pushState({}, document.title, "/");
  };

  // VISTA 1: Cargando...
  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#FF6600]" size={48} />
      </div>
    );
  }

  // VISTA 2: Si hay usuario logueado -> MOSTRAR DASHBOARD
  if (user) {
    return <FullDashboard user={user} onLogout={handleLogout} />;
  }

  // VISTA 3: Si no hay usuario pero activó el modo admin -> MOSTRAR LOGIN
  if (showLogin) {
    return <AdminLogin auth={auth} onCancel={() => setShowLogin(false)} />;
  }

  // VISTA 4: Por defecto -> MOSTRAR TIENDA
  return <StoreFront />;
}

// --- SUB-COMPONENTE: PANTALLA DE LOGIN ---
function AdminLogin({ auth, onCancel }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // El useEffect del padre detectará el cambio y mostrará el Dashboard
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas. Acceso denegado.');
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative">
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 text-gray-400 hover:text-[#FF6600] flex items-center gap-1 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16}/> Volver a la Tienda
        </button>
        
        <div className="text-center mb-8 mt-6">
          <div className="w-16 h-16 bg-orange-100 text-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Acceso Administrativo</h2>
          <p className="text-slate-500 text-sm">Ingresa tus credenciales de propietario.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Correo</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#FF6600] outline-none transition-colors"
              placeholder="admin@conputodo.com"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contraseña</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#FF6600] outline-none transition-colors"
              placeholder="••••••••"
              required 
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2">
              <XCircle size={16} /> {error}
            </div>
          )}

          <button 
            disabled={loggingIn}
            className="w-full py-4 bg-[#FF6600] hover:bg-orange-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200"
          >
            {loggingIn ? <Loader2 className="animate-spin"/> : <LogIn size={20}/>}
            {loggingIn ? 'Verificando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Icono auxiliar (si no lo tienes importado arriba)
function XCircle({size}) { return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>; }

export default App;