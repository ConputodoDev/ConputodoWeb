import React, { useState } from 'react';
import { Filter, ChevronUp, ChevronDown, Check } from 'lucide-react';

// --- Subcomponente Helper para los Acordeones ---
const FilterAccordion = ({ title, isOpen, onToggle, children }) => {
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
};

/**
 * Sidebar de Filtros
 * @param {Array} categories - Lista de categorías únicas (Strings)
 * @param {string} selectedCategory - Categoría actualmente seleccionada
 * @param {Function} onSelectCategory - Función al clickear una categoría
 * @param {Array} availableBrands - Lista de marcas disponibles según la búsqueda actual
 * @param {Array} selectedBrands - Array de marcas seleccionadas
 * @param {Function} onToggleBrand - Función para marcar/desmarcar marca
 * @param {Array} availableTags - Lista de etiquetas disponibles
 * @param {Array} selectedTags - Array de etiquetas seleccionadas
 * @param {Function} onToggleTag - Función para marcar/desmarcar etiqueta
 */
const FilterSidebar = ({
  categories = [],
  selectedCategory,
  onSelectCategory,
  availableBrands = [],
  selectedBrands = [],
  onToggleBrand,
  availableTags = [],
  selectedTags = [],
  onToggleTag,
  className = ""
}) => {
  // Estado local para controlar qué acordeones están abiertos
  const [openSections, setOpenSections] = useState({ brands: true, tags: false });

  const toggleSection = (section) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className={`space-y-4 ${className}`}>
      
      {/* 1. CATEGORÍAS (Siempre visibles) */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
        <h3 className="font-bold mb-4 text-slate-900 flex items-center gap-2">
          <Filter size={16}/> Categorías
        </h3>
        <div className="space-y-1">
          <button 
            onClick={() => onSelectCategory('')} 
            className={`block w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${selectedCategory === '' ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-50'}`}
          >
            Todas
          </button>
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => onSelectCategory(c)} 
              className={`block w-full text-left px-3 py-2 rounded-lg text-sm capitalize transition-colors ${selectedCategory === c ? 'bg-[#FF6600] text-white font-bold' : 'text-slate-600 hover:bg-gray-50'}`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 2. MARCAS (Acordeón) */}
      {availableBrands.length > 0 && (
        <FilterAccordion 
          title="Marcas" 
          isOpen={openSections.brands} 
          onToggle={() => toggleSection('brands')}
        >
          {availableBrands.map(brand => (
            <div 
              key={brand} 
              className="flex items-center gap-3 py-1 cursor-pointer group" 
              onClick={() => onToggleBrand(brand)}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedBrands.includes(brand) ? 'bg-[#FF6600] border-[#FF6600]' : 'bg-white border-gray-300 group-hover:border-orange-300'}`}>
                {selectedBrands.includes(brand) && <Check size={12} className="text-white"/>}
              </div>
              <span className={`text-sm ${selectedBrands.includes(brand) ? 'text-[#FF6600] font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {brand}
              </span>
            </div>
          ))}
        </FilterAccordion>
      )}

      {/* 3. ETIQUETAS (Acordeón) */}
      {availableTags.length > 0 && (
        <FilterAccordion 
          title="Etiquetas" 
          isOpen={openSections.tags} 
          onToggle={() => toggleSection('tags')}
        >
          {availableTags.map(tag => (
            <div 
              key={tag} 
              className="flex items-center gap-3 py-1 cursor-pointer group" 
              onClick={() => onToggleTag(tag)}
            >
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${selectedTags.includes(tag) ? 'bg-[#FF6600] border-[#FF6600]' : 'bg-white border-gray-300 group-hover:border-orange-300'}`}>
                {selectedTags.includes(tag) && <Check size={12} className="text-white"/>}
              </div>
              <span className={`text-sm capitalize ${selectedTags.includes(tag) ? 'text-[#FF6600] font-bold' : 'text-slate-600 group-hover:text-slate-900'}`}>
                {tag}
              </span>
            </div>
          ))}
        </FilterAccordion>
      )}
    </aside>
  );
};

export default FilterSidebar;