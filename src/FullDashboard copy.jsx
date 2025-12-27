import React, { useState } from 'react';
import { useAdminAuth, AdminAuthProvider } from './context/AdminAuthContext';
import { Loader2 } from 'lucide-react';

// --- COMPONENTES DE ESTRUCTURA ---
import AdminLayout from './components/dashboard/AdminLayout';
import LoginPage from './pages/admin/LoginPage';

// --- PÁGINAS INTERNAS ---
import DashboardPage from './pages/admin/DashboardPage';
import OrderListPage from './pages/admin/OrderListPage';
import ProductListPage from './pages/admin/ProductListPage';
import ProductFormPage from './pages/admin/ProductFormPage';
import MarketingPage from './pages/admin/MarketingPage';
import DataToolsPage from './pages/admin/DataToolsPage';

// Componente que decide qué mostrar según el usuario
const DashboardRouter = () => {
  const { user, loading } = useAdminAuth();
  
  // Estado de Navegación Local
  const [currentView, setCurrentView] = useState('dashboard');
  const [editParams, setEditParams] = useState(null); // Para pasar datos (ej: producto a editar)

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="animate-spin text-[#FF6600]" size={40} />
      </div>
    );
  }

  // Si no hay usuario, mostrar Login
  if (!user) {
    return <LoginPage />;
  }

  // Router interno
  const renderContent = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardPage />;
      
      case 'orders':
        return <OrderListPage />;
      
      case 'product-list':
        return (
          <ProductListPage 
            onChangeView={(view, params) => {
              setCurrentView(view);
              setEditParams(params);
            }} 
          />
        );
      
      case 'product-trash':
        return (
          <ProductListPage 
            isTrashView={true}
            onChangeView={(view) => setCurrentView(view)} 
          />
        );

      case 'product-create':
        return (
          <ProductFormPage 
            onBack={() => setCurrentView('product-list')} 
          />
        );
        
      case 'product-edit':
        return (
          <ProductFormPage 
            productToEdit={editParams} 
            onBack={() => {
              setEditParams(null);
              setCurrentView('product-list');
            }} 
          />
        );

      case 'marketing':
        return <MarketingPage />;
        
      case 'data-tools':
        return <DataToolsPage />;
        
      default:
        return <DashboardPage />;
    }
  };

  return (
    <AdminLayout 
      currentView={currentView} 
      onChangeView={setCurrentView}
      pendingOrdersCount={0} // Podríamos conectar esto al estado global si quisieras
    >
      {renderContent()}
    </AdminLayout>
  );
};

// Punto de entrada principal
export default function FullDashboard() {
  return (
    <AdminAuthProvider>
      <DashboardRouter />
    </AdminAuthProvider>
  );
}