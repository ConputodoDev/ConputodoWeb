import React, { useState } from 'react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { Loader2, XCircle } from 'lucide-react';

const LoginPage = () => {
  const { login } = useAdminAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      // El cambio de estado en AuthContext redirigirá automáticamente
    } catch (err) {
      console.error(err);
      setError("Credenciales incorrectas o error de conexión.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 font-sans">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-[#FF6600] animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6600] rounded-xl mx-auto flex items-center justify-center mb-4 text-white font-bold text-2xl shadow-lg shadow-orange-200">
            C
          </div>
          <h1 className="text-2xl font-bold text-neutral-800">Conputodo Admin</h1>
          <p className="text-neutral-500 text-sm">Acceso restringido</p>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2 border border-red-100 animate-pulse">
            <XCircle size={16}/> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              required 
              value={email} 
              onChange={e=>setEmail(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-orange-100 transition-all" 
              placeholder="admin@conputodo.com"
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-neutral-700 mb-1">Contraseña</label>
            <input 
              type="password" 
              required 
              value={password} 
              onChange={e=>setPassword(e.target.value)} 
              className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none focus:border-[#FF6600] focus:ring-2 focus:ring-orange-100 transition-all" 
              placeholder="••••••••"
            />
          </div>
          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#FF6600] text-white py-3.5 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg hover:shadow-orange-200 active:scale-95 flex justify-center items-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" size={20}/> : "Ingresar al Sistema"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;