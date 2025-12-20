import React, { useState, useEffect } from 'react';
import { Loader2, Search, X } from 'lucide-react';
import ProductCard from '../components/storefront/ProductCard';
import FilterSidebar from '../components/storefront/FilterSidebar';

// Agregamos 'onNavigate' a los props recibidos
const CatalogPage = ({ products, loading, exchangeRate, onAddToCart, initialCategory = '', onNavigate }) => {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  useEffect(() => {
    if (initialCategory) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  // Lógica de filtrado (Igual que antes)
  const baseFilteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const matchSearch = product.title?.toLowerCase().includes(term) || 
                        product.tags?.some(t => t.toLowerCase().includes(term));
    const matchCategory = selectedCategory ? product.category === selectedCategory : true;
    return matchSearch && matchCategory;
  });

  const availableBrands = [...new Set(baseFilteredProducts.map(p => p.brand).filter(Boolean))];
  const availableTags = [...new Set(baseFilteredProducts.flatMap(p => p.tags || []).filter(Boolean))];

  const finalFilteredProducts = baseFilteredProducts.filter(product => {
    const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(product.brand);
    const matchTag = selectedTags.length === 0 || (product.tags && product.tags.some(t => selectedTags.includes(t)));
    return matchBrand && matchTag;
  });

  const toggleBrand = (brand) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  const toggleTag = (tag) => setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  const resetFilters = () => { setSelectedCategory(''); setSelectedBrands([]); setSelectedTags([]); setSearchTerm(''); };
  const allCategories = [...new Set(products.map(p => p.category).filter(Boolean))];

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500 min-h-screen">
      
      <button 
        className="lg:hidden w-full py-3 bg-white border border-gray-200 rounded-lg font-bold text-slate-700 shadow-sm mb-4"
        onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
      >
        {isMobileFiltersOpen ? 'Ocultar Filtros' : 'Mostrar Filtros'}
      </button>

      <div className={`lg:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
        <div className="sticky top-24">
          <FilterSidebar 
            categories={allCategories}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => { setSelectedCategory(cat); setSelectedBrands([]); setSelectedTags([]); }}
            availableBrands={availableBrands}
            selectedBrands={selectedBrands}
            onToggleBrand={toggleBrand}
            availableTags={availableTags}
            selectedTags={selectedTags}
            onToggleTag={toggleTag}
          />
        </div>
      </div>

      <div className="flex-1">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{selectedCategory || 'Catálogo Completo'}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
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
              {(selectedBrands.length > 0 || selectedTags.length > 0 || selectedCategory) && (
                <button onClick={resetFilters} className="text-xs text-gray-400 hover:text-gray-600 underline ml-2">Limpiar todo</button>
              )}
            </div>
          </div>
          <span className="text-sm text-slate-500">{finalFilteredProducts.length} resultados</span>
        </div>

        {loading ? (
          <div className="text-center py-20"><Loader2 className="animate-spin mx-auto text-[#FF6600]"/></div>
        ) : finalFilteredProducts.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed rounded-xl border-gray-200">
            <Search className="mx-auto text-gray-300 mb-2" size={48}/><p className="text-gray-500 font-medium">No encontramos productos con esos filtros.</p>
            <button onClick={resetFilters} className="text-[#FF6600] font-bold mt-2 hover:underline">Ver todo el catálogo</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 auto-rows-fr">
            {finalFilteredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                exchangeRate={exchangeRate}
                onAddToCart={onAddToCart} 
                onClick={() => onNavigate('product-detail', product)} // <--- ¡AQUÍ ESTÁ LA MAGIA!
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CatalogPage;