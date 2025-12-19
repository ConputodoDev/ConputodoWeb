import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ShoppingCart, Search, Menu, X, Check, XCircle, Trash2, ArrowRight, Loader2, MessageCircle,
  Truck, ShieldCheck, MapPin, Laptop, Monitor, Mouse, Phone, Mail, Building, FileText, Bell,
  Printer, BatteryCharging, Cpu, Gamepad2, Zap, Send, Cookie, ExternalLink, 
  Instagram, Facebook, Video, ChevronDown, ChevronUp, Filter // <--- NUEVOS ICONOS
} from 'lucide-react';

// --- NUEVAS IMPORTACIONES PARA EL MAPA ---
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix para que el icono del marcador aparezca correctamente en React/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34]
});
L.Marker.prototype.options.icon = DefaultIcon;

// ==========================================
// 1. CONFIGURACIÓN
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyBQNJvum1U9JqnIiM-e_Nkibvjxa_o5OO8",
  authDomain: "tienda-admin-1c383.firebaseapp.com",
  projectId: "tienda-admin-1c383",
  storageBucket: "tienda-admin-1c383.firebasestorage.app",
  messagingSenderId: "869294981306",
  appId: "1:869294981306:web:92fdc803e7424bc3b50283",
  measurementId: "G-0PKGRZ1TD9"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Variables de la Marca
const BRAND_ORANGE = "#FF6600";
const COMPANY_PHONE = "584120000000"; 

