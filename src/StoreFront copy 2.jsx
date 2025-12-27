import React, { useState, useEffect } from 'react';
import { doc, getDoc } from "firebase/firestore";
import { db } from './services/firebase';

// --- HOOKS ---
import { useProducts } from './hooks/useProducts';
import { useCart } from './hooks/useCart';

// --- COMPONENTES UI GLOBALES ---
import Navbar from './components/storefront/Navbar';
import Footer from './components/storefront/Footer';
import CartDrawer from './components/storefront/CartDrawer';
import { MessageCircle } from 'lucide-react';

// --- PÁGINAS ---
import HomePage from './pages/HomePage';
import CatalogPage from './pages/CatalogPage';
import ProductDetailPage from './pages/ProductDetailPage';
import ContactPage from './pages/ContactPage';
import LegalPage from './pages/LegalPage';

// --- CONFIGURACIÓN RÁPIDA ---
const COMPANY_PHONE = "584122163876"; // Tu número de WhatsApp

// --- COMPONENTE FLOTANTE MEJORADO ---
const FloatingWhatsapp = () => (
  <a 
    href={`https://wa.me/${COMPANY_PHONE}?text=Hola%20Conputodo,%20tengo%20una%20duda.`}
    target="_blank"
    rel="noopener noreferrer"
    className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group"
    aria-label="Contactar por WhatsApp"
  >
    <MessageCircle size={32} />
    
    {/* Tooltip que aparece al pasar el mouse */}
    <span className="absolute right-full mr-3 px-3 py-1 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-100">
      ¡Escríbenos!
    </span>
  </a>
);

// --- COMPONENTE COOKIE BANNER MEJORADO ---
const CookieBanner = ({ onAccept }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-neutral-900 border-t-4 border-[#FF6600] text-white p-6 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] animate-in slide-in-from-bottom duration-500">
      <div className="container mx-auto max-w-4xl flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* ZONA DE TEXTO (Edita aquí el mensaje) */}
        <div className="flex items-start gap-3">
          <span className="text-2xl">🍪</span>
          <div>
            <h4 className="font-bold text-[#FF6600] mb-1">Tu privacidad nos importa</h4>
            <p className="text-sm text-gray-300 leading-relaxed">
              Usamos cookies propias y de terceros para mejorar tu experiencia de compra y recordar tu carrito. 
              Al continuar navegando, aceptas nuestro uso de cookies.
            </p>
          </div>
        </div>

        {/* ZONA DE BOTONES */}
        <div className="flex gap-3 shrink-0">
          <button 
            onClick={onAccept} 
            className="bg-[#FF6600] hover:bg-orange-700 text-white px-6 py-2.5 rounded-lg font-bold transition-all transform hover:scale-105 shadow-lg shadow-orange-900/50"
          >
            Aceptar todo
          </button>
        </div>
      </div>
    </div>
  );
};

export default function StoreFront() {
  // --- ESTADOS GLOBALES ---
  const { products, loading, error } = useProducts();
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, clearCart, totalUSD, cartCount } = useCart();
  
  const [exchangeRate, setExchangeRate] = useState(0);
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('conputodo_view') || 'home');
  const [viewParams, setViewParams] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);

  // ANTES:
// const [showCookieBanner, setShowCookieBanner] = useState(false);

// AHORA (Inicialización Inteligente):
const [showCookieBanner, setShowCookieBanner] = useState(() => {
  // Verificamos si YA existe la cookie antes de pintar nada
  return !localStorage.getItem('conputodo_cookie_consent');
});

  useEffect(() => { localStorage.setItem('conputodo_view', currentView); }, [currentView]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) setExchangeRate(snap.data().exchangeRate || 0);
      } catch (e) { console.error("Error tasa:", e); }
    };
    fetchSettings();
    //if (!localStorage.getItem('conputodo_cookie_consent')) setShowCookieBanner(true);
  }, []);

  const navigateTo = (view, params = null) => {
    setViewParams(params);
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setSearchTerm('');
    setSearchSuggestions([]);
  };

  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 1) {
      const suggestions = products.filter(p => 
        p.title?.toLowerCase().includes(term.toLowerCase()) || 
        p.tags?.some(t => t.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const renderPage = () => {
    switch (currentView) {
      case 'home':
        return (
          <HomePage 
            onNavigate={navigateTo} 
            onAddToCart={addToCart} 
            products={products} 
            loading={loading}
            exchangeRate={exchangeRate}
          />
        );
      case 'catalog':
        return (
          <CatalogPage 
            products={products}
            loading={loading}
            exchangeRate={exchangeRate}
            onAddToCart={addToCart}
            initialCategory={viewParams?.category || ''}
            onNavigate={navigateTo} // <--- ¡ESTO FALTABA!
          />
        );
      case 'product-detail':
        return (
          <ProductDetailPage 
            product={viewParams}
            onBack={() => navigateTo('catalog')}
            onAddToCart={addToCart}
            exchangeRate={exchangeRate}
          />
        );
      case 'contact': return <ContactPage />;
      case 'legal': return <LegalPage onBack={() => navigateTo('home')} />;
      default: return <HomePage onNavigate={navigateTo} products={products} loading={loading} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 flex flex-col">
      <Navbar 
        cartCount={cartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={navigateTo}
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        searchSuggestions={searchSuggestions}
        onSuggestionClick={(prod) => navigateTo('product-detail', prod)}
      />
      <main className="flex-grow">{renderPage()}</main>
      <Footer onNavigate={navigateTo} />
      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        totalUSD={totalUSD}
        exchangeRate={exchangeRate}
      />
      <FloatingWhatsapp />
      {showCookieBanner && (
        <CookieBanner onAccept={() => { localStorage.setItem('conputodo_cookie_consent', 'true'); setShowCookieBanner(false); }} />
      )}
    </div>
  );
}