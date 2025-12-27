import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, XCircle, ShoppingCart, MessageCircle, FileText, Layers } from 'lucide-react';

const ProductDetailPage = ({ product, onBack, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // Resetear selección al cambiar de producto
    setSelectedVariant(null);
  }, [product]);

  if (!product) return null;

  // --- LÓGICA DE VARIANTES ---
  const hasVariants = product.variants && product.variants.length > 0;
  
  // Determinar Precio a mostrar
  const displayPrice = hasVariants 
    ? (selectedVariant ? selectedVariant.price : Math.min(...product.variants.map(v => v.price)))
    : product.prices?.usd || 0;

  // Determinar Stock a mostrar
  const displayStock = hasVariants
    ? (selectedVariant ? selectedVariant.stock : product.variants.reduce((acc, curr) => acc + curr.stock, 0))
    : product.stock;

  // Determinar SKU a mostrar
  const displaySku = hasVariants
    ? (selectedVariant ? selectedVariant.sku : product.sku)
    : product.sku;

  // Disponibilidad Global o Específica
  const isAvailable = displayStock > 0 && (product.inStock !== false);

  const mainImage = product.images?.main || product.images?.[0];
  const gallery = product.images?.gallery || (Array.isArray(product.images) ? product.images : []) || [];

  // --- MANEJO DE ADD TO CART ---
  const handleAddToCart = () => {
    if (hasVariants && !selectedVariant) {
      alert("⚠️ Por favor selecciona una opción (Talla, Color o Combo) antes de agregar.");
      return;
    }

    // Si es variable, creamos un objeto único para el carrito
    const itemToAdd = hasVariants ? {
      ...product,
      id: `${product.id}-${selectedVariant.id}`, // ID Único Compuesto
      originalId: product.id,
      title: `${product.title} - ${selectedVariant.name}`, // Título Descriptivo
      prices: { usd: selectedVariant.price }, // Precio Específico
      stock: selectedVariant.stock, // Stock Específico
      variantId: selectedVariant.id
    } : product;

    onAddToCart(itemToAdd);
  };

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
          
          {/* Precio Dinámico */}
          <div className="flex flex-col mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-end gap-3">
               <div className="flex flex-col">
                 {hasVariants && !selectedVariant && (
                   <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Desde</span>
                 )}
                 <span className="text-4xl font-black text-slate-900">${parseFloat(displayPrice).toFixed(2)}</span>
               </div>
               <span className="text-sm text-slate-500 mb-2 font-medium">USD</span>
            </div>
          </div>

          {/* SELECTOR DE VARIANTES */}
          {hasVariants && (
            <div className="mb-8 p-4 bg-orange-50 rounded-xl border border-orange-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                <Layers size={18} className="text-[#FF6600]"/> Selecciona una opción:
              </h3>
              <div className="flex flex-wrap gap-2">
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-bold border transition-all
                      ${selectedVariant?.id === v.id 
                        ? 'bg-[#FF6600] text-white border-[#FF6600] shadow-md transform scale-105' 
                        : 'bg-white text-slate-600 border-gray-200 hover:border-orange-300 hover:bg-orange-50'}
                      ${v.stock === 0 ? 'opacity-50 cursor-not-allowed decoration-slice' : ''}
                    `}
                    disabled={v.stock === 0}
                  >
                    {v.name}
                    {v.stock === 0 && ' (Agotado)'}
                  </button>
                ))}
              </div>
              {!selectedVariant && (
                <p className="text-xs text-orange-600 mt-2 font-medium animate-pulse">
                  * Debes elegir una opción para ver su disponibilidad.
                </p>
              )}
            </div>
          )}

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
                {isAvailable ? 'Disponible' : 'Agotado'}
                {hasVariants && !selectedVariant && isAvailable && <span className="text-slate-400 text-xs font-normal">(Selecciona variante)</span>}
              </span>
              {displaySku && <span className="text-xs text-gray-400 font-mono">SKU: {displaySku}</span>}
            </div>
            
            <div className="flex gap-4">
              <button 
                onClick={handleAddToCart}
                disabled={!isAvailable} 
                className={`flex-1 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${isAvailable ? 'bg-[#FF6600] text-white hover:bg-orange-700 shadow-lg shadow-orange-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
              >
                <ShoppingCart/> {isAvailable ? 'Agregar al Carrito' : 'Sin Stock'}
              </button>
              
              <a 
                href={`https://wa.me/584120000000?text=${encodeURIComponent(`Hola Conputodo, estoy interesado en: ${product.title} ${selectedVariant ? `(${selectedVariant.name})` : ''}`)}`} 
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