export default function StoreFront() {
  
  // --- NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState(() => localStorage.getItem('conputodo_view') || 'home');
  const [viewProduct, setViewProduct] = useState(() => JSON.parse(localStorage.getItem('conputodo_product')) || null);

  // --- DATOS ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [marketingData, setMarketingData] = useState({ heroImage: null, newsText: '' });
  
  // --- CARRITO ---
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('conputodo_cart')) || []);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // --- BÚSQUEDA Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  
  // ESTADOS DE FILTRO NUEVOS (Multi-selección)
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrands, setSelectedBrands] = useState([]); // Array para varias marcas
  const [selectedTags, setSelectedTags] = useState([]);     // Array para varias etiquetas
  
  // ESTADO PARA "SPOILERS" (ACORDEONES)
  const [openFilters, setOpenFilters] = useState({ brands: true, tags: false }); // Marcas abiertas por defecto

  const [showCookieBanner, setShowCookieBanner] = useState(false);
  const searchRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- EFECTOS DE PERSISTENCIA ---
  useEffect(() => { localStorage.setItem('conputodo_cart', JSON.stringify(cart)); }, [cart]);
  useEffect(() => { localStorage.setItem('conputodo_view', currentView); }, [currentView]);
  useEffect(() => {
    if (viewProduct) localStorage.setItem('conputodo_product', JSON.stringify(viewProduct));
    else localStorage.removeItem('conputodo_product');
  }, [viewProduct]);

  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) setExchangeRate(settingsSnap.data().exchangeRate || 0);
        
        const marketingSnap = await getDoc(doc(db, "settings", "marketing"));
        if(marketingSnap.exists()) setMarketingData(marketingSnap.data());

        const q = query(collection(db, "products"), where("status", "==", "published"));
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
    };
    fetchData();

    const consent = localStorage.getItem('conputodo_cookie_consent');
    if (!consent) setShowCookieBanner(true);
  }, []);

  // --- SEARCH OUTSIDE CLICK ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchSuggestions([]); 
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [searchRef]);

  // --- NAVEGACIÓN Y LIMPIEZA ---
  const resetFilters = () => {
      setSelectedCategory('');
      setSelectedBrands([]);
      setSelectedTags([]);
      setSearchTerm('');
  }

  const goHome = () => { setCurrentView('home'); setViewProduct(null); resetFilters(); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goContact = () => { setCurrentView('contact'); setViewProduct(null); setSearchTerm(''); setSearchSuggestions([]); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const goLegal = () => { setCurrentView('legal'); setViewProduct(null); setSearchTerm(''); setSearchSuggestions([]); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  
  const goToCatalog = (category = '') => { 
      resetFilters();
      if(category) setSelectedCategory(category);
      setCurrentView('catalog'); 
      window.scrollTo({ top: 0, behavior: 'smooth' }); 
  };

  // --- LÓGICA DE FILTRADO INTELIGENTE (DEPENDIENTE) ---
  
  // 1. Primero filtramos por Categoría + Búsqueda (Texto)
  // Esta es la "Base" de productos disponibles en esta vista
  const baseFilteredProducts = products.filter(product => {
      const term = searchTerm.toLowerCase();
      const matchSearch = product.title.toLowerCase().includes(term) || product.tags?.some(t => t.toLowerCase().includes(term));
      const matchCategory = selectedCategory ? product.category === selectedCategory : true;
      return matchSearch && matchCategory;
  });

  // 2. Extraemos las Marcas y Etiquetas DISPONIBLES solo en los productos filtrados
  // Esto cumple tu requerimiento: Si hay impresoras, solo muestra marcas de impresoras
  const availableBrands = [...new Set(baseFilteredProducts.map(p => p.brand).filter(Boolean))];
  const availableTags = [...new Set(baseFilteredProducts.flatMap(p => p.tags || []).filter(Boolean))];

  // 3. Aplicamos los filtros de Checkbox (Marcas y Etiquetas) sobre la base
  const finalFilteredProducts = baseFilteredProducts.filter(product => {
      const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
      const matchTag = selectedTags.length === 0 || (product.tags && product.tags.some(t => selectedTags.includes(t)));
      return matchBrand && matchTag;
  });

  // --- MANEJO DE CHECKBOXES ---
  const toggleBrand = (brand) => {
      setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };

  const toggleTag = (tag) => {
      setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const toggleAccordion = (section) => {
      setOpenFilters(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- ACTIONS ---
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.length > 1) {
      const suggestions = products.filter(p => 
        p.title.toLowerCase().includes(term.toLowerCase()) || 
        p.tags?.some(t => t.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 5);
      setSearchSuggestions(suggestions);
    } else {
      setSearchSuggestions([]);
    }
  };

  const handleProductClick = (product) => {
    setViewProduct(product);
    setCurrentView('product-detail');
    setSearchTerm('');
    setSearchSuggestions([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) return prev.map(item => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id) => setCart(cart.filter(item => item.id !== id));
  const cartTotalUSD = cart.reduce((sum, item) => sum + (item.prices.usd * item.qty), 0);
  const acceptCookies = () => { localStorage.setItem('conputodo_cookie_consent', 'true'); setShowCookieBanner(false); };
  const showSuggestions = searchSuggestions.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 relative">
      
      <FloatingWhatsapp />
      {showCookieBanner && <CookieBanner onAccept={acceptCookies} />}
      <CartModal isOpen={isCartOpen} cart={cart} setCart={setCart} onClose={() => setIsCartOpen(false)} totalUSD={cartTotalUSD} onRemove={removeFromCart} exchangeRate={exchangeRate} />

      {/* --- NAVBAR --- */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={goHome}>
            <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-neutral-900 transition-colors">C</div>
            <span className="text-xl font-bold text-slate-900 hidden sm:block group-hover:text-[#FF6600] transition-colors">Conputodo</span>
          </div>
          
          <div className="flex-1 max-w-xl relative hidden sm:block group" ref={searchRef}>
            <div className="relative z-50">
                <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={handleSearchChange} onKeyDown={(e) => e.key === 'Enter' && goToCatalog()} className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6600] transition-all"/>
                <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
            <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 transform transition-all duration-300 origin-top ${showSuggestions ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}>
                {searchSuggestions.map(prod => (
                    <div key={prod.id} onClick={() => handleProductClick(prod)} className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                        <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">{prod.images?.main && <img src={prod.images.main} className="w-full h-full object-cover"/>}</div>
                        <div className="flex-1"><h4 className="text-sm font-bold text-slate-800 line-clamp-1">{prod.title}</h4><span className="text-xs text-[#FF6600] font-bold">${prod.prices?.usd?.toFixed(2)}</span></div>
                    </div>
                ))}
                <div onClick={() => goToCatalog()} className="p-2 text-center text-xs font-bold text-slate-500 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:text-[#FF6600]">Ver todos los resultados</div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => goToCatalog()} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] transition-colors hidden md:block">Tienda</button>
            <button onClick={goContact} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] transition-colors hidden md:block">Contacto</button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group">
              <ShoppingCart size={24} className="text-slate-700 group-hover:text-[#FF6600] transition-colors" />
              {cart.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-[#FF6600] text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">{cart.length}</span>}
            </button>
            <button className="sm:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={24}/> : <Menu size={24}/>}</button>
          </div>
        </div>
        
        <div className="sm:hidden px-4 pb-3 space-y-3">
           <div className="relative">
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none"/>
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transform transition-all duration-300 ${showSuggestions ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}`}>
                {searchSuggestions.map(prod => (<div key={prod.id} onClick={() => handleProductClick(prod)} className="p-3 border-b text-sm truncate">{prod.title}</div>))}
            </div>
           </div>
           {isMenuOpen && (<div className="flex flex-col gap-2 pt-2 border-t animate-in slide-in-from-top-2"><button onClick={() => goToCatalog()} className="text-left font-medium py-2 hover:text-[#FF6600]">Tienda</button><button onClick={goContact} className="text-left font-medium py-2 hover:text-[#FF6600]">Contacto</button></div>)}
        </div>
      </header>

      {currentView === 'home' && (
        <div className="animate-in fade-in duration-700">
          <div className="relative bg-neutral-900 text-white overflow-hidden">
            <div className="absolute inset-0">
                {marketingData.heroImage ? (
                    <><img src={marketingData.heroImage} className="w-full h-full object-cover opacity-60 animate-in fade-in zoom-in-105 duration-[2000ms]" style={{ animationFillMode: 'both' }} /><div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent"></div></>
                ) : (<div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600 via-neutral-900 to-black opacity-20"></div>)}
            </div>
            <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
              <span className="text-[#FF6600] font-bold tracking-wider text-sm uppercase mb-4 animate-in slide-in-from-bottom-4 fade-in duration-1000">Josep Suply, C.A</span>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150">Tecnología al alcance<br/>de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6600] to-orange-400">tus manos</span></h1>
              <button onClick={() => goToCatalog()} className="px-8 py-4 bg-[#FF6600] hover:bg-orange-700 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-2 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">Ver Catálogo <ArrowRight size={20}/></button>
            </div>
          </div>
          <div className="bg-white py-16"><div className="container mx-auto px-4"><h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Explora por Categoría</h2><div className="grid grid-cols-2 md:grid-cols-5 gap-4"><CategoryCard title="Computadoras" icon={<Cpu size={36}/>} onClick={() => goToCatalog('Computadoras')} /><CategoryCard title="Laptops" icon={<Laptop size={36}/>} onClick={() => goToCatalog('Laptops')} /><CategoryCard title="Refurbished" icon={<Zap size={36}/>} onClick={() => goToCatalog('Refurbished')} /><CategoryCard title="Impresoras" icon={<Printer size={36}/>} onClick={() => goToCatalog('Impresoras')} /><CategoryCard title="UPS" icon={<BatteryCharging size={36}/>} onClick={() => goToCatalog('UPS')} /></div></div></div>
          <div className="container mx-auto px-4 mb-16"><div className="relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => goToCatalog('Gamer')}><div className="absolute inset-0 bg-gradient-to-r from-violet-900 via-fuchsia-900 to-black z-0"></div><div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0"></div><div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8"><div className="text-center md:text-left"><div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-fuchsia-400 font-bold tracking-widest uppercase text-sm animate-pulse"><Gamepad2 size={20}/> Conputodo Gamer</div><h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter mb-4">LEVEL UP <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">YOUR SETUP</span></h2><p className="text-gray-300 max-w-lg mb-6">Equipos High-End, Workstations de Diseño y Periféricos Profesionales.</p><button className="px-8 py-3 bg-white text-violet-900 font-bold rounded-full hover:bg-fuchsia-50 transition-colors shadow-lg shadow-fuchsia-900/50">Entrar a la Zona Gamer</button></div><div className="hidden md:block opacity-80 transform group-hover:scale-110 transition-transform duration-700"><Gamepad2 size={180} className="text-white/10"/></div></div></div></div>
          <div className="container mx-auto px-4 py-16 border-t border-gray-100"><div className="flex justify-between items-end mb-8"><h2 className="text-2xl md:text-3xl font-bold text-slate-900">🔥 Ofertas de la Semana</h2><button onClick={() => goToCatalog()} className="text-[#FF6600] font-bold text-sm flex items-center gap-1 hover:underline">Ver todo <ArrowRight size={16}/></button></div>{loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div> : (<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr"> {products.slice(0, 4).map(product => (<ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />))}</div>)}</div>
          {marketingData.newsText && (<div className="bg-neutral-900 py-4 border-y-4 border-[#FF6600] animate-in fade-in slide-in-from-bottom-2"><div className="container mx-auto px-4 flex items-center justify-center gap-3 text-white"><Bell className="text-[#FF6600] animate-bounce" size={20}/><p className="font-medium text-sm md:text-base">{marketingData.newsText}</p></div></div>)}
          <div className="bg-slate-50 border-b border-slate-200 py-10"><div className="container mx-auto px-4 text-center"><p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Explora las marcas más reconocidas</p><div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500"><span className="text-2xl font-black text-slate-800">HP</span><span className="text-2xl font-black text-slate-800 italic">DELL</span><span className="text-2xl font-black text-slate-800 tracking-tighter">LENOVO</span><span className="text-2xl font-black text-slate-800 font-serif">Canon</span><span className="text-2xl font-black text-slate-800">EPSON</span><span className="text-xl font-bold text-slate-800 border-2 border-slate-800 px-2">LOGITECH</span></div></div></div>
          <div className="bg-white py-16 overflow-hidden"><div className="container mx-auto px-4"><h2 className="text-2xl font-bold text-slate-900 mb-8">✨ Productos Destacados</h2><div className="flex overflow-x-auto gap-4 pb-8 snap-x scrollbar-hide items-stretch"> {loading ? <div className="w-full text-center"><Loader2 className="animate-spin mx-auto"/></div> : products.filter(p => p.isFeatured).map(product => (<div key={product.id} className="w-[200px] md:w-[240px] flex-none snap-start transition-transform duration-300 h-full"><ProductCard product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} /></div>))}</div></div></div>
          <div className="bg-white border-t border-gray-100"><div className="container mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8"><FeatureItem icon={<Truck className="text-[#FF6600]" size={32}/>} title="Envíos Nacionales" desc="Tealca y Zoom" /><FeatureItem icon={<ShieldCheck className="text-[#FF6600]" size={32}/>} title="Garantía Real" desc="En todos los equipos" /><FeatureItem icon={<MapPin className="text-[#FF6600]" size={32}/>} title="Retiro en Tienda" desc="Maracay, Edo Aragua" /><FeatureItem icon={<MessageCircle className="text-[#FF6600]" size={32}/>} title="Atención VIP" desc="Asesoría WhatsApp" /></div></div>
        </div>
      )}

      {/* =======================================================
          VISTA 2: CATÁLOGO (ACTUALIZADO CON FILTROS DINÁMICOS)
         ======================================================= */}
      {currentView === 'catalog' && (
        <main className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
          
          {/* BARRA LATERAL (FILTROS) */}
          <aside className={`lg:w-64 flex-shrink-0 ${isMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 space-y-4">
               
               {/* 1. CATEGORÍAS (Siempre visible) */}
               <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                 <h3 className="font-bold mb-4 text-slate-900 flex items-center gap-2"><Filter size={16}/> Categorías</h3>
                 <div className="space-y-1">
                   <button onClick={() => { setSelectedCategory(''); setSelectedBrands([]); setSelectedTags([]); }} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory==='' ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-50'}`}>Todas</button>
                   {[...new Set(products.map(p=>p.category).filter(Boolean))].map(c => (
                     <button key={c} onClick={() => { setSelectedCategory(c); setSelectedBrands([]); setSelectedTags([]); }} className={`block w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${selectedCategory===c ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-50'}`}>{c}</button>
                   ))}
                 </div>
               </div>

               {/* 2. MARCAS (Acordeón Dependiente) */}
               {availableBrands.length > 0 && (
                   <FilterAccordion 
                        title="Marcas" 
                        isOpen={openFilters.brands} 
                        onToggle={() => toggleAccordion('brands')}
                   >
                       {availableBrands.map(brand => (
                           <div key={brand} className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => toggleBrand(brand)}>
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedBrands.includes(brand) ? 'bg-[#FF6600] border-[#FF6600]' : 'bg-white border-gray-300'}`}>
                                   {selectedBrands.includes(brand) && <Check size={12} className="text-white"/>}
                               </div>
                               <span className={`text-sm ${selectedBrands.includes(brand) ? 'text-[#FF6600] font-bold' : 'text-slate-600'}`}>{brand}</span>
                           </div>
                       ))}
                   </FilterAccordion>
               )}

               {/* 3. ETIQUETAS (Acordeón Dependiente) */}
               {availableTags.length > 0 && (
                   <FilterAccordion 
                        title="Etiquetas" 
                        isOpen={openFilters.tags} 
                        onToggle={() => toggleAccordion('tags')}
                   >
                       {availableTags.map(tag => (
                           <div key={tag} className="flex items-center gap-3 py-1 cursor-pointer" onClick={() => toggleTag(tag)}>
                               <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedTags.includes(tag) ? 'bg-[#FF6600] border-[#FF6600]' : 'bg-white border-gray-300'}`}>
                                   {selectedTags.includes(tag) && <Check size={12} className="text-white"/>}
                               </div>
                               <span className={`text-sm capitalize ${selectedTags.includes(tag) ? 'text-[#FF6600] font-bold' : 'text-slate-600'}`}>{tag}</span>
                           </div>
                       ))}
                   </FilterAccordion>
               )}

            </div>
          </aside>

          {/* GRID DE PRODUCTOS */}
          <div className="flex-1">
             <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedCategory || 'Catálogo Completo'}</h2>
                    <div className="flex flex-wrap gap-2 mt-2">
                        {/* Chips de Filtros Activos */}
                        {selectedBrands.map(b => (
                            <span key={b} className="text-xs font-bold text-[#FF6600] bg-orange-50 px-2 py-1 rounded-full border border-orange-100 flex items-center gap-1">
                                {b} <X size={12} className="cursor-pointer" onClick={() => toggleBrand(b)}/>
                            </span>
                        ))}
                        {selectedTags.map(t => (
                            <span key={t} className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                                {t} <X size={12} className="cursor-pointer" onClick={() => toggleTag(t)}/>
                            </span>
                        ))}
                        {(selectedBrands.length > 0 || selectedTags.length > 0) && (
                            <button onClick={() => { setSelectedBrands([]); setSelectedTags([]); }} className="text-xs text-gray-400 hover:text-gray-600 underline">Limpiar filtros</button>
                        )}
                    </div>
                </div>
                <span className="text-sm text-slate-500">{finalFilteredProducts.length} resultados</span>
             </div>

             {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div> : (
               finalFilteredProducts.length === 0 ? 
               <div className="text-center py-20 border-2 border-dashed rounded-xl"><Search className="mx-auto text-gray-300 mb-2" size={48}/><p className="text-gray-500">No encontramos productos con esos filtros.</p><button onClick={resetFilters} className="text-[#FF6600] font-bold mt-2">Ver todo el catálogo</button></div>
               :
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
                 {finalFilteredProducts.map(product => (
                   <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />
                 ))}
               </div>
             )}
          </div>
        </main>
      )}

      {currentView === 'product-detail' && viewProduct && (
          <div className="container mx-auto px-4 py-8 animate-in slide-in-from-right duration-300">
              <button onClick={() => setCurrentView('catalog')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors"><ArrowRight className="rotate-180" size={18}/> Volver al catálogo</button>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                      <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center p-4 shadow-sm">{viewProduct.images?.main ? <img src={viewProduct.images.main} className="w-full h-full object-contain" /> : <div className="text-gray-300">Sin Imagen</div>}</div>
                      <div className="grid grid-cols-4 gap-4">{[viewProduct.images?.main, ...(viewProduct.images?.gallery || [])].slice(0,4).map((src, i) => (<div key={i} className="aspect-square border rounded-xl overflow-hidden cursor-pointer hover:border-[#FF6600] hover:shadow-md transition-all bg-white"><img src={src} className="w-full h-full object-cover"/></div>))}</div>
                  </div>
                  <div className="flex flex-col">
                      <div className="text-sm font-bold text-[#FF6600] uppercase tracking-wider mb-2">{viewProduct.category}</div>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">{viewProduct.title}</h1>
                      <div className="flex items-end gap-4 mb-6 pb-6 border-b border-gray-100"><span className="text-4xl font-black text-slate-900">${viewProduct.prices?.usd?.toFixed(2)}</span><span className="text-sm text-slate-500 mb-2">USD (Exento)</span></div>
                      <div className="prose text-slate-600 mb-8 text-sm leading-relaxed whitespace-pre-wrap">{viewProduct.description || "Sin descripción detallada."}</div>
                      {viewProduct.specs && viewProduct.specs.length > 0 && (<div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100"><h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText size={18}/> Especificaciones</h3><div className="space-y-2">{viewProduct.specs.map((spec, i) => (<div key={i} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0"><span className="font-medium text-slate-600">{spec.key}</span><span className="text-slate-900 font-bold">{spec.value}</span></div>))}</div></div>)}
                      <div className="mt-auto">
                          {(() => {
                              const isAvailable = viewProduct.inStock !== false;
                              return (<><div className="flex items-center justify-between mb-4"><span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-red-500'} flex items-center gap-2`}>{isAvailable ? <Check size={16}/> : <XCircle size={16}/>} {isAvailable ? 'Disponible' : 'Agotado temporalmente'}</span>{viewProduct.sku && <span className="text-xs text-gray-400 font-mono">SKU: {viewProduct.sku}</span>}</div><div className="flex gap-4"><button onClick={() => addToCart(viewProduct)} disabled={!isAvailable} className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700 shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><ShoppingCart/> {isAvailable ? 'Agregar al Carrito' : 'Sin Stock'}</button><a href={`https://wa.me/${COMPANY_PHONE}?text=${encodeURIComponent(`Hola Conputodo, estoy interesado en: ${viewProduct.title}`)}`} target="_blank" className="px-4 py-4 border-2 border-gray-200 rounded-xl text-slate-600 hover:border-green-500 hover:text-green-600 transition-colors bg-white" title="Preguntar por WhatsApp"><MessageCircle size={24}/></a></div></>);
                          })()}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {currentView === 'contact' && (<ContactSection db={db} />)}
      {currentView === 'legal' && (<LegalSection onBack={() => setCurrentView('home')} />)}

      {currentView !== 'product-detail' && (
        <footer className="bg-neutral-900 text-white pt-16 pb-8 border-t border-neutral-800 mt-auto">
            <div className="container mx-auto px-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
                    <div className="md:col-span-1 space-y-4"><div className="flex items-center gap-2 text-white font-bold text-2xl"><div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center">C</div> Conputodo</div><p className="text-neutral-400 text-sm leading-relaxed">Tu aliado tecnológico de confianza en Maracay.</p><div className="pt-4 flex items-center gap-2 text-neutral-500 text-xs"><MapPin size={16}/> Maracay, Edo. Aragua</div></div>
                    <div><h4 className="font-bold text-lg mb-6 border-b border-neutral-800 pb-2 inline-block">Navegación</h4><ul className="space-y-3 text-sm text-neutral-400"><li><button onClick={goHome} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Inicio</button></li><li><button onClick={() => goToCatalog()} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Catálogo</button></li><li><button onClick={goContact} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Contacto</button></li><li><button onClick={goLegal} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Legales</button></li></ul></div>
                    <div><h4 className="font-bold text-lg mb-6 border-b border-neutral-800 pb-2 inline-block">Conputodo</h4><ul className="space-y-4"><li><a href="#" target="_blank" className="flex items-center gap-3 text-neutral-400 hover:text-pink-500 transition-colors"><Instagram size={20} /> <span>@conputodo</span></a></li><li><a href="#" target="_blank" className="flex items-center gap-3 text-neutral-400 hover:text-blue-500 transition-colors"><Facebook size={20} /> <span>Conputodo</span></a></li></ul></div>
                    <div><h4 className="font-bold text-lg mb-6 border-b border-neutral-800 pb-2 inline-block">Gamer</h4><ul className="space-y-4"><li><a href="#" target="_blank" className="flex items-center gap-3 text-neutral-400 hover:text-purple-500 transition-colors"><Instagram size={20} /> <span>@conputodogamer</span></a></li></ul></div>
                </div>
                <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600"><p>© 2025 Josep Suply, C.A.</p></div>
            </div>
        </footer>
      )}
    </div>
  );
}

