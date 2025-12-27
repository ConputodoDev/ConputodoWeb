import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { Loader2, Lock, LogIn, ArrowLeft, ShieldAlert } from 'lucide-react'; // Agregué ShieldAlert

// IMPORTA TUS COMPONENTES
import StoreFront from './StoreFront';
import FullDashboard from './FullDashboard';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  const auth = getAuth();

  // LEEMOS TU LLAVE SECRETA DEL ARCHIVO .ENV
  // Si no existe, usamos una por defecto muy difícil para que nadie entre por error
  const SECRET_KEY = import.meta.env.VITE_ADMIN_KEY || "clave_super_segura_por_defecto_123";

  useEffect(() => {
    // 1. Detectar si hay alguien logueado (persistencia de sesión)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    // 2. SISTEMA DE SEGURIDAD PERSONALIZADO
    // Buscamos el parámetro '?acceso=' en la URL
    const params = new URLSearchParams(window.location.search);
    const accessAttempt = params.get('acceso'); // Puedes cambiar 'acceso' por lo que quieras

    // Comparamos lo que escribieron en la URL con tu clave secreta del .env
    if (accessAttempt === SECRET_KEY) {
      setShowLogin(true);
    }

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    setShowLogin(false);
    // Limpiamos la URL para que no quede el rastro de la llave
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
    return <FullDashboard />; // FullDashboard ya maneja su propio contexto de usuario internamente
  }

  // VISTA 3: Si la llave es correcta -> MOSTRAR LOGIN
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
    } catch (err) {
      console.error(err);
      setError('Credenciales inválidas. Acceso denegado.');
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl relative animate-in fade-in zoom-in duration-300">
        <button 
          onClick={onCancel}
          className="absolute top-4 left-4 text-gray-400 hover:text-[#FF6600] flex items-center gap-1 text-sm font-bold transition-colors"
        >
          <ArrowLeft size={16}/> Salir
        </button>
        
        <div className="text-center mb-8 mt-6">
          <div className="w-16 h-16 bg-orange-100 text-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-orange-200/50">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Búnker Administrativo</h2>
          <p className="text-slate-500 text-sm">Sistema protegido. Solo personal autorizado.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Usuario</label>
            <input 
              type="email" 
              value={email} 
              onChange={e => setEmail(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#FF6600] outline-none transition-colors bg-gray-50 focus:bg-white"
              placeholder="admin@conputodo.com"
              required 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Clave de Acceso</label>
            <input 
              type="password" 
              value={password} 
              onChange={e => setPassword(e.target.value)}
              className="w-full p-3 border border-gray-200 rounded-lg focus:border-[#FF6600] outline-none transition-colors bg-gray-50 focus:bg-white"
              placeholder="••••••••"
              required 
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2 border border-red-100">
              <ShieldAlert size={16} /> {error}
            </div>
          )}

          <button 
            disabled={loggingIn}
            className="w-full py-4 bg-[#FF6600] hover:bg-orange-700 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-200 active:scale-95 disabled:opacity-70"
          >
            {loggingIn ? <Loader2 className="animate-spin"/> : <LogIn size={20}/>}
            {loggingIn ? 'Verificando credenciales...' : 'Entrar al Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default App;