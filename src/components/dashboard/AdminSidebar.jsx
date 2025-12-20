import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Megaphone, Trash2, FileSpreadsheet, LogOut } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex justify-between px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all items-center ${active ? 'bg-[#FF6600] text-white shadow-lg shadow-orange-900/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
  >
    <div className="flex items-center gap-3">
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </div>
    {badge && (
      <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-sm">
        {badge}
      </span>
    )}
  </button>
);

const AdminSidebar = ({ currentView, onChangeView, pendingOrdersCount }) => {
  const { logout } = useAdminAuth();

  return (
    <aside className="w-64 bg-black text-neutral-400 hidden md:flex flex-col flex-shrink-0 border-r border-neutral-800 h-screen sticky top-0">
      {/* Header Sidebar */}
      <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
        <div className="w-8 h-8 bg-[#FF6600] rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-orange-900/50">
          C
        </div>
        <div>
            <span className="text-white font-bold text-lg tracking-wide block leading-none">Conputodo</span>
            <span className="text-[10px] text-neutral-500 font-medium">Panel de Control</span>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
        <NavItem 
          icon={<LayoutDashboard size={20}/>} 
          label="Resumen" 
          active={currentView === 'dashboard'} 
          onClick={() => onChangeView('dashboard')} 
        />
        
        <div className="pt-4 pb-2 px-3 text-xs font-bold text-neutral-600 uppercase tracking-wider">Gestión</div>
        
        <NavItem 
          icon={<ShoppingBag size={20}/>} 
          label="Pedidos" 
          active={currentView === 'orders'} 
          onClick={() => onChangeView('orders')} 
          badge={pendingOrdersCount > 0 ? pendingOrdersCount : null} 
        />
        
        <NavItem 
          icon={<Package size={20}/>} 
          label="Inventario" 
          active={['product-list', 'product-create', 'product-edit'].includes(currentView)} 
          onClick={() => onChangeView('product-list')} 
        />
        
        <NavItem 
          icon={<Megaphone size={20}/>} 
          label="Marketing" 
          active={currentView === 'marketing'} 
          onClick={() => onChangeView('marketing')} 
        />
        
        <div className="pt-4 pb-2 px-3 text-xs font-bold text-neutral-600 uppercase tracking-wider">Sistema</div>
        
        <NavItem 
          icon={<Trash2 size={20}/>} 
          label="Papelera" 
          active={currentView === 'product-trash'} 
          onClick={() => onChangeView('product-trash')} 
        />
        
        <NavItem 
          icon={<FileSpreadsheet size={20}/>} 
          label="Importar / Exportar" 
          active={currentView === 'data-tools'} 
          onClick={() => onChangeView('data-tools')} 
        />
      </nav>

      {/* Footer Sidebar */}
      <div className="p-4 border-t border-neutral-800">
        <button 
          onClick={logout} 
          className="flex items-center gap-2 text-neutral-500 hover:text-red-400 transition-colors w-full px-2 py-2 text-sm font-medium hover:bg-neutral-900 rounded-lg"
        >
          <LogOut size={18} /> 
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;