import React from 'react';
import { LayoutDashboard, ShoppingBag, Package, Megaphone, Trash2, FileSpreadsheet, LogOut, X } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex justify-between px-3 py-3 md:py-2.5 rounded-lg cursor-pointer mb-1 transition-all items-center ${active ? 'bg-[#FF6600] text-white shadow-lg shadow-orange-900/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}
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

const AdminSidebar = ({ currentView, onChangeView, pendingOrdersCount, isOpen, onClose }) => {
  const { logout, user } = useAdminAuth();
  const isAdmin = user?.role === 'admin';

  // Clases base para el Sidebar
  const sidebarClasses = `
    bg-black text-neutral-400 
    flex flex-col flex-shrink-0 border-r border-neutral-800 
    h-screen 
    fixed md:sticky top-0 left-0 z-50 
    w-72 md:w-64 
    transition-transform duration-300 ease-in-out
    ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
  `;

  return (
    <>
        {/* OVERLAY (Fondo oscuro en móvil) */}
        {isOpen && (
            <div 
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-200"
                onClick={onClose}
            />
        )}

        <aside className={sidebarClasses}>
        {/* Header Sidebar */}
        <div className="p-6 border-b border-neutral-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[#FF6600] rounded-lg flex items-center justify-center font-bold text-white shadow-md shadow-orange-900/50">
                C
                </div>
                <div>
                    <span className="text-white font-bold text-lg tracking-wide block leading-none">Conputodo</span>
                    <span className="text-[10px] text-neutral-500 font-medium">Panel de Control</span>
                </div>
            </div>
            {/* Botón cerrar en móvil */}
            <button onClick={onClose} className="md:hidden text-neutral-500 hover:text-white">
                <X size={24}/>
            </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
            
            {/* Solo ADMIN ve el Dashboard General */}
            {isAdmin && (
                <NavItem 
                icon={<LayoutDashboard size={20}/>} 
                label="Resumen" 
                active={currentView === 'dashboard'} 
                onClick={() => onChangeView('dashboard')} 
                />
            )}
            
            <div className="pt-4 pb-2 px-3 text-xs font-bold text-neutral-600 uppercase tracking-wider">Gestión</div>
            
            {/* Solo ADMIN ve Pedidos */}
            {isAdmin && (
                <NavItem 
                icon={<ShoppingBag size={20}/>} 
                label="Pedidos" 
                active={currentView === 'orders'} 
                onClick={() => onChangeView('orders')} 
                badge={pendingOrdersCount > 0 ? pendingOrdersCount : null} 
                />
            )}
            
            {/* TODOS ven Inventario */}
            <NavItem 
            icon={<Package size={20}/>} 
            label="Inventario" 
            active={['product-list', 'product-create', 'product-edit'].includes(currentView)} 
            onClick={() => onChangeView('product-list')} 
            />
            
            {/* Solo ADMIN ve Marketing */}
            {isAdmin && (
                <NavItem 
                icon={<Megaphone size={20}/>} 
                label="Marketing" 
                active={currentView === 'marketing'} 
                onClick={() => onChangeView('marketing')} 
                />
            )}
            
            {isAdmin && (
                <>
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
                </>
            )}
        </nav>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-900/50">
            <div className="px-2 pb-2 mb-2 border-b border-neutral-800">
                <span className="block text-xs font-bold text-neutral-500 uppercase">Usuario Activo</span>
                <span className="block text-sm text-white truncate max-w-[200px]">{user?.email}</span>
                <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold bg-neutral-800 text-[#FF6600] uppercase border border-neutral-700">
                    {isAdmin ? 'Administrador' : 'Ventas / Caja'}
                </span>
            </div>
            <button 
            onClick={logout} 
            className="flex items-center gap-2 text-neutral-400 hover:text-red-400 transition-colors w-full px-2 py-3 text-sm font-medium hover:bg-neutral-900 rounded-lg group"
            >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" /> 
            <span>Cerrar Sesión</span>
            </button>
        </div>
        </aside>
    </>
  );
};

export default AdminSidebar;