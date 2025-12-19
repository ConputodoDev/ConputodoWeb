import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ShoppingCart, Search, Menu, X, Check, XCircle, Trash2, ArrowRight, Loader2, MessageCircle,
  Truck, ShieldCheck, MapPin, Laptop, Monitor, Mouse, Phone, Mail, Building, FileText, Bell,
  Printer, BatteryCharging, Cpu, Gamepad2, Zap, Send, Cookie, ExternalLink, 
  Instagram, Facebook, Video
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
const COMPANY_PHONE = "584120000000"; // <--- TU NÚMERO AQUÍ

export default function StoreFront() {
  
  // --- NAVEGACIÓN CON PERSISTENCIA ---
  // Inicializamos el estado leyendo del localStorage si existe
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('conputodo_view');
    return savedView || 'home';
  });

  const [viewProduct, setViewProduct] = useState(() => {
    const savedProduct = localStorage.getItem('conputodo_product');
    return savedProduct ? JSON.parse(savedProduct) : null;
  });

  // --- DATOS ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0);
  const [marketingData, setMarketingData] = useState({ heroImage: null, newsText: '' });
  
  // --- CARRITO CON PERSISTENCIA ---
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('conputodo_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // --- BÚSQUEDA Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedBrand, setSelectedBrand] = useState(''); 
  
  // --- COOKIES ---
  const [showCookieBanner, setShowCookieBanner] = useState(false);

  // Referencia para detectar clicks fuera del buscador
  const searchRef = useRef(null);
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // --- EFECTOS DE PERSISTENCIA (GUARDAR CAMBIOS) ---
  
  // 1. Guardar Carrito
  useEffect(() => {
    localStorage.setItem('conputodo_cart', JSON.stringify(cart));
  }, [cart]);

  // 2. Guardar Vista Actual
  useEffect(() => {
    localStorage.setItem('conputodo_view', currentView);
  }, [currentView]);

  // 3. Guardar Producto Seleccionado (si aplica)
  useEffect(() => {
    if (viewProduct) {
      localStorage.setItem('conputodo_product', JSON.stringify(viewProduct));
    } else {
      localStorage.removeItem('conputodo_product'); // Limpiar si no hay producto
    }
  }, [viewProduct]);


  // --- CARGA DE DATOS ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Configuración Global (Tasa)
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          setExchangeRate(settingsSnap.data().exchangeRate || 0);
        }
        
        // 2. Configuración Marketing
        const marketingSnap = await getDoc(doc(db, "settings", "marketing"));
        if(marketingSnap.exists()) setMarketingData(marketingSnap.data());

        // 3. Productos
        const q = query(collection(db, "products"), where("status", "==", "published"));
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
    };
    fetchData();

    // Verificación de Cookies
    const consent = localStorage.getItem('conputodo_cookie_consent');
    if (!consent) {
        setShowCookieBanner(true);
    }
  }, []);

  // --- EFECTO: CERRAR BUSCADOR AL HACER CLICK FUERA ---
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchSuggestions([]); // Cierra el dropdown
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [searchRef]);

  const calculateBs = (usd) => (usd * exchangeRate);
  
  // --- ACCIONES DE NAVEGACIÓN ---
  const goHome = () => {
    setCurrentView('home');
    setViewProduct(null); // Limpiamos producto seleccionado al ir al home
    setSearchTerm('');
    setSearchSuggestions([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goContact = () => {
    setCurrentView('contact');
    setViewProduct(null);
    setSearchTerm('');
    setSearchSuggestions([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goLegal = () => {
    setCurrentView('legal');
    setViewProduct(null);
    setSearchTerm('');
    setSearchSuggestions([]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  const goToCatalog = (category = '') => {
    setSelectedCategory(category);
    setCurrentView('catalog');
    setViewProduct(null);
    setSearchTerm(''); 
    setSearchSuggestions([]); 
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- ACCIONES ---
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

  // --- FILTROS ---
  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const matchSearch = product.title.toLowerCase().includes(term) || product.tags?.some(t => t.toLowerCase().includes(term));
    const matchCategory = selectedCategory ? product.category === selectedCategory : true;
    const matchBrand = selectedBrand ? product.brand === selectedBrand : true;
    return matchSearch && matchCategory && matchBrand;
  });

  const acceptCookies = () => {
      localStorage.setItem('conputodo_cookie_consent', 'true');
      setShowCookieBanner(false);
  };

  return (
    <div className="relative min-h-screen font-sans bg-gray-50 text-slate-800">
      
      {/* ELEMENTOS FLOTANTES */}
      <FloatingWhatsapp />
      {showCookieBanner && <CookieBanner onAccept={acceptCookies} />}

      {/* MODAL CARRITO */}
      {isCartOpen && (
        <CartModal cart={cart} setCart={setCart} onClose={() => setIsCartOpen(false)} totalUSD={cartTotalUSD} onRemove={removeFromCart} exchangeRate={exchangeRate} />
      )}

      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 shadow-sm">
        <div className="container flex items-center justify-between gap-4 px-4 py-4 mx-auto">
          
          <div className="flex items-center gap-2 cursor-pointer group" onClick={goHome}>
            <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-neutral-900 transition-colors">C</div>
            <span className="text-xl font-bold text-slate-900 hidden sm:block group-hover:text-[#FF6600] transition-colors">Conputodo</span>
          </div>
          
          {/* Buscador Central (Con Ref para click outside) */}
          <div className="relative flex-1 hidden max-w-xl sm:block group" ref={searchRef}>
            <div className="relative">
                <input 
                  type="text" 
                  placeholder="Buscar productos..." 
                  value={searchTerm} 
                  onChange={handleSearchChange} 
                  onKeyDown={(e) => e.key === 'Enter' && goToCatalog()}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6600] transition-all"
                />
                <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
            </div>
            {/* Live Search Dropdown */}
            {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-2 overflow-hidden duration-200 bg-white border border-gray-100 shadow-xl top-full rounded-xl animate-in fade-in zoom-in-95">
                    {searchSuggestions.map(prod => (
                        <div key={prod.id} onClick={() => handleProductClick(prod)} className="flex items-center gap-3 p-3 transition-colors border-b cursor-pointer hover:bg-orange-50 border-gray-50 last:border-0">
                            <div className="flex-shrink-0 w-10 h-10 overflow-hidden bg-gray-100 rounded">
                                {prod.images?.main && <img src={prod.images.main} className="object-cover w-full h-full"/>}
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{prod.title}</h4>
                                <span className="text-xs text-[#FF6600] font-bold">${prod.prices?.usd?.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    <div onClick={() => goToCatalog()} className="p-2 text-center text-xs font-bold text-slate-500 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:text-[#FF6600]">
                        Ver todos los resultados
                    </div>
                </div>
            )}
          </div>

          <div className="flex items-center gap-6">
            <button onClick={() => goToCatalog()} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] transition-colors hidden md:block">Tienda</button>
            <button onClick={goContact} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] transition-colors hidden md:block">Contacto</button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 transition-colors rounded-full hover:bg-gray-100 group">
              <ShoppingCart size={24} className="text-slate-700 group-hover:text-[#FF6600] transition-colors" />
              {cart.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-[#FF6600] text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">{cart.length}</span>}
            </button>
            <button className="p-2 sm:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={24}/> : <Menu size={24}/>}</button>
          </div>
        </div>
        
        {/* Mobile Search & Menu */}
        <div className="px-4 pb-3 space-y-3 sm:hidden">
           <div className="relative">
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} className="w-full py-2 pl-10 pr-4 bg-gray-100 rounded-lg outline-none"/>
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            {searchSuggestions.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 duration-200 bg-white border border-gray-200 rounded-lg shadow-lg top-full animate-in fade-in zoom-in-95">
                    {searchSuggestions.map(prod => (
                        <div key={prod.id} onClick={() => handleProductClick(prod)} className="p-3 text-sm truncate border-b">{prod.title}</div>
                    ))}
                </div>
            )}
           </div>
           {isMenuOpen && (
               <div className="flex flex-col gap-2 pt-2 border-t animate-in slide-in-from-top-2">
                   <button onClick={() => goToCatalog()} className="text-left font-medium py-2 hover:text-[#FF6600]">Tienda</button>
                   <button onClick={goContact} className="text-left font-medium py-2 hover:text-[#FF6600]">Contacto</button>
               </div>
           )}
        </div>
      </header>

      {/* =======================================================
          VISTA 1: HOME PAGE
         ======================================================= */}
      {currentView === 'home' && (
        <div className="duration-700 animate-in fade-in">
          
          {/* HERO */}
          <div className="relative overflow-hidden text-white bg-neutral-900">
            <div className="absolute inset-0">
                {marketingData.heroImage ? (
                    <>
                        <img src={marketingData.heroImage} className="object-cover w-full h-full opacity-60" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600 via-neutral-900 to-black opacity-20"></div>
                )}
            </div>
            <div className="container relative z-10 flex flex-col items-center px-4 py-20 mx-auto text-center md:py-32 md:items-start md:text-left">
              <span className="text-[#FF6600] font-bold tracking-wider text-sm uppercase mb-4 animate-in slide-in-from-bottom-4 fade-in duration-1000">Josep Suply, C.A</span>
              <h1 className="mb-6 text-4xl font-extrabold leading-tight duration-1000 delay-150 md:text-6xl animate-in slide-in-from-bottom-8 fade-in">Tecnología al alcance<br/>de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6600] to-orange-400">tus manos</span></h1>
              <button onClick={() => goToCatalog()} className="px-8 py-4 bg-[#FF6600] hover:bg-orange-700 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-2 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
                Ver Catálogo <ArrowRight size={20}/>
              </button>
            </div>
          </div>

          {/* CATEGORÍAS */}
          <div className="py-16 bg-white">
            <div className="container px-4 mx-auto">
                <h2 className="mb-10 text-2xl font-bold text-center text-slate-900">Explora por Categoría</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
                  <CategoryCard title="Computadoras" icon={<Cpu size={36}/>} onClick={() => goToCatalog('Computadoras')} />
                  <CategoryCard title="Laptops" icon={<Laptop size={36}/>} onClick={() => goToCatalog('Laptops')} />
                  <CategoryCard title="Refurbished" icon={<Zap size={36}/>} onClick={() => goToCatalog('Refurbished')} />
                  <CategoryCard title="Impresoras" icon={<Printer size={36}/>} onClick={() => goToCatalog('Impresoras')} />
                  <CategoryCard title="UPS" icon={<BatteryCharging size={36}/>} onClick={() => goToCatalog('UPS')} />
                </div>
            </div>
          </div>

          {/* BANNER ZONA GAMER */}
          <div className="container px-4 mx-auto mb-16">
            <div className="relative overflow-hidden shadow-2xl cursor-pointer rounded-2xl group" onClick={() => goToCatalog('Gamer')}>
               <div className="absolute inset-0 z-0 bg-gradient-to-r from-violet-900 via-fuchsia-900 to-black"></div>
               <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0"></div>
               <div className="relative z-10 flex flex-col items-center justify-between gap-8 p-8 md:p-16 md:flex-row">
                  <div className="text-center md:text-left">
                    <div className="flex items-center justify-center gap-2 mb-2 text-sm font-bold tracking-widest uppercase md:justify-start text-fuchsia-400 animate-pulse">
                        <Gamepad2 size={20}/> Conputodo Gamer
                    </div>
                    <h2 className="mb-4 text-3xl italic font-black tracking-tighter text-white md:text-5xl">
                        LEVEL UP <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">YOUR SETUP</span>
                    </h2>
                    <p className="max-w-lg mb-6 text-gray-300">Equipos High-End, Workstations de Diseño y Periféricos Profesionales. Visita nuestra sede especializada.</p>
                    <button className="px-8 py-3 font-bold transition-colors bg-white rounded-full shadow-lg text-violet-900 hover:bg-fuchsia-50 shadow-fuchsia-900/50">
                        Entrar a la Zona Gamer
                    </button>
                  </div>
                  <div className="hidden transition-transform duration-700 transform md:block opacity-80 group-hover:scale-110">
                     <Gamepad2 size={180} className="text-white/10"/>
                  </div>
               </div>
            </div>
          </div>

          {/* OFERTAS DE LA SEMANA */}
          <div className="container px-4 py-16 mx-auto border-t border-gray-100">
             <div className="flex items-end justify-between mb-8">
                <h2 className="text-2xl font-bold md:text-3xl text-slate-900">🔥 Ofertas de la Semana</h2>
                <button onClick={() => goToCatalog()} className="text-[#FF6600] font-bold text-sm flex items-center gap-1 hover:underline">Ver todo <ArrowRight size={16}/></button>
             </div>
             {loading ? <div className="py-10 text-center"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div> : (
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 auto-rows-fr"> 
                  {products.slice(0, 4).map(product => (
                      <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />
                  ))}
               </div>
             )}
          </div>

          {/* BANNER INFORMATIVO (NOTICIAS) */}
          {marketingData.newsText && (
            <div className="bg-neutral-900 py-4 border-y-4 border-[#FF6600] animate-in fade-in slide-in-from-bottom-2">
                <div className="container flex items-center justify-center gap-3 px-4 mx-auto text-white">
                    <Bell className="text-[#FF6600] animate-bounce" size={20}/>
                    <p className="text-sm font-medium md:text-base">{marketingData.newsText}</p>
                </div>
            </div>
          )}

          {/* SECCIÓN MARCAS */}
          <div className="py-10 border-b bg-slate-50 border-slate-200">
              <div className="container px-4 mx-auto text-center">
                  <p className="mb-6 text-xs font-bold tracking-widest uppercase text-slate-400">Explora las marcas más reconocidas</p>
                  <div className="flex flex-wrap items-center justify-center gap-8 transition-all duration-500 md:gap-16 opacity-60 grayscale hover:grayscale-0">
                      <span className="text-2xl font-black text-slate-800">HP</span>
                      <span className="text-2xl italic font-black text-slate-800">DELL</span>
                      <span className="text-2xl font-black tracking-tighter text-slate-800">LENOVO</span>
                      <span className="font-serif text-2xl font-black text-slate-800">Canon</span>
                      <span className="text-2xl font-black text-slate-800">EPSON</span>
                      <span className="px-2 text-xl font-bold border-2 text-slate-800 border-slate-800">LOGITECH</span>
                  </div>
              </div>
          </div>

          {/* PRODUCTOS DESTACADOS */}
          <div className="py-16 overflow-hidden bg-white">
             <div className="container px-4 mx-auto">
                <h2 className="mb-8 text-2xl font-bold text-slate-900">✨ Productos Destacados</h2>
                <div className="flex items-stretch gap-4 pb-8 overflow-x-auto snap-x scrollbar-hide"> 
                    {loading ? <div className="w-full text-center"><Loader2 className="mx-auto animate-spin"/></div> : 
                     products.filter(p => p.isFeatured).map(product => (
                        <div key={product.id} className="w-[200px] md:w-[240px] flex-none snap-start transition-transform duration-300 h-full">
                            <ProductCard product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />
                        </div>
                     ))
                    }
                    {!loading && products.filter(p => p.isFeatured).length === 0 && <p className="italic text-gray-400">No hay productos destacados aún.</p>}
                </div>
             </div>
          </div>

          {/* BENEFICIOS */}
          <div className="bg-white border-t border-gray-100">
            <div className="container grid grid-cols-2 gap-8 px-4 py-16 mx-auto md:grid-cols-4">
               <FeatureItem icon={<Truck className="text-[#FF6600]" size={32}/>} title="Envíos Nacionales" desc="Tealca y Zoom" />
               <FeatureItem icon={<ShieldCheck className="text-[#FF6600]" size={32}/>} title="Garantía Real" desc="En todos los equipos" />
               <FeatureItem icon={<MapPin className="text-[#FF6600]" size={32}/>} title="Retiro en Tienda" desc="Maracay, Edo Aragua" />
               <FeatureItem icon={<MessageCircle className="text-[#FF6600]" size={32}/>} title="Atención VIP" desc="Asesoría WhatsApp" />
            </div>
          </div>

        </div>
      )}

      {/* =======================================================
          VISTA 2: CATÁLOGO
         ======================================================= */}
      {currentView === 'catalog' && (
        <main className="container flex flex-col gap-8 px-4 py-8 mx-auto duration-500 lg:flex-row animate-in fade-in">
          <aside className={`lg:w-64 flex-shrink-0 ${isMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky space-y-8 top-24">
               <div>
                 <h3 className="pb-2 mb-3 font-bold border-b text-slate-900">Categorías</h3>
                 <div className="space-y-1">
                   <button onClick={() => setSelectedCategory('')} className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory==='' ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-100'}`}>Todas</button>
                   {[...new Set(products.map(p=>p.category).filter(Boolean))].map(c => (
                     <button key={c} onClick={() => setSelectedCategory(c)} className={`block w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${selectedCategory===c ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-100'}`}>{c}</button>
                   ))}
                 </div>
               </div>
               <div>
                 <h3 className="pb-2 mb-3 font-bold border-b text-slate-900">Marcas</h3>
                 <div className="flex flex-wrap gap-2">
                    {uniqueBrands.map(brand => (
                        <button key={brand} onClick={() => setSelectedBrand(selectedBrand === brand ? '' : brand)} className={`px-3 py-1 rounded-full text-xs border transition-all ${selectedBrand === brand ? 'bg-neutral-800 text-white border-neutral-800' : 'bg-white text-slate-600 border-gray-200 hover:border-[#FF6600]'}`}>{brand}</button>
                    ))}
                 </div>
               </div>
            </div>
          </aside>
          <div className="flex-1">
             <div className="flex items-end justify-between mb-6">
                <div><h2 className="text-2xl font-bold text-slate-900">{selectedCategory || 'Catálogo Completo'}</h2>{selectedBrand && <span className="text-xs font-bold text-[#FF6600] bg-orange-50 px-2 py-1 rounded-full mt-1 inline-block">Marca: {selectedBrand}</span>}</div>
                <span className="text-sm text-slate-500">{filteredProducts.length} resultados</span>
             </div>
             {loading ? <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div> : (
               filteredProducts.length === 0 ? 
               <div className="py-20 text-center border-2 border-dashed rounded-xl"><Search className="mx-auto mb-2 text-gray-300" size={48}/><p className="text-gray-500">No encontramos productos.</p><button onClick={() => {setSearchTerm(''); setSelectedCategory(''); setSelectedBrand('');}} className="text-[#FF6600] font-bold mt-2">Limpiar filtros</button></div>
               :
               <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr">
                 {filteredProducts.map(product => (
                   <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />
                 ))}
               </div>
             )}
          </div>
        </main>
      )}

      {/* =======================================================
          VISTA 3: DETALLE DE PRODUCTO
         ======================================================= */}
      {currentView === 'product-detail' && viewProduct && (
          <div className="container px-4 py-8 mx-auto duration-300 animate-in slide-in-from-right">
              <button onClick={() => setCurrentView('catalog')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors"><ArrowRight className="rotate-180" size={18}/> Volver al catálogo</button>
              <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                  <div className="space-y-4">
                      <div className="flex items-center justify-center p-4 overflow-hidden bg-white border border-gray-200 shadow-sm aspect-square rounded-2xl">
                          {viewProduct.images?.main ? <img src={viewProduct.images.main} className="object-contain w-full h-full" /> : <div className="text-gray-300">Sin Imagen</div>}
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                          {[viewProduct.images?.main, ...(viewProduct.images?.gallery || [])].slice(0,4).map((src, i) => (
                              <div key={i} className="aspect-square border rounded-xl overflow-hidden cursor-pointer hover:border-[#FF6600] hover:shadow-md transition-all bg-white"><img src={src} className="object-cover w-full h-full"/></div>
                          ))}
                      </div>
                  </div>
                  <div className="flex flex-col">
                      <div className="text-sm font-bold text-[#FF6600] uppercase tracking-wider mb-2">{viewProduct.category}</div>
                      <h1 className="mb-4 text-3xl font-extrabold leading-tight md:text-4xl text-slate-900">{viewProduct.title}</h1>
                      <div className="flex items-end gap-4 pb-6 mb-6 border-b border-gray-100">
                          <span className="text-4xl font-black text-slate-900">${viewProduct.prices?.usd?.toFixed(2)}</span>
                          <span className="mb-2 text-sm text-slate-500">USD (Exento)</span>
                      </div>
                      <div className="mb-8 text-sm leading-relaxed prose whitespace-pre-wrap text-slate-600">{viewProduct.description || "Sin descripción detallada."}</div>
                      {viewProduct.specs && viewProduct.specs.length > 0 && (
                          <div className="p-6 mb-8 border bg-slate-50 rounded-xl border-slate-100"><h3 className="flex items-center gap-2 mb-4 font-bold text-slate-900"><FileText size={18}/> Especificaciones</h3><div className="space-y-2">{viewProduct.specs.map((spec, i) => (<div key={i} className="flex justify-between pb-2 text-sm border-b border-gray-200 last:border-0 last:pb-0"><span className="font-medium text-slate-600">{spec.key}</span><span className="font-bold text-slate-900">{spec.value}</span></div>))}</div></div>
                      )}
                      <div className="mt-auto">
                          {(() => {
                              const isAvailable = viewProduct.inStock !== false;
                              return (
                                <>
                                  <div className="flex items-center justify-between mb-4">
                                      <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-red-500'} flex items-center gap-2`}>
                                          {isAvailable ? <Check size={16}/> : <XCircle size={16}/>} {isAvailable ? 'Disponible' : 'Agotado temporalmente'}
                                      </span>
                                      {viewProduct.sku && <span className="font-mono text-xs text-gray-400">SKU: {viewProduct.sku}</span>}
                                  </div>
                                  <div className="flex gap-4">
                                      <button onClick={() => addToCart(viewProduct)} disabled={!isAvailable} className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700 shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><ShoppingCart/> {isAvailable ? 'Agregar al Carrito' : 'Sin Stock'}</button>
                                      <a href={`https://wa.me/${COMPANY_PHONE}?text=${encodeURIComponent(`Hola Conputodo, estoy interesado en: ${viewProduct.title}`)}`} target="_blank" className="px-4 py-4 transition-colors bg-white border-2 border-gray-200 rounded-xl text-slate-600 hover:border-green-500 hover:text-green-600" title="Preguntar por WhatsApp"><MessageCircle size={24}/></a>
                                  </div>
                                </>
                              );
                          })()}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* =======================================================
          VISTA 4: CONTACTO
         ======================================================= */}
      {currentView === 'contact' && (
          <ContactSection db={db} />
      )}

      {/* =======================================================
          VISTA 5: LEGAL (TÉRMINOS Y CONDICIONES)
         ======================================================= */}
      {currentView === 'legal' && (
          <LegalSection onBack={() => setCurrentView('home')} />
      )}

      {/* FOOTER MEJORADO Y EXPANDIDO */}
      {currentView !== 'product-detail' && (
        <footer className="pt-16 pb-8 mt-auto text-white border-t bg-neutral-900 border-neutral-800">
            <div className="container px-4 mx-auto">
                <div className="grid grid-cols-1 gap-12 mb-12 md:grid-cols-4">
                    
                    {/* COLUMNA 1: MARCA Y DESCRIPCIÓN */}
                    <div className="space-y-4 md:col-span-1">
                        <div className="flex items-center gap-2 text-2xl font-bold text-white">
                            <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center">C</div> 
                            Conputodo
                        </div>
                        <p className="text-sm leading-relaxed text-neutral-400">
                            Tu aliado tecnológico de confianza en Maracay. Especialistas en computación, redes, energía y el apasionante mundo Gaming. Calidad y garantía en cada equipo.
                        </p>
                        <div className="flex items-center gap-2 pt-4 text-xs text-neutral-500">
                            <MapPin size={16}/> Maracay, Edo. Aragua
                        </div>
                    </div>

                    {/* COLUMNA 2: NAVEGACIÓN RÁPIDA */}
                    <div>
                        <h4 className="inline-block pb-2 mb-6 text-lg font-bold border-b border-neutral-800">Navegación</h4>
                        <ul className="space-y-3 text-sm text-neutral-400">
                            <li><button onClick={goHome} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Inicio</button></li>
                            <li><button onClick={() => goToCatalog()} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Catálogo Completo</button></li>
                            <li><button onClick={goContact} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Ubicación y Contacto</button></li>
                            <li><button onClick={goLegal} className="hover:text-[#FF6600] transition-colors flex items-center gap-2"><ArrowRight size={14}/> Políticas y Garantía</button></li>
                        </ul>
                    </div>

                    {/* COLUMNA 3: REDES PRINCIPALES */}
                    <div>
                        <h4 className="inline-block pb-2 mb-6 text-lg font-bold border-b border-neutral-800">Conputodo Principal</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" target="_blank" className="flex items-center gap-3 transition-colors text-neutral-400 hover:text-pink-500">
                                    <Instagram size={20} /> <span>@conputodo</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" target="_blank" className="flex items-center gap-3 transition-colors text-neutral-400 hover:text-blue-500">
                                    <Facebook size={20} /> <span>Conputodo</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" target="_blank" className="flex items-center gap-3 transition-colors text-neutral-400 hover:text-green-500">
                                    <MessageCircle size={20} /> <span>WhatsApp Ventas</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" target="_blank" className="flex items-center gap-3 transition-colors text-neutral-400 hover:text-white">
                                    <Video size={20} /> <span>@conputodo (TikTok)</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                    {/* COLUMNA 4: REDES GAMER */}
                    <div>
                        <h4 className="inline-block pb-2 mb-6 text-lg font-bold border-b border-neutral-800">Conputodo Gamer</h4>
                        <ul className="space-y-4">
                            <li>
                                <a href="#" target="_blank" className="flex items-center gap-3 transition-colors text-neutral-400 hover:text-purple-500 group">
                                    <div className="p-1 transition-colors rounded bg-neutral-800 group-hover:bg-purple-900"><Instagram size={16} /></div>
                                    <span>@conputodogamer</span>
                                </a>
                            </li>
                            <li>
                                <a href="#" target="_blank" className="flex items-center gap-3 transition-colors text-neutral-400 hover:text-blue-600 group">
                                    <div className="p-1 transition-colors rounded bg-neutral-800 group-hover:bg-blue-900"><Facebook size={16} /></div>
                                    <span>Conputodo Gamer</span>
                                </a>
                            </li>
                        </ul>
                    </div>

                </div>

                {/* COPYRIGHT */}
                <div className="flex flex-col items-center justify-between pt-8 text-xs border-t border-neutral-800 md:flex-row text-neutral-600">
                    <p>© 2025 Josep Suply, C.A. - RIF: J-12345678-9</p>
                    <p className="flex gap-4 mt-2 md:mt-0">
                        <span>Desarrollado con ❤️ en Venezuela</span>
                    </p>
                </div>
            </div>
        </footer>
      )}

    </div>
  );
}

// --- SUB-COMPONENTE LEGAL ---
function LegalSection({ onBack }) {
    return (
        <div className="container max-w-4xl px-4 py-16 mx-auto duration-500 animate-in fade-in">
            <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors">
                <ArrowRight className="rotate-180" size={18}/> Volver al Inicio
            </button>
            
            <div className="p-8 space-y-10 bg-white border border-gray-100 shadow-sm md:p-12 rounded-2xl">
                <div className="pb-8 text-center border-b border-gray-100">
                    <div className="w-16 h-16 bg-orange-50 text-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4">
                        <ShieldCheck size={32}/>
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900">Políticas y Condiciones</h1>
                    <p className="mt-2 text-slate-500">Transparencia y confianza para nuestros clientes.</p>
                </div>

                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">🛡️ Políticas de Garantía</h3>
                    <div className="space-y-2 text-sm leading-relaxed prose text-slate-600">
                        <p>En <strong>Conputodo (Josep Suply C.A.)</strong>, nos esforzamos por ofrecer productos de la más alta calidad. Nuestras políticas de garantía son las siguientes:</p>
                        <ul className="pl-5 space-y-1 list-disc">
                            <li>Todos nuestros equipos nuevos cuentan con una garantía limitada por defectos de fábrica. El tiempo de cobertura varía según la marca y el producto específico (consultar en la descripción del producto o factura).</li>
                            <li>La garantía cubre exclusivamente fallas de hardware por defectos de fabricación.</li>
                            <li><strong>Exclusiones:</strong> La garantía NO cubre daños ocasionados por mal uso, golpes, humedad, intervención de terceros no autorizados, o problemas derivados del suministro eléctrico (bajones de luz, sobretensiones, falta de puesta a tierra).</li>
                            <li>Para procesar cualquier garantía, es indispensable presentar la factura original y el empaque del producto con todos sus accesorios en buen estado.</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">🚚 Envíos y Entregas</h3>
                    <div className="space-y-2 text-sm leading-relaxed prose text-slate-600">
                        <p>Realizamos envíos a nivel nacional trabajando con las principales empresas de encomienda (Zoom, Tealca, MRW).</p>
                        <ul className="pl-5 space-y-1 list-disc">
                            <li><strong>Responsabilidad:</strong> La mercancía viaja por cuenta y riesgo del cliente. Conputodo no se hace responsable por pérdidas, robos o daños ocasionados durante el traslado por la empresa de encomiendas. Recomendamos solicitar el envío asegurado.</li>
                            <li><strong>Tiempos de Procesamiento:</strong> Los pedidos confirmados antes de las 12:00 PM serán procesados el mismo día hábil. Pedidos posteriores se procesarán al día siguiente.</li>
                            <li><strong>Retiro en Tienda:</strong> Puede retirar su compra directamente en nuestra sede en Maracay sin costo adicional una vez confirmado el pago.</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">🔒 Privacidad de Datos</h3>
                    <div className="space-y-2 text-sm leading-relaxed prose text-slate-600">
                        <p>Respetamos su privacidad y protegemos su información personal.</p>
                        <ul className="pl-5 space-y-1 list-disc">
                            <li>Los datos solicitados en nuestro sitio web (Nombre, Cédula/RIF, Teléfono, Dirección) son utilizados única y exclusivamente para fines de facturación, procesamiento de pedidos y coordinación de envíos.</li>
                            <li>No compartimos ni vendemos su información a terceros con fines publicitarios.</li>
                            <li>Utilizamos cookies básicas para mejorar la funcionalidad del sitio (como recordar su carrito de compras) y para análisis anónimo de tráfico.</li>
                        </ul>
                    </div>
                </div>

                <div className="space-y-4">
                    <h3 className="flex items-center gap-2 text-xl font-bold text-slate-900">💳 Pagos</h3>
                    <div className="space-y-2 text-sm leading-relaxed prose text-slate-600">
                        <p>Aceptamos diversos métodos de pago para su comodidad. Al finalizar su pedido en la web, recibirá las instrucciones para completar el pago a través de nuestros canales oficiales.</p>
                        <ul className="pl-5 space-y-1 list-disc">
                            <li>La confirmación del pedido en la web reserva la mercancía por un tiempo limitado.</li>
                            <li>Es necesario reportar el pago a través de nuestro WhatsApp para procesar el despacho.</li>
                        </ul>
                    </div>
                </div>

            </div>
        </div>
    );
}

// --- SUB-COMPONENTE CONTACTO (CON MAPA LEAFLET CORREGIDO + LINK TEXTO) ---
function ContactSection({ db }) {
  const [formData, setFormData] = useState({
    companyName: '',
    companyRif: '',
    email: '',
    phone: '',
    message: ''
  });
  const [status, setStatus] = useState('idle'); 

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await addDoc(collection(db, "wholesale_requests"), {
        ...formData,
        createdAt: serverTimestamp(),
        emailStatus: 'pending' 
      });
      setStatus('success');
      setFormData({ companyName: '', companyRif: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  return (
    <div className="duration-500 animate-in fade-in">
      <div className="py-20 text-center text-white bg-neutral-900">
        <h1 className="mb-4 text-4xl font-bold">Contáctanos</h1>
        <p className="max-w-xl mx-auto text-neutral-400">Estamos ubicados en el corazón de Maracay para ofrecerte las mejores soluciones tecnológicas.</p>
      </div>
      <div className="container grid grid-cols-1 gap-12 px-4 py-16 mx-auto lg:grid-cols-2">
        <div className="space-y-8">
            <h2 className="text-2xl font-bold text-slate-900">Información de la Tienda</h2>
            <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><MapPin size={24}/></div>
                  <div>
                    <h4 className="font-bold text-slate-800">Ubicación</h4>
                    <p className="text-slate-600">Av. Bolívar, Centro Comercial Global, Local 12.<br/>Maracay, Edo. Aragua.</p>
                    {/* NUEVO LINK DE GOOGLE MAPS */}
                    <a href="https://maps.app.goo.gl/mZGVGx6C4LHT69ur6" target="_blank" rel="noopener noreferrer" className="text-sm text-[#FF6600] font-bold hover:underline flex items-center gap-1 mt-1">
                      Ver en Google Maps <ArrowRight size={14} />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-4"><div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><Phone size={24}/></div><div><h4 className="font-bold text-slate-800">Teléfonos</h4><p className="text-slate-600">+58 412 000 0000</p></div></div>
            </div>
            
            {/* MAPA INTERACTIVO (LEAFLET - COORDENADAS NUEVAS) */}
            <div className="relative z-0 w-full overflow-hidden border border-gray-200 shadow-inner h-80 rounded-2xl">
               <MapContainer 
                  center={[10.249758418955139, -67.60040315522524]} // COORDENADAS EXACTAS
                  zoom={17} 
                  scrollWheelZoom={false} 
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[10.249758418955139, -67.60040315522524]}>
                    <Popup>
                      <strong>Conputodo</strong><br />¡Te esperamos aquí!
                    </Popup>
                  </Marker>
                </MapContainer>
            </div>

        </div>
        <div className="p-8 bg-white border border-gray-100 shadow-xl rounded-2xl">
            {/* ... formulario existente ... */}
            <h3 className="flex items-center gap-2 mb-2 text-xl font-bold text-slate-900"><Building size={20} className="text-[#FF6600]"/> Mayoristas</h3>
            <p className="mb-6 text-sm text-slate-500">Solicita lista de precios para distribuidores. Todos los campos son obligatorios.</p>
            
            {status === 'success' ? (
              <div className="p-6 text-center text-green-700 border border-green-200 bg-green-50 rounded-xl">
                <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-green-100 rounded-full"><Check size={24}/></div>
                <h4 className="text-lg font-bold">¡Solicitud Enviada!</h4>
                <p className="text-sm">Hemos recibido tus datos. Te contactaremos a la brevedad.</p>
                <button onClick={() => setStatus('idle')} className="mt-4 text-sm font-bold underline">Enviar otra solicitud</button>
              </div>
            ) : (
              <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-bold uppercase text-slate-500">Empresa</label>
                      <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full p-3 border rounded-lg focus:border-[#FF6600] outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="Nombre Comercial" required/>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-bold uppercase text-slate-500">RIF</label>
                      <input type="text" name="companyRif" value={formData.companyRif} onChange={handleChange} className="w-full p-3 border rounded-lg focus:border-[#FF6600] outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="J-12345678-9" required/>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="block mb-1 text-xs font-bold uppercase text-slate-500">Correo Electrónico</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg focus:border-[#FF6600] outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="admin@empresa.com" required/>
                    </div>
                    <div>
                      <label className="block mb-1 text-xs font-bold uppercase text-slate-500">Teléfono</label>
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 border rounded-lg focus:border-[#FF6600] outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="0412-0000000" required/>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 text-xs font-bold uppercase text-slate-500">Requerimiento / Mensaje</label>
                    <textarea name="message" value={formData.message} onChange={handleChange} rows="3" className="w-full p-3 border rounded-lg focus:border-[#FF6600] outline-none bg-gray-50 focus:bg-white transition-colors" placeholder="Estoy interesado en..." required></textarea>
                  </div>

                  <button disabled={status === 'loading'} className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-[#FF6600] transition-colors flex items-center justify-center gap-2">
                    {status === 'loading' ? <Loader2 className="animate-spin"/> : <Send size={20}/>}
                    {status === 'loading' ? 'Enviando...' : 'Enviar Solicitud'}
                  </button>
                  {status === 'error' && <p className="mt-2 text-sm text-center text-red-500">Error al enviar. Intenta de nuevo.</p>}
              </form>
            )}
        </div>
      </div>
    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function FeatureItem({ icon, title, desc }) { return (<div className="flex flex-col items-center p-4 text-center"><div className="p-3 mb-3 rounded-full bg-orange-50">{icon}</div><h3 className="font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-500">{desc}</p></div>); }

function CategoryCard({ title, icon, onClick }) { 
  return (
    <div onClick={onClick} className="group bg-slate-50 border border-slate-100 hover:border-[#FF6600] p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex flex-col items-center text-center h-full justify-center">
        <div className="text-slate-400 group-hover:text-[#FF6600] transition-colors mb-3 transform group-hover:scale-110 duration-300">{icon}</div>
        <h3 className="text-sm font-bold md:text-base text-slate-800">{title}</h3>
    </div>
  ); 
}

function ProductCard({ product, onAddToCart, onClick }) {
  const isAvailable = product.inStock !== false;
  return (
    // FIX: "h-full" asegura que el card ocupe todo el alto disponible en el contenedor flex
    <div className="relative flex flex-col h-full overflow-hidden transition-all bg-white border border-gray-100 shadow-sm rounded-xl hover:shadow-md group">
      {!isAvailable && <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">AGOTADO</div>}
      <div onClick={onClick} className="relative flex-shrink-0 overflow-hidden cursor-pointer aspect-square bg-gray-50">
        {product.images?.main ? <img src={product.images.main} alt={product.title} className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"/> : <div className="flex items-center justify-center w-full h-full text-gray-300">Sin Imagen</div>}
      </div>
      <div className="flex flex-col flex-1 p-3"> 
        <div className="text-xs text-[#FF6600] font-semibold mb-1 uppercase tracking-wider">{product.category}</div>
        <h3 onClick={onClick} className="font-bold text-slate-800 mb-2 line-clamp-2 leading-tight cursor-pointer hover:text-[#FF6600] transition-colors">{product.title}</h3>
        <div className="flex items-center justify-between pt-3 mt-auto border-t border-gray-50">
          <span className="text-lg font-extrabold text-slate-900">${product.prices?.usd?.toFixed(2)}</span>
          <button onClick={onAddToCart} disabled={!isAvailable} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}><ShoppingCart size={16} /> {isAvailable ? 'Agregar' : 'Agotado'}</button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL CARRITO (CON ANIMACIÓN DE PLUGIN) ---
function CartModal({ cart, setCart, onClose, totalUSD, onRemove, exchangeRate }) {
  // ESC para cerrar
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const [step, setStep] = useState('cart'); 
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({ name: '', cedula: '', contact: '', method: 'pago_movil', shipping: 'tienda' });
  const [confirmedOrder, setConfirmedOrder] = useState(null); 

  const handleSubmitOrder = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      const orderData = { clientName: client.name, clientCedula: client.cedula, clientContact: client.contact, shippingMethod: client.shipping, paymentMethod: client.method, products: cart.map(p => ({ id: p.id, title: p.title, qty: p.qty, price: p.prices.usd })), totalUsd: totalUSD, totalBs: totalUSD * exchangeRate, exchangeRateSnapshot: exchangeRate, status: 'pendiente', createdAt: serverTimestamp() };
      const docRef = await addDoc(collection(db, "orders"), orderData);
      setConfirmedOrder({ ...orderData, id: docRef.id }); setStep('success'); setCart([]); 
    } catch (error) { console.error(error); alert("Error al procesar"); } finally { setLoading(false); }
  };

  const handleWhatsappRedirect = () => {
    if (!confirmedOrder) return; 
    const message = `Hola Conputodo! Soy *${confirmedOrder.clientName}* (CI: ${confirmedOrder.clientCedula}).\n\nRealicé el Pedido Web *#${confirmedOrder.id.slice(0, 6)}*.\n\n📋 *Resumen:*\n${confirmedOrder.products.map(p => `- ${p.qty}x ${p.title}`).join('\n')}\n\n💵 *Total:* $${confirmedOrder.totalUsd.toFixed(2)}\n💳 *Pago:* ${confirmedOrder.paymentMethod.replace('_', ' ').toUpperCase()}\n📍 *Entrega:* ${confirmedOrder.shippingMethod.toUpperCase()}\n\nQuedo atento para coordinar el pago.`;
    window.open(`https://wa.me/${COMPANY_PHONE}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    // BACKDROP CLICK: onClose al hacer click fuera
    <div className="fixed inset-0 z-50 flex justify-end duration-200 bg-black/50 animate-in fade-in" onClick={onClose}>
      {/* CONTENIDO MODAL: stopPropagation para no cerrar al clickear dentro */}
      <div className="flex flex-col w-full h-full max-w-md duration-300 bg-white shadow-2xl animate-in slide-in-from-right" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b bg-slate-50"><h2 className="text-lg font-bold text-slate-800">{step === 'cart' ? 'Tu Carrito' : step === 'form' ? 'Finalizar Compra' : 'Pedido Creado'}</h2><button onClick={onClose} className="p-2 rounded-full hover:bg-slate-200"><X size={20}/></button></div>
        <div className="flex-1 p-4 overflow-y-auto">
          {step === 'cart' && (cart.length === 0 ? <div className="py-10 text-center text-slate-400">Tu carrito está vacío.</div> : <div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex gap-4 pb-4 border-b border-gray-100"><div className="flex-shrink-0 w-16 h-16 overflow-hidden bg-gray-100 rounded-lg">{item.images?.main && <img src={item.images.main} className="object-cover w-full h-full"/>}</div><div className="flex-1"><h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</h4><div className="mb-1 text-xs text-slate-500">Cant: {item.qty} x ${item.prices.usd}</div><div className="font-bold text-[#FF6600]">${(item.prices.usd * item.qty).toFixed(2)}</div></div><button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></div>))}</div>)}
          {step === 'form' && (<form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4"><div><label className="block mb-1 text-sm font-medium">Nombre Completo</label><input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]" value={client.name} onChange={e=>setClient({...client, name: e.target.value})} placeholder="Ej. Juan Pérez"/></div><div><label className="block mb-1 text-sm font-medium">Cédula / RIF</label><input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]" value={client.cedula} onChange={e=>setClient({...client, cedula: e.target.value})} placeholder="V-12345678"/></div><div><label className="block mb-1 text-sm font-medium">WhatsApp</label><input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]" value={client.contact} onChange={e=>setClient({...client, contact: e.target.value})} placeholder="Ej. 0412-1234567"/></div><div className="grid grid-cols-2 gap-4"><div><label className="block mb-1 text-sm font-medium">Pago Preferido</label><select className="w-full p-2 border rounded-lg" value={client.method} onChange={e=>setClient({...client, method: e.target.value})}><option value="pago_movil">Pago Móvil</option><option value="zelle">Zelle</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></div><div><label className="block mb-1 text-sm font-medium">Entrega</label><select className="w-full p-2 border rounded-lg" value={client.shipping} onChange={e=>setClient({...client, shipping: e.target.value})}><option value="tienda">Retiro en Tienda</option><option value="delivery">Delivery</option><option value="nacional">Envío Nacional</option></select></div></div><div className="p-4 mt-4 text-sm text-orange-800 rounded-lg bg-orange-50"><p className="mb-1 font-bold">Resumen:</p><div className="flex justify-between"><span>Total a Pagar:</span> <strong>${totalUSD.toFixed(2)}</strong></div><p className="mt-2 text-xs italic text-orange-600">* El pago exacto en Bolívares se calculará al finalizar.</p></div></form>)}
          {step === 'success' && confirmedOrder && (<div className="py-10 text-center"><div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 text-green-600 bg-green-100 rounded-full"><Check size={32} strokeWidth={3} /></div><h3 className="mb-2 text-xl font-bold text-slate-800">¡Casi listo!</h3><p className="mb-6 text-slate-600">Tu pedido <strong>#{confirmedOrder.id.slice(0,6)}</strong> ha sido registrado. Para procesar el pago y envío, envíanos el detalle por WhatsApp.</p><button onClick={handleWhatsappRedirect} className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all mb-3"><MessageCircle size={24} /> Finalizar en WhatsApp</button><button onClick={onClose} className="w-full py-3 text-sm font-medium text-slate-500 hover:bg-slate-50 rounded-xl">Cerrar y seguir viendo</button></div>)}
        </div>
        {step !== 'success' && cart.length > 0 && (<div className="p-4 bg-white border-t">{step === 'cart' ? (<div className="space-y-3"><div className="flex justify-between text-xl font-bold text-slate-900"><span>Total</span><span>${totalUSD.toFixed(2)}</span></div><button onClick={() => setStep('form')} className="w-full py-3 bg-[#FF6600] hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">Continuar <ArrowRight size={20}/></button></div>) : (<button form="checkout-form" disabled={loading} className="flex items-center justify-center w-full gap-2 py-3 font-bold text-white bg-neutral-900 hover:bg-black rounded-xl">{loading ? <Loader2 className="animate-spin"/> : 'Confirmar Pedido'}</button>)}</div>)}
      </div>
    </div>
  );
}

// --- BOTÓN FLOTANTE WHATSAPP ---
function FloatingWhatsapp() {
  return (
    <a 
      href={`https://wa.me/${COMPANY_PHONE}?text=Hola%20Conputodo,%20tengo%20una%20duda.`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-[#25D366] text-white p-4 rounded-full shadow-xl hover:scale-110 transition-transform duration-200 flex items-center justify-center group"
    >
      <MessageCircle size={32} />
      <span className="absolute px-2 py-1 mr-3 text-xs font-bold transition-opacity bg-white rounded shadow-md opacity-0 right-full text-slate-800 group-hover:opacity-100 whitespace-nowrap">
        ¡Escríbenos!
      </span>
    </a>
  );
}

// --- BANNER DE COOKIES ---
function CookieBanner({ onAccept }) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 text-white z-50 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom-5">
        <div className="container flex flex-col items-center justify-between gap-4 px-4 mx-auto sm:flex-row">
            <div className="flex items-center gap-3">
                <Cookie size={24} className="text-[#FF6600] flex-shrink-0"/>
                <p className="text-sm text-neutral-300">
                    Utilizamos cookies propias y de terceros para mejorar tu experiencia y analizar el tráfico. 
                    Al continuar navegando, aceptas su uso.
                </p>
            </div>
            <div className="flex gap-3">
                <button onClick={onAccept} className="px-6 py-2 bg-[#FF6600] hover:bg-orange-700 text-white font-bold text-sm rounded-lg transition-colors whitespace-nowrap">
                    Aceptar
                </button>
            </div>
        </div>
    </div>
  );
}