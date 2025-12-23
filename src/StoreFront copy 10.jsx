import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { 
  ShoppingCart, Search, Menu, Filter, X, Check, XCircle, Trash2, ArrowRight, Loader2, MessageCircle,
  Truck, ShieldCheck, MapPin, Star, Laptop, Monitor, Mouse, Phone, Mail, Building, FileText, ChevronRight
} from 'lucide-react';

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

// --- CONFIGURACIÓN ---
const BRAND_ORANGE = "#FF6600";
const COMPANY_PHONE = "584120000000"; // <--- TU NÚMERO AQUÍ

export default function StoreFront() {
  // --- NAVEGACIÓN ---
  // Vistas: 'home', 'catalog', 'contact', 'product-detail'
  const [currentView, setCurrentView] = useState('home'); 
  const [viewProduct, setViewProduct] = useState(null); // Producto seleccionado para ver detalle

  // --- DATOS ---
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exchangeRate, setExchangeRate] = useState(0);
  
  // --- CARRITO ---
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  
  // --- BÚSQUEDA Y FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]); // Para el live search
  const [selectedCategory, setSelectedCategory] = useState('');
  
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          setExchangeRate(settingsSnap.data().exchangeRate || 0);
        }
        const q = query(collection(db, "products"), where("status", "==", "published"));
        const querySnapshot = await getDocs(q);
        setProducts(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) { console.error("Error:", error); } finally { setLoading(false); }
    };
    fetchData();
  }, []);

  // --- HELPERS ---
  const calculateBs = (usd) => (usd * exchangeRate);
  
  // --- ACCIONES DE NAVEGACIÓN ---
  const handleSearchChange = (e) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length > 1) {
      const suggestions = products.filter(p => 
        p.title.toLowerCase().includes(term.toLowerCase()) || 
        p.tags?.some(t => t.toLowerCase().includes(term.toLowerCase()))
      ).slice(0, 5); // Max 5 sugerencias
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

  const goToCatalog = (category = '') => {
    setSelectedCategory(category);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- LÓGICA CARRITO ---
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

  // --- FILTRADO PARA CATALOGO ---
  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const matchSearch = product.title.toLowerCase().includes(term) || product.tags?.some(t => t.toLowerCase().includes(term));
    const matchCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-slate-800 relative">
      
      {/* MODAL CARRITO */}
      {isCartOpen && (
        <CartModal cart={cart} setCart={setCart} onClose={() => setIsCartOpen(false)} totalUSD={cartTotalUSD} onRemove={removeFromCart} exchangeRate={exchangeRate} />
      )}

      {/* --- NAVBAR --- */}
      <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          
          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white font-bold text-xl">C</div>
            <span className="text-xl font-bold text-slate-900 hidden sm:block">Conputodo</span>
          </div>
          
          {/* Buscador Central con Live Search */}
          <div className="flex-1 max-w-xl relative hidden sm:block group">
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

            {/* Dropdown de Resultados (Live Search) */}
            {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50">
                    {searchSuggestions.map(prod => (
                        <div key={prod.id} onClick={() => handleProductClick(prod)} className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors">
                            <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                                {prod.images?.main && <img src={prod.images.main} className="w-full h-full object-cover"/>}
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

          {/* Iconos Nav */}
          <div className="flex items-center gap-6">
            <button onClick={() => goToCatalog()} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] hidden md:block">Tienda</button>
            <button onClick={() => setCurrentView('contact')} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] hidden md:block">Contacto</button>
            <button onClick={() => setIsCartOpen(true)} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors">
              <ShoppingCart size={24} className="text-slate-700" />
              {cart.length > 0 && <span className="absolute top-0 right-0 w-5 h-5 bg-[#FF6600] text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white">{cart.length}</span>}
            </button>
            <button className="sm:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>{isMenuOpen ? <X size={24}/> : <Menu size={24}/>}</button>
          </div>
        </div>
        
        {/* Mobile Menu & Search */}
        <div className="sm:hidden px-4 pb-3 space-y-3">
           <div className="relative">
            <input type="text" placeholder="Buscar..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none"/>
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            {/* Mobile Dropdown */}
            {searchSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {searchSuggestions.map(prod => (
                        <div key={prod.id} onClick={() => handleProductClick(prod)} className="p-3 border-b text-sm truncate">{prod.title}</div>
                    ))}
                </div>
            )}
           </div>
           {isMenuOpen && (
               <div className="flex flex-col gap-2 pt-2 border-t">
                   <button onClick={() => goToCatalog()} className="text-left font-medium py-2">Tienda</button>
                   <button onClick={() => setCurrentView('contact')} className="text-left font-medium py-2">Contacto</button>
               </div>
           )}
        </div>
      </header>

      {/* =======================================================
          VISTA 1: HOME PAGE (PORTADA)
         ======================================================= */}
      {currentView === 'home' && (
        <div className="animate-in fade-in duration-500">
          
          {/* HERO */}
          <div className="relative bg-neutral-900 text-white overflow-hidden">
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600 via-neutral-900 to-black"></div>
            <div className="container mx-auto px-4 py-20 md:py-32 relative z-10 flex flex-col items-center text-center">
              <span className="text-[#FF6600] font-bold tracking-wider text-sm uppercase mb-4">Josep Suply, C.A</span>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">Tecnología al alcance<br/>de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6600] to-orange-400">tus manos</span></h1>
              <button onClick={() => goToCatalog()} className="px-8 py-4 bg-[#FF6600] hover:bg-orange-700 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-2">Ver Catálogo <ArrowRight size={20}/></button>
            </div>
          </div>

          {/* BENEFICIOS */}
          <div className="bg-white border-b border-gray-100">
            <div className="container mx-auto px-4 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
               <FeatureItem icon={<Truck className="text-[#FF6600]" size={32}/>} title="Envíos Nacionales" desc="Tealca y Zoom" />
               <FeatureItem icon={<ShieldCheck className="text-[#FF6600]" size={32}/>} title="Garantía Real" desc="En todos los equipos" />
               <FeatureItem icon={<MapPin className="text-[#FF6600]" size={32}/>} title="Retiro en Tienda" desc="Maracay, Edo Aragua" />
               <FeatureItem icon={<MessageCircle className="text-[#FF6600]" size={32}/>} title="Atención VIP" desc="Asesoría WhatsApp" />
            </div>
          </div>

          {/* OFERTAS DESTACADAS (NUEVO) */}
          <div className="container mx-auto px-4 py-16">
             <div className="flex justify-between items-end mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900">🔥 Ofertas de la Semana</h2>
                <button onClick={() => goToCatalog()} className="text-[#FF6600] font-bold text-sm flex items-center gap-1 hover:underline">Ver todo <ArrowRight size={16}/></button>
             </div>
             {loading ? <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div> : (
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Mostramos los primeros 4 productos como "Destacados" por ahora */}
                  {products.slice(0, 4).map(product => (
                      <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />
                  ))}
               </div>
             )}
          </div>

          {/* CATEGORÍAS */}
          <div className="bg-slate-50 py-16">
            <div className="container mx-auto px-4">
                <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Explora por Categoría</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <CategoryCard title="Computación" icon={<Laptop size={48}/>} onClick={() => goToCatalog('Computacion')} />
                <CategoryCard title="Periféricos" icon={<Mouse size={48}/>} onClick={() => goToCatalog('Perifericos')} />
                <CategoryCard title="Monitores" icon={<Monitor size={48}/>} onClick={() => goToCatalog('Monitores')} />
                </div>
            </div>
          </div>
        </div>
      )}

      {/* =======================================================
          VISTA 2: CATÁLOGO
         ======================================================= */}
      {currentView === 'catalog' && (
        <main className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-300">
          <aside className={`lg:w-64 flex-shrink-0 ${isMenuOpen ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-24 space-y-6">
               <div>
                 <h3 className="font-bold mb-2 text-slate-800">Categorías</h3>
                 <div className="space-y-1">
                   <button onClick={() => setSelectedCategory('')} className={`block w-full text-left px-3 py-2 rounded-lg transition-colors ${selectedCategory==='' ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-100'}`}>Todas</button>
                   {[...new Set(products.map(p=>p.category))].map(c => (
                     <button key={c} onClick={() => setSelectedCategory(c)} className={`block w-full text-left px-3 py-2 rounded-lg capitalize transition-colors ${selectedCategory===c ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-100'}`}>{c}</button>
                   ))}
                 </div>
               </div>
            </div>
          </aside>
          <div className="flex-1">
             <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-900">{selectedCategory || 'Catálogo Completo'}</h2>
                <span className="text-sm text-slate-500">{filteredProducts.length} productos</span>
             </div>
             {loading ? <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div> : (
               filteredProducts.length === 0 ? 
               <div className="text-center py-20 border-2 border-dashed rounded-xl"><Search className="mx-auto text-gray-300 mb-2" size={48}/><p className="text-gray-500">No encontramos productos.</p><button onClick={() => {setSearchTerm(''); setSelectedCategory('');}} className="text-[#FF6600] font-bold mt-2">Limpiar filtros</button></div>
               :
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                 {filteredProducts.map(product => (
                   <ProductCard key={product.id} product={product} onAddToCart={() => addToCart(product)} onClick={() => handleProductClick(product)} />
                 ))}
               </div>
             )}
          </div>
        </main>
      )}

      {/* =======================================================
          VISTA 3: DETALLE DE PRODUCTO (PDP)
         ======================================================= */}
      {currentView === 'product-detail' && viewProduct && (
          <div className="container mx-auto px-4 py-8 animate-in slide-in-from-right-8 duration-300">
              <button onClick={() => setCurrentView('catalog')} className="mb-6 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors"><ArrowRight className="rotate-180" size={18}/> Volver al catálogo</button>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  {/* Columna Izquierda: Galería */}
                  <div className="space-y-4">
                      <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center p-4">
                          {viewProduct.images?.main ? <img src={viewProduct.images.main} className="w-full h-full object-contain" /> : <div className="text-gray-300">Sin Imagen</div>}
                      </div>
                      <div className="grid grid-cols-4 gap-4">
                          {/* Miniaturas (Placeholder si tuviera galería completa) */}
                          {[viewProduct.images?.main, ...(viewProduct.images?.gallery || [])].slice(0,4).map((src, i) => (
                              <div key={i} className="aspect-square border rounded-xl overflow-hidden cursor-pointer hover:border-[#FF6600]">
                                  <img src={src} className="w-full h-full object-cover"/>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Columna Derecha: Info */}
                  <div className="flex flex-col">
                      <div className="text-sm font-bold text-[#FF6600] uppercase tracking-wider mb-2">{viewProduct.category}</div>
                      <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">{viewProduct.title}</h1>
                      
                      <div className="flex items-end gap-4 mb-6 pb-6 border-b border-gray-100">
                          <span className="text-4xl font-black text-slate-900">${viewProduct.prices?.usd?.toFixed(2)}</span>
                          <span className="text-sm text-slate-500 mb-2">Precio en Dólares (Exento IVA)</span>
                      </div>

                      <div className="prose text-slate-600 mb-8 text-sm leading-relaxed whitespace-pre-wrap">
                          {viewProduct.description || "Sin descripción detallada."}
                      </div>

                      {/* Ficha Técnica */}
                      {viewProduct.specs && viewProduct.specs.length > 0 && (
                          <div className="bg-slate-50 rounded-xl p-6 mb-8">
                              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><FileText size={18}/> Especificaciones</h3>
                              <div className="space-y-2">
                                  {viewProduct.specs.map((spec, i) => (
                                      <div key={i} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                                          <span className="font-medium text-slate-600">{spec.key}</span>
                                          <span className="text-slate-900 font-bold">{spec.value}</span>
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}

                      <div className="mt-auto">
                          <div className="flex items-center justify-between mb-4">
                              <span className={`text-sm font-bold ${viewProduct.inStock ? 'text-green-600' : 'text-red-500'} flex items-center gap-2`}>
                                  {viewProduct.inStock ? <Check size={16}/> : <XCircle size={16}/>}
                                  {viewProduct.inStock ? 'Disponible para entrega inmediata' : 'Agotado temporalmente'}
                              </span>
                              {viewProduct.sku && <span className="text-xs text-gray-400 font-mono">SKU: {viewProduct.sku}</span>}
                          </div>
                          
                          <div className="flex gap-4">
                              <button 
                                  onClick={() => addToCart(viewProduct)}
                                  disabled={!viewProduct.inStock}
                                  className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-transform active:scale-95
                                  ${viewProduct.inStock ? 'bg-[#FF6600] text-white hover:bg-orange-700 shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                              >
                                  <ShoppingCart/> {viewProduct.inStock ? 'Agregar al Carrito' : 'Sin Stock'}
                              </button>
                              <a 
                                  href={`https://wa.me/${COMPANY_PHONE}?text=${encodeURIComponent(`Hola, me interesa este producto: ${viewProduct.title}`)}`}
                                  target="_blank"
                                  className="px-4 py-4 border-2 border-gray-200 rounded-xl text-slate-600 hover:border-green-500 hover:text-green-600 transition-colors"
                                  title="Preguntar por WhatsApp"
                              >
                                  <MessageCircle size={24}/>
                              </a>
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* =======================================================
          VISTA 4: CONTACTO
         ======================================================= */}
      {currentView === 'contact' && (
          <div className="animate-in fade-in duration-500">
              <div className="bg-neutral-900 text-white py-20 text-center">
                  <h1 className="text-4xl font-bold mb-4">Contáctanos</h1>
                  <p className="text-neutral-400 max-w-xl mx-auto">Estamos ubicados en el corazón de Maracay para ofrecerte las mejores soluciones tecnológicas.</p>
              </div>
              
              <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
                  {/* Info */}
                  <div className="space-y-8">
                      <h2 className="text-2xl font-bold text-slate-900">Información de la Tienda</h2>
                      <div className="space-y-6">
                          <div className="flex items-start gap-4">
                              <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><MapPin size={24}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Ubicación Principal</h4>
                                  <p className="text-slate-600">Av. Bolívar, Centro Comercial Global, Local 12.<br/>Maracay, Edo. Aragua.</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-4">
                              <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><Phone size={24}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Teléfonos</h4>
                                  <p className="text-slate-600">+58 412 000 0000 (Ventas)</p>
                                  <p className="text-slate-600">+58 243 000 0000 (Soporte)</p>
                              </div>
                          </div>
                          <div className="flex items-start gap-4">
                              <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><Mail size={24}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Correo Electrónico</h4>
                                  <p className="text-slate-600">ventas@conputodo.com</p>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Formulario Mayorista */}
                  <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
                      <h3 className="text-xl font-bold text-slate-900 mb-2 flex items-center gap-2"><Building size={20} className="text-[#FF6600]"/> Clientes Mayoristas</h3>
                      <p className="text-sm text-slate-500 mb-6">Solicita nuestra lista de precios para distribuidores.</p>
                      
                      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); alert("Solicitud enviada (Simulación)"); }}>
                          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nombre del Encargado</label><input type="text" className="w-full p-3 border rounded-lg outline-none focus:border-[#FF6600]" required/></div>
                          <div className="grid grid-cols-2 gap-4">
                              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa</label><input type="text" className="w-full p-3 border rounded-lg outline-none focus:border-[#FF6600]" required/></div>
                              <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">RIF</label><input type="text" className="w-full p-3 border rounded-lg outline-none focus:border-[#FF6600]" required/></div>
                          </div>
                          <div><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mensaje</label><textarea rows="3" className="w-full p-3 border rounded-lg outline-none focus:border-[#FF6600]"></textarea></div>
                          <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg hover:bg-[#FF6600] transition-colors">Enviar Solicitud</button>
                      </form>
                  </div>
              </div>
          </div>
      )}

      {/* FOOTER */}
      {currentView !== 'product-detail' && (
        <footer className="bg-neutral-900 text-neutral-500 py-12 border-t border-neutral-800 mt-auto">
            <div className="container mx-auto px-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-4 text-white font-bold text-xl"><div className="w-8 h-8 bg-[#FF6600] rounded flex items-center justify-center">C</div> Conputodo</div>
                <p className="text-sm">© 2025 Josep Suply, C.A. Todos los derechos reservados.</p>
            </div>
        </footer>
      )}

    </div>
  );
}

// --- COMPONENTES AUXILIARES ---
function FeatureItem({ icon, title, desc }) {
  return (<div className="flex flex-col items-center text-center p-4"><div className="mb-3 p-3 bg-orange-50 rounded-full">{icon}</div><h3 className="font-bold text-slate-900">{title}</h3><p className="text-sm text-slate-500">{desc}</p></div>);
}
function CategoryCard({ title, icon, onClick }) {
  return (<div onClick={onClick} className="group bg-slate-50 border border-slate-100 hover:border-[#FF6600] p-8 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex flex-col items-center text-center"><div className="text-slate-400 group-hover:text-[#FF6600] transition-colors mb-4 transform group-hover:scale-110 duration-300">{icon}</div><h3 className="font-bold text-xl text-slate-800">{title}</h3><span className="text-sm text-slate-500 mt-2 flex items-center gap-1 group-hover:text-[#FF6600]">Ver productos <ArrowRight size={14}/></span></div>);
}
function ProductCard({ product, onAddToCart, onClick }) {
  const isAvailable = product.inStock !== false;
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative group">
      {!isAvailable && <div className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full z-10">AGOTADO</div>}
      {/* Clic en imagen va al detalle */}
      <div onClick={onClick} className="relative aspect-square bg-gray-50 overflow-hidden cursor-pointer">
        {product.images?.main ? <img src={product.images.main} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/> : <div className="w-full h-full flex items-center justify-center text-gray-300">Sin Imagen</div>}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs text-[#FF6600] font-semibold mb-1 uppercase tracking-wider">{product.category}</div>
        {/* Clic en titulo va al detalle */}
        <h3 onClick={onClick} className="font-bold text-slate-800 mb-2 line-clamp-2 leading-tight cursor-pointer hover:text-[#FF6600] transition-colors">{product.title}</h3>
        <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
          <span className="text-xl font-extrabold text-slate-900">${product.prices?.usd?.toFixed(2)}</span>
          <button onClick={onAddToCart} disabled={!isAvailable} className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors flex items-center gap-2 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}><ShoppingCart size={16} /> {isAvailable ? 'Agregar' : 'Agotado'}</button>
        </div>
      </div>
    </div>
  );
}

// --- MODAL CARRITO (Misma lógica previa) ---
function CartModal({ cart, setCart, onClose, totalUSD, onRemove, exchangeRate }) {
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
    <div className="fixed inset-0 z-50 bg-black/50 flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50"><h2 className="font-bold text-lg text-slate-800">{step === 'cart' ? 'Tu Carrito' : step === 'form' ? 'Finalizar Compra' : 'Pedido Creado'}</h2><button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full"><X size={20}/></button></div>
        <div className="flex-1 overflow-y-auto p-4">
          {step === 'cart' && (cart.length === 0 ? <div className="text-center py-10 text-slate-400">Tu carrito está vacío.</div> : <div className="space-y-4">{cart.map(item => (<div key={item.id} className="flex gap-4 border-b border-gray-100 pb-4"><div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">{item.images?.main && <img src={item.images.main} className="w-full h-full object-cover"/>}</div><div className="flex-1"><h4 className="font-bold text-sm text-slate-800 line-clamp-1">{item.title}</h4><div className="text-xs text-slate-500 mb-1">Cant: {item.qty} x ${item.prices.usd}</div><div className="font-bold text-[#FF6600]">${(item.prices.usd * item.qty).toFixed(2)}</div></div><button onClick={() => onRemove(item.id)} className="text-red-400 hover:text-red-600"><Trash2 size={18}/></button></div>))}</div>)}
          {step === 'form' && (<form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4"><div><label className="block text-sm font-medium mb-1">Nombre Completo</label><input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]" value={client.name} onChange={e=>setClient({...client, name: e.target.value})} placeholder="Ej. Juan Pérez"/></div><div><label className="block text-sm font-medium mb-1">Cédula / RIF</label><input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]" value={client.cedula} onChange={e=>setClient({...client, cedula: e.target.value})} placeholder="V-12345678"/></div><div><label className="block text-sm font-medium mb-1">WhatsApp</label><input required type="text" className="w-full p-2 border rounded-lg outline-none focus:ring-2 focus:ring-[#FF6600]" value={client.contact} onChange={e=>setClient({...client, contact: e.target.value})} placeholder="Ej. 0412-1234567"/></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Pago Preferido</label><select className="w-full p-2 border rounded-lg" value={client.method} onChange={e=>setClient({...client, method: e.target.value})}><option value="pago_movil">Pago Móvil</option><option value="zelle">Zelle</option><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option></select></div><div><label className="block text-sm font-medium mb-1">Entrega</label><select className="w-full p-2 border rounded-lg" value={client.shipping} onChange={e=>setClient({...client, shipping: e.target.value})}><option value="tienda">Retiro en Tienda</option><option value="delivery">Delivery</option><option value="nacional">Envío Nacional</option></select></div></div><div className="bg-orange-50 p-4 rounded-lg text-sm text-orange-800 mt-4"><p className="font-bold mb-1">Resumen:</p><div className="flex justify-between"><span>Total a Pagar:</span> <strong>${totalUSD.toFixed(2)}</strong></div><p className="mt-2 text-xs italic text-orange-600">* El pago exacto en Bolívares se calculará al finalizar.</p></div></form>)}
          {step === 'success' && confirmedOrder && (<div className="text-center py-10"><div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4"><Check size={32} strokeWidth={3} /></div><h3 className="text-xl font-bold text-slate-800 mb-2">¡Casi listo!</h3><p className="text-slate-600 mb-6">Tu pedido <strong>#{confirmedOrder.id.slice(0,6)}</strong> ha sido registrado. Para procesar el pago y envío, envíanos el detalle por WhatsApp.</p><button onClick={handleWhatsappRedirect} className="w-full py-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-200 transition-all mb-3"><MessageCircle size={24} /> Finalizar en WhatsApp</button><button onClick={onClose} className="w-full py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-medium text-sm">Cerrar y seguir viendo</button></div>)}
        </div>
        {step !== 'success' && cart.length > 0 && (<div className="p-4 border-t bg-white">{step === 'cart' ? (<div className="space-y-3"><div className="flex justify-between text-xl font-bold text-slate-900"><span>Total</span><span>${totalUSD.toFixed(2)}</span></div><button onClick={() => setStep('form')} className="w-full py-3 bg-[#FF6600] hover:bg-orange-700 text-white rounded-xl font-bold flex items-center justify-center gap-2">Continuar <ArrowRight size={20}/></button></div>) : (<button form="checkout-form" disabled={loading} className="w-full py-3 bg-neutral-900 hover:bg-black text-white rounded-xl font-bold flex items-center justify-center gap-2">{loading ? <Loader2 className="animate-spin"/> : 'Confirmar Pedido'}</button>)}</div>)}
      </div>
    </div>
  );
}