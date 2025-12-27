import React, { useEffect } from 'react';
import { ArrowRight, Check, XCircle, ShoppingCart, MessageCircle, FileText } from 'lucide-react';

const ProductDetailPage = ({ product, onBack, onAddToCart }) => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product]);

  if (!product) return null;

  const isAvailable = product.inStock !== false && product.stock !== 0;
  const mainImage = product.images?.main || product.images?.[0];
  const gallery = product.images?.gallery || (Array.isArray(product.images) ? product.images : []) || [];
  const priceUsd = product.prices?.usd || 0;

  return (
    <div className="container mx-auto px-4 py-8 animate-in slide-in-from-right duration-300">
      <button 
        onClick={onBack} 
        className="mb-6 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors"
      >
        <ArrowRight className="rotate-180" size={18}/> Volver al catálogo
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* GALERÍA */}
        <div className="space-y-4">
          <div className="aspect-square bg-white rounded-2xl border border-gray-200 overflow-hidden flex items-center justify-center p-4 shadow-sm">
            {mainImage ? (
              <img src={mainImage} className="w-full h-full object-contain" alt={product.title} />
            ) : (
              <div className="text-gray-300">Sin Imagen</div>
            )}
          </div>
          {gallery.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {[mainImage, ...gallery].slice(0, 4).map((src, i) => (
                src && (
                  <div key={i} className="aspect-square border rounded-xl overflow-hidden cursor-pointer hover:border-[#FF6600] hover:shadow-md transition-all bg-white">
                    <img src={src} className="w-full h-full object-cover" alt="" />
                  </div>
                )
              ))}
            </div>
          )}
        </div>

        {/* INFO */}
        <div className="flex flex-col">
          <div className="text-sm font-bold text-[#FF6600] uppercase tracking-wider mb-2">
            {product.category || 'General'}
          </div>
          
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 leading-tight">
            {product.title}
          </h1>
          
          {/* Precio solo en USD */}
          <div className="flex flex-col mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-end gap-3">
               <span className="text-4xl font-black text-slate-900">${parseFloat(priceUsd).toFixed(2)}</span>
               <span className="text-sm text-slate-500 mb-2 font-medium">USD</span>
            </div>
          </div>

          <div className="prose text-slate-600 mb-8 text-sm leading-relaxed whitespace-pre-wrap">
            {product.description || "Sin descripción detallada."}
          </div>

          {/* Specs */}
          {product.specs && product.specs.length > 0 && (
            <div className="bg-slate-50 rounded-xl p-6 mb-8 border border-slate-100">
              <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                <FileText size={18}/> Especificaciones
              </h3>
              <div className="space-y-2">
                {product.specs.map((spec, i) => (
                  <div key={i} className="flex justify-between text-sm border-b border-gray-200 pb-2 last:border-0 last:pb-0">
                    <span className="font-medium text-slate-600">{spec.key}</span>
                    <span className="text-slate-900 font-bold">{spec.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-auto">
            <div className="flex items-center justify-between mb-4">
              <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-red-500'} flex items-center gap-2`}>
                {isAvailable ? <Check size={16}/> : <XCircle size={16}/>} 
                {isAvailable ? 'Disponible' : 'Agotado temporalmente'}
              </span>
              {product.sku && <span className="text-xs text-gray-400 font-mono">SKU: {product.sku}</span>}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={() => isAvailable && onAddToCart(product)} 
                disabled={!isAvailable} 
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700 shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <ShoppingCart/> {isAvailable ? 'Agregar al Carrito' : 'Sin Stock'}
              </button>
              
              <a 
                href={`https://wa.me/584120000000?text=${encodeURIComponent(`Hola Conputodo, estoy interesado en: ${product.title}`)}`} 
                target="_blank" 
                rel="noreferrer"
                className="px-4 py-4 border-2 border-gray-200 rounded-xl text-slate-600 hover:border-green-500 hover:text-green-600 transition-colors bg-white" 
                title="Preguntar por WhatsApp"
              >
                <MessageCircle size={24}/>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;