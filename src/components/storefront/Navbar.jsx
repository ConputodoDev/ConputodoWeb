import React, { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Search, Menu, X } from 'lucide-react';

/**
 * Barra de Navegación Principal
 * * @param {Object} props
 * @param {number} props.cartCount - Cantidad de items en el carrito
 * @param {Function} props.onOpenCart - Función para abrir el carrito
 * @param {Function} props.onNavigate - Función para cambiar de vista ('home', 'catalog', 'contact')
 * @param {string} props.searchTerm - Texto actual del buscador
 * @param {Function} props.onSearchChange - Función al escribir en el buscador
 * @param {Array} props.searchSuggestions - Lista de productos sugeridos
 * @param {Function} props.onSuggestionClick - Función al hacer click en una sugerencia
 */
const Navbar = ({ 
  cartCount, 
  onOpenCart, 
  onNavigate, 
  searchTerm, 
  onSearchChange, 
  searchSuggestions = [], 
  onSuggestionClick 
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const searchRef = useRef(null);
  const showSuggestions = searchSuggestions.length > 0;

  // Cerrar sugerencias al hacer click fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        // Opción: Podrías llamar a una prop para limpiar sugerencias si lo manejas desde el padre
        // Por ahora confiamos en que el padre maneje el blur o limpiamos visualmente
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => { document.removeEventListener("mousedown", handleClickOutside); };
  }, [searchRef]);

  const handleNavigate = (view) => {
    onNavigate(view);
    setIsMenuOpen(false); // Cerrar menú móvil al navegar
  };

  return (
    <header className="bg-white sticky top-0 z-40 shadow-sm border-b border-gray-100">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
        
        {/* LOGO */}
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => handleNavigate('home')}>
          <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center text-white font-bold text-xl group-hover:bg-neutral-900 transition-colors">
            C
          </div>
          <span className="text-xl font-bold text-slate-900 hidden sm:block group-hover:text-[#FF6600] transition-colors">
            Conputodo
          </span>
        </div>
        
        {/* BUSCADOR (Desktop) */}
        <div className="flex-1 max-w-xl relative hidden sm:block group" ref={searchRef}>
          <div className="relative z-50">
            <input 
              type="text" 
              placeholder="Buscar productos..." 
              value={searchTerm} 
              onChange={onSearchChange} 
              onKeyDown={(e) => e.key === 'Enter' && handleNavigate('catalog')} 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100 rounded-full outline-none focus:bg-white focus:ring-2 focus:ring-[#FF6600] transition-all"
            />
            <Search size={18} className="absolute left-3.5 top-3 text-gray-400" />
          </div>

          {/* Sugerencias Dropdown */}
          <div className={`absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-40 transform transition-all duration-300 origin-top ${showSuggestions ? 'opacity-100 scale-100 translate-y-0 visible' : 'opacity-0 scale-95 -translate-y-2 invisible pointer-events-none'}`}>
            {searchSuggestions.map(prod => (
              <div 
                key={prod.id} 
                onClick={() => onSuggestionClick(prod)} 
                className="flex items-center gap-3 p-3 hover:bg-orange-50 cursor-pointer border-b border-gray-50 last:border-0 transition-colors"
              >
                <div className="w-10 h-10 bg-gray-100 rounded flex-shrink-0 overflow-hidden">
                  {prod.images?.main && <img src={prod.images.main} className="w-full h-full object-cover" alt={prod.title} />}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{prod.title}</h4>
                  <span className="text-xs text-[#FF6600] font-bold">${prod.prices?.usd?.toFixed(2)}</span>
                </div>
              </div>
            ))}
            <div 
              onClick={() => handleNavigate('catalog')} 
              className="p-2 text-center text-xs font-bold text-slate-500 bg-gray-50 cursor-pointer hover:bg-gray-100 hover:text-[#FF6600]"
            >
              Ver todos los resultados
            </div>
          </div>
        </div>

        {/* MENÚ DERECHO */}
        <div className="flex items-center gap-6">
          <button onClick={() => handleNavigate('catalog')} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] transition-colors hidden md:block">
            Tienda
          </button>
          <button onClick={() => handleNavigate('contact')} className="text-sm font-bold text-slate-600 hover:text-[#FF6600] transition-colors hidden md:block">
            Contacto
          </button>
          
          <button onClick={onOpenCart} className="relative p-2 hover:bg-gray-100 rounded-full transition-colors group">
            <ShoppingCart size={24} className="text-slate-700 group-hover:text-[#FF6600] transition-colors" />
            {cartCount > 0 && (
              <span className="absolute top-0 right-0 w-5 h-5 bg-[#FF6600] text-white text-xs font-bold flex items-center justify-center rounded-full border-2 border-white animate-in zoom-in duration-300">
                {cartCount}
              </span>
            )}
          </button>
          
          <button className="sm:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            {isMenuOpen ? <X size={24}/> : <Menu size={24}/>}
          </button>
        </div>
      </div>
      
      {/* MENÚ MÓVIL (Buscador + Links) */}
      {isMenuOpen && (
        <div className="sm:hidden px-4 pb-3 space-y-3 animate-in slide-in-from-top-2">
           <div className="relative">
            <input 
              type="text" 
              placeholder="Buscar..." 
              value={searchTerm} 
              onChange={onSearchChange} 
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg outline-none"
            />
            <Search size={18} className="absolute left-3 top-2.5 text-gray-400" />
            
            {/* Sugerencias Móvil */}
            <div className={`absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 z-50 transform transition-all duration-300 ${showSuggestions ? 'opacity-100 translate-y-0 visible' : 'opacity-0 -translate-y-2 invisible pointer-events-none'}`}>
                {searchSuggestions.map(prod => (
                  <div key={prod.id} onClick={() => { onSuggestionClick(prod); setIsMenuOpen(false); }} className="p-3 border-b text-sm truncate active:bg-gray-100">
                    {prod.title}
                  </div>
                ))}
            </div>
           </div>
           
           <div className="flex flex-col gap-2 pt-2 border-t">
             <button onClick={() => handleNavigate('catalog')} className="text-left font-medium py-2 hover:text-[#FF6600]">Tienda</button>
             <button onClick={() => handleNavigate('contact')} className="text-left font-medium py-2 hover:text-[#FF6600]">Contacto</button>
           </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;