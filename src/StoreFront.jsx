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

// --- COMPONENTES FLOTANTES ---
const FloatingWhatsapp = () => (
  <a href="https://wa.me/584120000000" target="_blank" rel="noreferrer" className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform">
    <MessageCircle size={32}/>
  </a>
);

const CookieBanner = ({ onAccept }) => (
  <div className="fixed bottom-0 w-full bg-neutral-900 text-white p-4 flex justify-between items-center z-50 shadow-lg animate-in slide-in-from-bottom">
    <p className="text-sm pr-4">Usamos cookies para mejorar tu experiencia en la tienda.</p>
    <button onClick={onAccept} className="bg-[#FF6600] px-4 py-2 rounded text-sm font-bold whitespace-nowrap hover:bg-orange-700 transition-colors">
      Aceptar
    </button>
  </div>
);

export default function StoreFront() {
  // --- ESTADOS GLOBALES ---
  const { products, loading, error } = useProducts();
  const { cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, clearCart, totalUSD, cartCount } = useCart();
  
  const [exchangeRate, setExchangeRate] = useState(0);
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('conputodo_view') || 'home');
  const [viewParams, setViewParams] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  useEffect(() => { localStorage.setItem('conputodo_view', currentView); }, [currentView]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const snap = await getDoc(doc(db, "settings", "global"));
        if (snap.exists()) setExchangeRate(snap.data().exchangeRate || 0);
      } catch (e) { console.error("Error tasa:", e); }
    };
    fetchSettings();
    if (!localStorage.getItem('conputodo_cookie_consent')) setShowCookieBanner(true);
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