import React from 'react';
import AdminSidebar from './AdminSidebar';
import { User, Menu } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const AdminLayout = ({ children, currentView, onChangeView, pendingOrdersCount = 0 }) => {
  const { user } = useAdminAuth();

  return (
    <div className="flex h-screen bg-gray-50 font-sans text-neutral-800 overflow-hidden">
      
      {/* Sidebar Desktop */}
      <AdminSidebar 
        currentView={currentView} 
        onChangeView={onChangeView} 
        pendingOrdersCount={pendingOrdersCount}
      />

      {/* Contenido Principal */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden relative">
        
        {/* Header Superior */}
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex justify-between items-center shrink-0 z-10 shadow-sm">
             <div className="flex items-center gap-4">
                 {/* Botón menú móvil (pendiente de implementar lógica móvil completa) */}
                 <button className="md:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Menu size={20}/>
                 </button>
                 <h2 className="text-xl font-bold text-gray-800 capitalize">
                   {currentView.replace('-', ' ')}
                 </h2>
             </div>
             
             <div className="flex items-center gap-4">
                 <div className="hidden sm:flex flex-col text-right">
                     <span className="text-sm font-bold text-gray-800">{user?.email}</span>
                     <span className="text-[10px] text-[#FF6600] font-bold uppercase tracking-wider">Administrador</span>
                 </div>
                 <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center border-2 border-orange-100 text-[#FF6600]">
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