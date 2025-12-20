import React from 'react';
import { ShoppingCart, Heart, AlertCircle } from 'lucide-react';

const ProductCard = ({ product, exchangeRate, onAddToCart, onClick }) => {
  // Helpers para estado del producto
  const hasStock = product.inStock !== false && product.stock !== 0; // Ajustado a tu lógica de 'inStock' boolean o número
  const isLowStock = product.stock > 0 && product.stock <= 3;
  
  // Cálculo de precio en Bolívares
  // Nota: prices.usd viene de tu DB
  const priceUsd = product.prices?.usd || 0;
  const priceBs = (priceUsd * exchangeRate).toLocaleString('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });

  // Manejo de imagen: Soporta estructura { main: 'url' } o array ['url']
  const imageUrl = product.images?.main || product.images?.[0] || null;

  return (
    <div className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col h-full overflow-hidden relative">
      
      {/* --- Badges / Etiquetas --- */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.isFeatured && (
          <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
            DESTACADO
          </span>
        )}
        {/* Si tienes campo de oferta/nuevo en el futuro, agrégalo aquí */}
      </div>

      {/* --- Imagen del Producto --- */}
      <div 
        onClick={onClick} 
        className="relative aspect-square overflow-hidden bg-gray-50 cursor-pointer"
      >
        {!hasStock && (
          <div className="absolute inset-0 bg-black/50 z-20 flex items-center justify-center backdrop-blur-[1px]">
            <span className="bg-white/90 text-gray-800 font-bold px-3 py-1 rounded-full text-sm shadow-lg flex items-center gap-1">
              <AlertCircle size={14} /> Agotado
            </span>
          </div>
        )}
        
        {imageUrl ? (
          <img 
            src={imageUrl} 
            alt={product.title}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${!hasStock ? 'grayscale' : ''}`}
            loading="lazy"
          />
        ) : (
           <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
             Sin Imagen
           </div>
        )}
      </div>

      {/* --- Contenido --- */}
      <div className="p-4 flex flex-col flex-grow">
        {/* Categoría */}
        <div className="text-xs text-orange-500 font-medium mb-1 uppercase tracking-wider truncate">
          {product.category || 'General'}
        </div>

        {/* Título (CORREGIDO: usa .title) */}
        <h3 
          onClick={onClick}
          className="font-bold text-gray-800 text-lg leading-tight mb-2 line-clamp-2 group-hover:text-orange-600 transition-colors cursor-pointer"
        >
          {product.title} 
        </h3>

        {/* Indicador de Stock Bajo (Opcional) */}
        {isLowStock && (
          <div className="text-xs text-orange-600 flex items-center gap-1 mb-2 font-medium">
            <AlertCircle size={12} />
            ¡Quedan pocos!
          </div>
        )}

        <div className="mt-auto pt-3 border-t border-gray-50">
          <div className="flex items-end justify-between gap-2">
            
            {/* Precios */}
            <div className="flex flex-col">
              <span className="text-2xl font-black text-gray-900 leading-none">
                ${parseFloat(priceUsd).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500 font-medium mt-1">
                Bs {priceBs}
              </span>
            </div>

            {/* Botón de Acción */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Evitar abrir el detalle al dar clic en comprar
                if (hasStock) onAddToCart(product);
              }}
              disabled={!hasStock}
              className={`
                p-3 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm
                ${hasStock 
                  ? 'bg-orange-600 text-white hover:bg-orange-700 hover:shadow-orange-200 hover:scale-105 active:scale-95' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'}
              `}
              title={hasStock ? "Agregar al carrito" : "Sin stock disponible"}
            >
              {hasStock ? <ShoppingCart size={20} /> : <AlertCircle size={20} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;