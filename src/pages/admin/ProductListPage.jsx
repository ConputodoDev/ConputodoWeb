import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { 
  Search, Plus, Loader2, Package, Filter, Check, X, Edit, Trash2, 
  XCircle, ChevronDown, RotateCcw, ImageIcon, ChevronLeft, ChevronRight, Layers, DollarSign 
} from 'lucide-react';
import RateWidget from '../../components/dashboard/RateWidget';
import { useAdminAuth } from '../../context/AdminAuthContext'; 

const ProductListPage = ({ onChangeView, isTrashView = false }) => {
  const { user } = useAdminAuth(); 
  const isAdmin = user?.role === 'admin'; 

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Tasas
  const [rates, setRates] = useState({ exchangeRate: 0, exchangeRateBCV: 0 });

  // Filtros
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ category: '', brand: '' });
  const [uniqueCategories, setUniqueCategories] = useState([]);
  const [uniqueBrands, setUniqueBrands] = useState([]);

  // Edición Rápida
  const [quickEditPriceId, setQuickEditPriceId] = useState(null);
  const [quickEditPriceValue, setQuickEditPriceValue] = useState('');

  // --- CARGA DE DATOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const settings = await getDoc(doc(db, "settings", "global"));
      if(settings.exists()) setRates(settings.data());
      else {
         const def = { exchangeRate: 64.50, exchangeRateBCV: 55.00 };
         if (isAdmin) await setDoc(doc(db, "settings", "global"), def);
         setRates(def);
      }

      const qs = await getDocs(collection(db, "products"));
      const allProducts = qs.docs.map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      
      setProducts(allProducts);

      setUniqueCategories([...new Set(allProducts.map(p => p.category).filter(Boolean))]);
      setUniqueBrands([...new Set(allProducts.map(p => p.brand).filter(Boolean))]);

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // --- LÓGICA DE NEGOCIO ---
  const calculateBs = (usd) => (parseFloat(usd) || 0) * rates.exchangeRate;
  const calculatePVP = (usd) => (!rates.exchangeRate || !rates.exchangeRateBCV) ? 0 : ((parseFloat(usd)||0) * rates.exchangeRate) / rates.exchangeRateBCV;

  const filteredProducts = products.filter(product => {
    const isDeleted = product.status === 'trash';
    if (isTrashView && !isDeleted) return false;
    if (!isTrashView && isDeleted) return false;

    const term = searchTerm.toLowerCase();
    const matchSearch = product.title?.toLowerCase().includes(term) || product.sku?.toLowerCase().includes(term);
    const matchCategory = activeFilters.category ? product.category === activeFilters.category : true;
    const matchBrand = activeFilters.brand ? product.brand === activeFilters.brand : true;

    return matchSearch && matchCategory && matchBrand;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

  // --- ACCIONES (SOLO ADMIN) ---
  const handleQuickStatusChange = async (productId, newStatus) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, "products", productId), { status: newStatus, updatedAt: new Date() });
      setProducts(products.map(p => p.id === productId ? { ...p, status: newStatus } : p));
    } catch (error) { console.error(error); }
  };

  const saveQuickEditPrice = async (productId) => {
    if (!isAdmin) return;
    try {
      const newUsd = parseFloat(quickEditPriceValue) || 0;
      await updateDoc(doc(db, "products", productId), { "prices.usd": newUsd, updatedAt: new Date() });
      setProducts(products.map(p => p.id === productId ? { ...p, prices: { ...p.prices, usd: newUsd } } : p));
      setQuickEditPriceId(null);
    } catch (error) { console.error(error); }
  };

  const handleDelete = async (product) => {
    if (!isAdmin) return;
    if (product.status === 'trash') {
       if (window.confirm("⛔ ¿Eliminar definitivamente?")) {
          await deleteDoc(doc(db, "products", product.id));
          fetchData();
       }
    } else {
       if (window.confirm("¿Mover a la papelera?")) {
          await updateDoc(doc(db, "products", product.id), { status: 'trash' });
          fetchData();
       }
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
           <h1 className="text-2xl font-bold text-neutral-800">{isTrashView ? 'Papelera' : 'Inventario'}</h1>
           <p className="text-neutral-500 text-sm">{filteredProducts.length} productos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
           {isAdmin && (
             <div className="flex gap-2 w-full sm:w-auto overflow-x-auto pb-2 sm:pb-0">
               <RateWidget 
                  label="Tasa" 
                  rate={rates.exchangeRate} 
                  rateKey="exchangeRate"
                  onRateUpdate={(val) => setRates(prev => ({...prev, exchangeRate: val}))}
                  colorClass="bg-green-500"
               />
               <RateWidget 
                  label="BCV" 
                  rate={rates.exchangeRateBCV} 
                  rateKey="exchangeRateBCV"
                  onRateUpdate={(val) => setRates(prev => ({...prev, exchangeRateBCV: val}))}
                  colorClass="bg-blue-500"
               />
             </div>
           )}
           
           {!isTrashView && isAdmin && (
             <button onClick={() => onChangeView('product-create')} className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#FF6600] hover:bg-orange-700 text-white rounded-lg shadow-sm font-medium transition-colors">
               <Plus size={20} /> Nuevo
             </button>
           )}
        </div>
      </div>

      {/* Barra de Herramientas (Search + Filtros) */}
      <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
         <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF6600]" />
         </div>
         <div className="relative flex justify-end">
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium ${showFilters ? 'border-[#FF6600] bg-orange-50 text-[#FF6600]' : 'border-neutral-300'}`}>
              <Filter size={16} /> Filtros
            </button>
            {showFilters && (
              <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 p-4 z-20 animate-in zoom-in-95 duration-200">
                <div className="space-y-3">
                   <select value={activeFilters.category} onChange={(e) => setActiveFilters({...activeFilters, category: e.target.value})} className="w-full p-2 border rounded-lg text-sm"><option value="">Categoría: Todas</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                   <select value={activeFilters.brand} onChange={(e) => setActiveFilters({...activeFilters, brand: e.target.value})} className="w-full p-2 border rounded-lg text-sm"><option value="">Marca: Todas</option>{uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}</select>
                </div>
              </div>
            )}
         </div>
      </div>

      {/* Contenido Principal */}
      <div className="bg-transparent md:bg-white rounded-xl md:border border-neutral-200 md:shadow-sm overflow-hidden">
        {loading ? (
            <div className="p-12 text-center text-neutral-500"><Loader2 size={32} className="animate-spin mx-auto mb-2 text-[#FF6600]" />Cargando...</div>
        ) : filteredProducts.length === 0 ? (
            <div className="p-12 text-center text-neutral-500"><Package size={48} className="mx-auto mb-2 text-neutral-300" />Sin resultados</div>
        ) : (
          <>
            {/* VISTA MÓVIL (Cards) - Visible solo en pantallas pequeñas (< md) */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {currentItems.map((product) => {
                    const isVariable = product.variants && product.variants.length > 0;
                    const priceBs = calculateBs(product.prices?.usd);
                    const pvp = calculatePVP(product.prices?.usd);
                    
                    return (
                        <div key={product.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex gap-4">
                            {/* Imagen */}
                            <div className="w-24 h-24 bg-neutral-50 rounded-lg border border-neutral-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                                {product.images?.main ? <img src={product.images.main} alt="" className="w-full h-full object-cover" /> : <ImageIcon size={24} className="text-neutral-300"/>}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h3 className="font-bold text-neutral-800 text-sm line-clamp-2 leading-tight">{product.title}</h3>
                                    {isAdmin && (
                                        <button onClick={() => onChangeView('product-edit', product)} className="text-neutral-400 hover:text-[#FF6600] p-1"><Edit size={16}/></button>
                                    )}
                                </div>
                                
                                <div className="text-xs text-neutral-500 mb-2 flex items-center gap-2">
                                    <span className="capitalize">{product.category || 'General'}</span>
                                    {isVariable && <span className="bg-purple-50 text-purple-700 px-1.5 rounded border border-purple-100 font-bold text-[10px] flex items-center gap-0.5"><Layers size={10}/> {product.variants.length}</span>}
                                </div>

                                <div className="flex justify-between items-end">
                                    <div>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-lg font-black text-neutral-900">${product.prices?.usd?.toFixed(2)}</span>
                                            {isVariable && <span className="text-[10px] text-neutral-400">Desde</span>}
                                        </div>
                                        <div className="text-xs text-neutral-500 font-medium">Ref: {priceBs.toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</div>
                                        <div className="text-[10px] text-[#FF6600] font-bold mt-0.5">PVP: ${pvp.toFixed(2)}</div>
                                    </div>
                                    
                                    <div className="flex flex-col items-end gap-1">
                                        {(product.inStock === false || product.stock === 0) ? (
                                            <span className="px-2 py-1 bg-red-50 text-red-600 text-[10px] font-bold rounded border border-red-100">Agotado</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-green-50 text-green-600 text-[10px] font-bold rounded border border-green-100">Stock: {product.stock}</span>
                                        )}
                                        <span className={`text-[10px] font-bold ${product.status === 'published' ? 'text-blue-600' : 'text-neutral-400'}`}>
                                            {product.status === 'published' ? 'Publicado' : 'Oculto'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* VISTA DE ESCRITORIO (Tabla) - Visible solo en pantallas medianas y grandes (>= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-orange-50 border-b border-orange-100 text-xs uppercase text-[#FF6600] font-semibold">
                  <tr>
                    <th className="p-4 w-20">Img</th>
                    <th className="p-4">Producto</th>
                    <th className="p-4">Categoría</th>
                    <th className="p-4 text-right">Precio ($)</th>
                    <th className="p-4 text-right">Precios (Calc)</th>
                    <th className="p-4 text-center">Disp.</th>
                    <th className="p-4 text-center">Estado</th>
                    {isAdmin && <th className="p-4 text-right">Acciones</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100 text-sm">
                  {currentItems.map((product) => {
                    const isVariable = product.variants && product.variants.length > 0;
                    return (
                      <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors group">
                        <td className="p-4">
                          <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 overflow-hidden shadow-sm">
                            {product.images?.main ? <img src={product.images.main} alt="Miniatura" className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="font-medium text-neutral-800 line-clamp-1" title={product.title}>{product.title}</div>
                          
                          {/* Tags + Badge Variable */}
                          <div className="flex flex-wrap items-center gap-1 mt-1">
                             {isVariable && (
                                <span className="flex items-center gap-1 text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-100 font-bold uppercase tracking-wider">
                                  <Layers size={10} /> {product.variants.length} Var
                                </span>
                             )}
                             {product.tags?.slice(0, 2).map((tag, i) => (
                                <span key={i} className="text-[10px] bg-orange-50 text-[#FF6600] px-1.5 py-0.5 rounded border border-orange-100">
                                  {tag}
                                </span>
                             ))}
                          </div>
                        </td>
                        <td className="p-4 text-neutral-600 capitalize">{product.category || '-'}</td>
                        
                        {/* Precio (Edición solo si es Admin) */}
                        <td className="p-4 text-right font-bold text-neutral-700 relative group/price">
                          {isAdmin && quickEditPriceId === product.id ? (
                              <div className="flex items-center justify-end gap-1">
                                  <input type="number" value={quickEditPriceValue} onChange={(e) => setQuickEditPriceValue(e.target.value)} className="w-20 p-1 border border-[#FF6600] rounded text-right outline-none text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveQuickEditPrice(product.id)} />
                                  <button onClick={() => saveQuickEditPrice(product.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
                                  <button onClick={() => setQuickEditPriceId(null)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                              </div>
                          ) : (
                              <div className="flex items-center justify-end gap-2">
                                  <span className={`text-lg ${isAdmin ? 'cursor-pointer' : ''}`} onClick={() => { if(isAdmin) { setQuickEditPriceId(product.id); setQuickEditPriceValue(product.prices?.usd || 0); } }}>
                                    {isVariable && <span className="text-[10px] text-gray-400 mr-1 font-normal">DESDE</span>}
                                    ${product.prices?.usd?.toFixed(2)}
                                  </span>
                                  {isAdmin && !isVariable && (
                                    <Edit size={12} className="text-neutral-300 opacity-0 group-hover/price:opacity-100 cursor-pointer hover:text-[#FF6600]" onClick={() => { setQuickEditPriceId(product.id); setQuickEditPriceValue(product.prices?.usd || 0); }}/>
                                  )}
                              </div>
                          )}
                        </td>
                        
                        <td className="p-4 text-right">
                          <div className="text-xs font-bold text-[#FF6600] mb-0.5">PVP: ${calculatePVP(product.prices?.usd).toFixed(2)}</div>
                          <div className="text-[10px] text-neutral-500 font-medium">Ref: {calculateBs(product.prices?.usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</div>
                        </td>

                        <td className="p-4 text-center">
                          {(product.inStock === false || product.stock === 0) ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-medium"><XCircle size={10}/> Agotado</span>
                          ) : (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-green-200 bg-green-50 text-green-700 text-xs font-medium"><Check size={10}/> Disponible</span>
                                <span className="text-[10px] text-neutral-400 mt-0.5">Stock: {product.stock}</span>
                              </div>
                          )}
                        </td>

                        <td className="p-4 text-center">
                          {product.status === 'trash' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-xs"><Trash2 size={10}/> Eliminado</span>
                          ) : (
                              // Si es admin, dropdown. Si es ventas, solo texto.
                              isAdmin ? (
                                  <div className="relative inline-block">
                                      <select 
                                          value={product.status || 'published'} 
                                          onChange={(e) => handleQuickStatusChange(product.id, e.target.value)} 
                                          className={`appearance-none pl-6 pr-8 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${product.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : ''} ${product.status === 'draft' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''} ${product.status === 'hidden' ? 'bg-neutral-50 text-neutral-600 border-neutral-200' : ''}`}
                                      >
                                          <option value="published">Publicado</option><option value="draft">Borrador</option><option value="hidden">Oculto</option>
                                      </select>
                                      <div className={`absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full ${product.status === 'published' ? 'bg-green-500' : product.status === 'draft' ? 'bg-yellow-500' : 'bg-neutral-400'}`}></div>
                                      <ChevronDown size={12} className="absolute right-2 top-1.5 opacity-50 pointer-events-none"/>
                                  </div>
                              ) : (
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold border ${product.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-neutral-50 text-neutral-500 border-neutral-200'}`}>
                                      {product.status === 'published' ? 'Publicado' : 'Oculto'}
                                  </span>
                              )
                          )}
                        </td>

                        {isAdmin && (
                            <td className="p-4 text-right">
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {isTrashView ? (
                                      <>
                                          <button onClick={() => { updateDoc(doc(db, "products", product.id), { status: 'published' }); fetchData(); }} className="p-2 text-neutral-400 hover:text-green-600 rounded-lg" title="Restaurar"><RotateCcw size={16}/></button>
                                          <button onClick={() => handleDelete(product)} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg" title="Eliminar"><XCircle size={16}/></button>
                                      </>
                                  ) : (
                                      <>
                                          <button onClick={() => onChangeView('product-edit', product)} className="p-2 text-neutral-400 hover:text-[#FF6600] rounded-lg" title="Editar"><Edit size={16}/></button>
                                          <button onClick={() => handleDelete(product)} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg" title="Mover a Papelera"><Trash2 size={16}/></button>
                                      </>
                                  )}
                              </div>
                            </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            {/* Paginación */}
            <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-100 bg-white md:bg-transparent rounded-b-xl">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-neutral-100 disabled:opacity-50"><ChevronLeft size={20}/></button>
                <span className="text-sm text-neutral-600">Página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong></span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border rounded-lg hover:bg-neutral-100 disabled:opacity-50"><ChevronRight size={20}/></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ProductListPage;