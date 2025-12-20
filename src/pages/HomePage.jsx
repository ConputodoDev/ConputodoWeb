import React, { useEffect, useState } from 'react';
import { ArrowRight, Cpu, Laptop, Zap, Printer, BatteryCharging, Gamepad2, Loader2, Bell, Truck, ShieldCheck, MapPin, MessageCircle } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../services/firebase'; 
import ProductCard from '../components/storefront/ProductCard';

const CategoryCard = ({ title, icon, onClick }) => (
  <div onClick={onClick} className="group bg-slate-50 border border-slate-100 hover:border-[#FF6600] p-6 rounded-2xl cursor-pointer transition-all hover:shadow-lg flex flex-col items-center text-center h-full justify-center">
    <div className="text-slate-400 group-hover:text-[#FF6600] transition-colors mb-3 transform group-hover:scale-110 duration-300">{icon}</div>
    <h3 className="font-bold text-sm md:text-base text-slate-800">{title}</h3>
  </div>
);

const FeatureItem = ({ icon, title, desc }) => (
  <div className="flex flex-col items-center text-center p-4">
    <div className="mb-3 p-3 bg-orange-50 rounded-full">{icon}</div>
    <h3 className="font-bold text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500">{desc}</p>
  </div>
);

const HomePage = ({ onNavigate, onAddToCart, products, loading, exchangeRate }) => {
  const [marketingData, setMarketingData] = useState({ heroImage: null, newsText: '' });

  useEffect(() => {
    const fetchMarketing = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "marketing"));
        if (docSnap.exists()) setMarketingData(docSnap.data());
      } catch (error) { console.error("Error cargando marketing:", error); }
    };
    fetchMarketing();
  }, []);

  return (
    <div className="animate-in fade-in duration-700">
      
      {/* 1. HERO SECTION */}
      <div className="relative bg-neutral-900 text-white overflow-hidden min-h-[500px] flex items-center">
        <div className="absolute inset-0 z-0">
          {marketingData.heroImage ? (
            <>
              <img src={marketingData.heroImage} alt="Hero Background" className="w-full h-full object-cover opacity-60 animate-in fade-in zoom-in-105 duration-[2000ms]" style={{ animationFillMode: 'both' }} />
              <div className="absolute inset-0 bg-gradient-to-r from-black/90 to-transparent"></div>
            </>
          ) : (
            <div className="w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-orange-600 via-neutral-900 to-black opacity-20"></div>
          )}
        </div>
        <div className="container mx-auto px-4 py-20 relative z-10 flex flex-col items-center md:items-start text-center md:text-left">
          <span className="text-[#FF6600] font-bold tracking-wider text-sm uppercase mb-4 animate-in slide-in-from-bottom-4 fade-in duration-1000">Josep Suply, C.A</span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-150">
            Tecnología al alcance<br/> de <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6600] to-orange-400">tus manos</span>
          </h1>
          <button onClick={() => onNavigate('catalog')} className="px-8 py-4 bg-[#FF6600] hover:bg-orange-700 text-white rounded-full font-bold text-lg shadow-lg shadow-orange-900/50 transition-all transform hover:-translate-y-1 flex items-center gap-2 animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300">
            Ver Catálogo <ArrowRight size={20}/>
          </button>
        </div>
      </div>

      {/* 2. CATEGORÍAS */}
      <div className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-10 text-center">Explora por Categoría</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <CategoryCard title="Computadoras" icon={<Cpu size={36}/>} onClick={() => onNavigate('catalog', { category: 'Computadoras' })} />
            <CategoryCard title="Laptops" icon={<Laptop size={36}/>} onClick={() => onNavigate('catalog', { category: 'Laptops' })} />
            <CategoryCard title="Refurbished" icon={<Zap size={36}/>} onClick={() => onNavigate('catalog', { category: 'Refurbished' })} />
            <CategoryCard title="Impresoras" icon={<Printer size={36}/>} onClick={() => onNavigate('catalog', { category: 'Impresoras' })} />
            <CategoryCard title="UPS" icon={<BatteryCharging size={36}/>} onClick={() => onNavigate('catalog', { category: 'UPS' })} />
          </div>
        </div>
      </div>

      {/* 3. GAMER BANNER */}
      <div className="container mx-auto px-4 mb-16">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl group cursor-pointer" onClick={() => onNavigate('catalog', { category: 'Gamer' })}>
          <div className="absolute inset-0 bg-gradient-to-r from-violet-900 via-fuchsia-900 to-black z-0"></div>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] z-0"></div>
          <div className="relative z-10 p-8 md:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2 text-fuchsia-400 font-bold tracking-widest uppercase text-sm animate-pulse">
                <Gamepad2 size={20}/> Conputodo Gamer
              </div>
              <h2 className="text-3xl md:text-5xl font-black text-white italic tracking-tighter mb-4">LEVEL UP <span className="text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 to-purple-400">YOUR SETUP</span></h2>
              <p className="text-gray-300 max-w-lg mb-6">Equipos High-End, Workstations de Diseño y Periféricos Profesionales.</p>
              <button className="px-8 py-3 bg-white text-violet-900 font-bold rounded-full hover:bg-fuchsia-50 transition-colors shadow-lg shadow-fuchsia-900/50">Entrar a la Zona Gamer</button>
            </div>
            <div className="hidden md:block opacity-80 transform group-hover:scale-110 transition-transform duration-700">
              <Gamepad2 size={180} className="text-white/10"/>
            </div>
          </div>
        </div>
      </div>

      {/* 4. OFERTAS */}
      <div className="container mx-auto px-4 py-16 border-t border-gray-100">
        <div className="flex justify-between items-end mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900">🔥 Ofertas de la Semana</h2>
          <button onClick={() => onNavigate('catalog')} className="text-[#FF6600] font-bold text-sm flex items-center gap-1 hover:underline">Ver todo <ArrowRight size={16}/></button>
        </div>
        {loading ? (
          <div className="text-center py-10"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
            {products.slice(0, 4).map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                exchangeRate={exchangeRate}
                onAddToCart={onAddToCart} 
                onClick={() => onNavigate('product-detail', product)} // <--- ¡AQUÍ TAMBIÉN!
              />
            ))}
          </div>
        )}
      </div>

      {/* 5. CINTILLO NOTICIAS */}
      {marketingData.newsText && (
        <div className="bg-neutral-900 py-4 border-y-4 border-[#FF6600] animate-in fade-in slide-in-from-bottom-2">
          <div className="container mx-auto px-4 flex items-center justify-center gap-3 text-white">
            <Bell className="text-[#FF6600] animate-bounce" size={20}/><p className="font-medium text-sm md:text-base">{marketingData.newsText}</p>
          </div>
        </div>
      )}

      {/* 6. MARCAS */}
      <div className="bg-slate-50 border-b border-slate-200 py-10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs mb-6">Explora las marcas más reconocidas</p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <span className="text-2xl font-black text-slate-800">HP</span><span className="text-2xl font-black text-slate-800 italic">DELL</span><span className="text-2xl font-black text-slate-800 tracking-tighter">LENOVO</span><span className="text-2xl font-black text-slate-800 font-serif">Canon</span><span className="text-2xl font-black text-slate-800">EPSON</span><span className="text-xl font-bold text-slate-800 border-2 border-slate-800 px-2">LOGITECH</span>
          </div>
        </div>
      </div>

      {/* 7. DESTACADOS */}
      <div className="bg-white py-16 overflow-hidden">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-8">✨ Productos Destacados</h2>
          <div className="flex overflow-x-auto gap-4 pb-8 snap-x scrollbar-hide items-stretch">
            {loading ? <div className="w-full text-center"><Loader2 className="animate-spin mx-auto"/></div> : 
              products.filter(p => p.isFeatured).map(product => (
                <div key={product.id} className="w-[200px] md:w-[240px] flex-none snap-start transition-transform duration-300 h-full">
                  <ProductCard 
                    product={product} 
                    exchangeRate={exchangeRate}
                    onAddToCart={onAddToCart} 
                    onClick={() => onNavigate('product-detail', product)} // <--- ¡Y AQUÍ!
                  />
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* 8. FEATURES */}
      <div className="bg-white border-t border-gray-100">
        <div className="container mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          <FeatureItem icon={<Truck className="text-[#FF6600]" size={32}/>} title="Envíos Nacionales" desc="Tealca y Zoom" />
          <FeatureItem icon={<ShieldCheck className="text-[#FF6600]" size={32}/>} title="Garantía Real" desc="En todos los equipos" />
          <FeatureItem icon={<MapPin className="text-[#FF6600]" size={32}/>} title="Retiro en Tienda" desc="Maracay, Edo Aragua" />
          <FeatureItem icon={<MessageCircle className="text-[#FF6600]" size={32}/>} title="Atención VIP" desc="Asesoría WhatsApp" />
        </div>
      </div>

    </div>
  );
};

export default HomePage;