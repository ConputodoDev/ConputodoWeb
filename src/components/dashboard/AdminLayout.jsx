import React, { useState } from 'react';
import AdminSidebar from './AdminSidebar';
import { User, Menu, Eye } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLayout = ({ children, currentView, onChangeView, pendingOrdersCount = 0, onSwitchToStore }) => {
  const { user } = useAdminAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Nuevo estado para Móvil

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-neutral-800 overflow-hidden">
      
      {/* Sidebar Híbrido (Desktop Fijo / Móvil Desplegable) */}
      <AdminSidebar 
        currentView={currentView} 
        onChangeView={(view) => {
            onChangeView(view);
            setIsSidebarOpen(false); // Cerrar menú al navegar en móvil
        }}
        pendingOrdersCount={pendingOrdersCount}
        isOpen={isSidebarOpen} // Prop nueva
        onClose={() => setIsSidebarOpen(false)} // Prop nueva
      />

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex justify-between items-center shrink-0 z-10 shadow-sm">
             <div className="flex items-center gap-3 md:gap-4">
                 {/* Botón Hamburguesa (Solo visible en Móvil) */}
                 <button 
                    onClick={() => setIsSidebarOpen(true)}
                    className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                 >
                    <Menu size={24}/>
                 </button>
                 
                 <h2 className="text-lg md:text-xl font-bold text-gray-800 capitalize truncate">
                   {currentView.replace('-', ' ')}
                 </h2>
             </div>
             
             <div className="flex items-center gap-3 md:gap-4">
                 {/* BOTÓN VER TIENDA */}
                 <button 
                   onClick={onSwitchToStore}
                   className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-lg text-xs md:text-sm font-bold transition-colors border border-neutral-200"
                 >
                   <Eye size={16} /> <span className="hidden sm:inline">Ver Tienda</span>
                 </button>

                 <div className="hidden sm:flex flex-col text-right">
                     <span className="text-sm font-bold text-gray-800">{user?.email}</span>
                     <span className="text-[10px] text-[#FF6600] font-bold uppercase tracking-wider">
                        {user?.role === 'admin' ? 'Administrador' : 'Ventas'}
                     </span>
                 </div>
                 <div className="w-9 h-9 md:w-10 md:h-10 bg-orange-50 rounded-full flex items-center justify-center border-2 border-orange-100 text-[#FF6600]">
                     <User size={20} />
                 </div>
             </div>
        </header>

        {/* Área de Contenido Scrollable */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-gray-50/50">
           <div className="max-w-7xl mx-auto">
              {children}
           </div>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;