// --- NUEVO COMPONENTE: ACORDEÓN DE FILTROS ---
function FilterAccordion({ title, isOpen, onToggle, children }) {
    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <button 
                onClick={onToggle}
                className="w-full p-4 flex items-center justify-between font-bold text-slate-900 hover:bg-gray-50 transition-colors"
            >
                {title}
                {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
            >
                <div className="p-4 pt-0 space-y-1">
                    {children}
                </div>
            </div>
        </div>
    );
}

function LegalSection({ onBack }) { return (<div className="container mx-auto px-4 py-16 max-w-4xl animate-in fade-in duration-500"><button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors"><ArrowRight className="rotate-180" size={18}/> Volver al Inicio</button><div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 space-y-10"><h1 className="text-3xl font-bold">Políticas y Garantía</h1><p className="text-slate-600">Texto legal...</p></div></div>); }
function ContactSection({ db }) { return (<div className="py-20 text-center"><h1>Contacto</h1></div>); } 
function FeatureItem({ icon, title, desc }) { return (<div className="flex flex-col items-center text-center p-4"><div className="mb-3 p-3 bg-orange-50 rounded-full">{icon}</div><h3 className="font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-500">{desc}</p></div>); }
function CategoryCard({ title, icon, onClick }) { return (<div onClick={onClick} className="group bg-slate-50 border border-slate-100 hover:border-[#FF6600] p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex flex-col items-center text-center h-full justify-center"><div className="text-slate-400 group-hover:text-[#FF6600] transition-colors mb-3 transform group-hover:scale-110 duration-300">{icon}</div><h3 className="font-bold text-sm md:text-base text-slate-800">{title}</h3></div>); }
function ProductCard({ product, onAddToCart, onClick }) { const isAvailable = product.inStock !== false; return (<div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative group h-full">{!isAvailable && <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">AGOTADO</div>}<div onClick={onClick} className="relative aspect-square bg-gray-50 overflow-hidden cursor-pointer flex-shrink-0">{product.images?.main ? <img src={product.images.main} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="w-full h-full flex items-center justify-center text-gray-300">Sin Imagen</div>}</div><div className="p-3 flex-1 flex flex-col"> <div className="text-xs text-[#FF6600] font-semibold mb-1 uppercase tracking-wider">{product.category}</div><h3 onClick={onClick} className="font-bold text-slate-800 mb-2 line-clamp-2 leading-tight cursor-pointer hover:text-[#FF6600] transition-colors">{product.title}</h3><div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between"><span className="text-lg font-extrabold text-slate-900">${product.prices?.usd?.toFixed(2)}</span><button onClick={onAddToCart} disabled={!isAvailable} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><ShoppingCart size={16} /> {isAvailable ? 'Agregar' : 'Agotado'}</button></div></div></div>); }
function CartModal({ isOpen, cart, setCart, onClose, totalUSD, onRemove, exchangeRate }) { useEffect(() => { function handleKeyDown(e) { if (e.key === 'Escape' && isOpen) onClose(); } window.addEventListener('keydown', handleKeyDown); return () => window.removeEventListener('keydown', handleKeyDown); }, [isOpen, onClose]); const [step, setStep] = useState('cart'); const [loading, setLoading] = useState(false); const [client, setClient] = useState({ name: '', cedula: '', contact: '', method: 'pago_movil', shipping: 'tienda' }); const [confirmedOrder, setConfirmedOrder] = useState(null); const handleSubmitOrder = async (e) => { e.preventDefault(); setLoading(true); try { const orderData = { clientName: client.name, clientCedula: client.cedula, clientContact: client.contact, shippingMethod: client.shipping, paymentMethod: client.method, products: cart.map(p => ({ id: p.id, title: p.title, qty: p.qty, price: p.prices.usd })), totalUsd: totalUSD, totalBs: totalUSD * exchangeRate, exchangeRateSnapshot: exchangeRate, status: 'pendiente', createdAt: serverTimestamp() }; const docRef = await addDoc(collection(db, "orders"), orderData); setConfirmedOrder({ ...orderData, id: docRef.id }); setStep('success'); setCart([]); } catch (error) { console.error(error); alert("Error al procesar"); } finally { setLoading(false); } }; const handleWhatsappRedirect = () => { if (!confirmedOrder) return; const message = `Pedido #${confirmedOrder.id}`; window.open(`https://wa.me/584120000000?text=${encodeURIComponent(message)}`, '_blank'); }; return (<div className={`fixed inset-0 z-50 bg-black/50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}><div className={`w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} onClick={(e) => e.stopPropagation()}><div className="p-4 border-b flex justify-between items-center bg-slate-50"><h2 className="font-bold text-lg text-slate-800">Carrito</h2><button onClick={onClose}><X size={20}/></button></div><div className="flex-1 p-4">{step === 'cart' && cart.map(item => <div key={item.id}>{item.title}</div>)}</div></div></div>); }
function FloatingWhatsapp() { return (<a href="#" className="fixed bottom-6 right-6 z-50 bg-green-500 text-white p-4 rounded-full"><MessageCircle size={32}/></a>); }
function CookieBanner({ onAccept }) { return (<div className="fixed bottom-0 w-full bg-neutral-900 text-white p-4 flex justify-between"><p>Cookies...</p><button onClick={onAccept}>Aceptar</button></div>); }