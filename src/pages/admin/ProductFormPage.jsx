import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { 
  Save, ArrowLeft, Image as ImageIcon, Plus, Trash2, Sparkles, 
  Loader2, DollarSign, X, UploadCloud, Globe, Star 
} from 'lucide-react';

const ProductFormPage = ({ productToEdit, onBack }) => {
  // --- ESTADOS DEL FORMULARIO ---
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingSEO, setLoadingSEO] = useState(false);

  // Datos del Producto
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    priceUsd: '',
    description: '',
    category: '',
    brand: '',
    sku: '',
    inStock: true,
    isFeatured: false,
    tags: [],
    specs: [{ id: 1, key: 'Procesador', value: '' }, { id: 2, key: 'Memoria RAM', value: '' }],
    seo: { title: '', description: '' },
    status: 'published'
  });

  // Imágenes
  const [mainImage, setMainImage] = useState({ file: null, preview: '' });
  const [gallery, setGallery] = useState([]); // Array de objetos { file, preview, url }

  // Estados UI Auxiliares
  const [tagInput, setTagInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  
  // Listas para autocompletar (Podrían venir de props o DB)
  const categoriesList = ['Computadoras', 'Laptops', 'Refurbished', 'Impresoras', 'UPS', 'Gamer', 'Accesorios'];
  const brandsList = ['HP', 'Dell', 'Lenovo', 'Asus', 'Canon', 'Epson', 'Logitech'];

  const geminiApiKey = "AIzaSyCXrzfjky4yrfBVT_JY8uXzVrgK1O2KlRM"; // Mantener tu API Key

  // --- INICIALIZACIÓN (MODO EDICIÓN) ---
  useEffect(() => {
    if (productToEdit) {
      setFormData({
        title: productToEdit.title || '',
        slug: productToEdit.slug || '',
        priceUsd: productToEdit.prices?.usd || '',
        description: productToEdit.description || '',
        category: productToEdit.category || '',
        brand: productToEdit.brand || '',
        sku: productToEdit.sku || '',
        inStock: productToEdit.inStock !== false,
        isFeatured: productToEdit.isFeatured || false,
        tags: productToEdit.tags || [],
        specs: productToEdit.specs?.map((s, i) => ({ id: i, key: s.key, value: s.value })) || [{ id: 1, key: 'Procesador', value: '' }],
        seo: productToEdit.seo || { title: '', description: '' },
        status: productToEdit.status || 'published'
      });

      // Cargar imágenes existentes
      if (productToEdit.images?.main) {
        setMainImage({ file: null, preview: productToEdit.images.main });
      }
      
      if (productToEdit.images?.gallery) {
        setGallery(productToEdit.images.gallery.map((url, i) => ({
          id: i, file: null, preview: url, url: url
        })));
      }
    }
  }, [productToEdit]);

  // --- HELPERS ---
  const sanitizeFilename = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'title' && !productToEdit) {
      setFormData(prev => ({ ...prev, slug: sanitizeFilename(value) }));
    }
  };

  // --- MANEJO DE IMÁGENES ---
  const handleMainImageSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setMainImage({ file, preview: URL.createObjectURL(file) });
    }
  };

  const handleGallerySelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setGallery([...gallery, { id: Date.now(), file, preview: URL.createObjectURL(file) }]);
    }
  };

  const removeGalleryImage = (index) => {
    setGallery(gallery.filter((_, i) => i !== index));
  };

  const uploadImageToFirebase = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };

  // --- MANEJO DE TAGS Y SPECS ---
  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!formData.tags.includes(tagInput.trim())) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      }
      setTagInput('');
    }
  };

  const removeTag = (tag) => {
    setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const updateSpec = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      specs: prev.specs.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  // --- IA GENERATORS ---
  const generateDescriptionAI = async () => {
    if (!formData.title) return alert("Escribe un título primero");
    setLoadingDesc(true);
    try {
      const prompt = `Copywriter e-commerce experto. Escribe una descripción de producto atractiva (máx 80 palabras) para: "${formData.title}". 
      Especificaciones: ${formData.specs.map(s => `${s.key}: ${s.value}`).join(', ')}. 
      Etiquetas: ${formData.tags.join(', ')}. 
      Tono: Vendedor, tecnológico, persuasivo para Venezuela.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) handleInputChange('description', text);
    } catch (e) { console.error(e); alert("Error AI"); } finally { setLoadingDesc(false); }
  };

  const generateSeoAI = async () => {
    if (!formData.title) return alert("Escribe un título primero");
    setLoadingSEO(true);
    try {
      const prompt = `Genera un objeto JSON estricto con keys "title" (max 60 chars) y "description" (max 150 chars) optimizado para Google SEO para el producto: "${formData.title}".`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const data = await response.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const json = JSON.parse(text);
      setFormData(prev => ({ ...prev, seo: json }));
    } catch (e) { console.error(e); alert("Error AI SEO"); } finally { setLoadingSEO(false); }
  };

  // --- GUARDADO FINAL ---
  const handleSave = async () => {
    if (!formData.title || !formData.priceUsd) return alert("⚠️ Completa Título y Precio USD");
    setIsSaving(true);

    try {
      const cleanFilename = formData.slug || sanitizeFilename(formData.title);
      // Usamos el ID existente si editamos, o el slug como ID si es nuevo
      const docId = productToEdit?.id || cleanFilename; 
      
      // 1. Subir Imagen Principal
      let mainImageUrl = mainImage.preview;
      if (mainImage.file) {
        const ext = mainImage.file.name.split('.').pop();
        mainImageUrl = await uploadImageToFirebase(mainImage.file, `products/${docId}/main.${ext}`);
      }

      // 2. Subir Galería
      const galleryUrls = [];
      for (let i = 0; i < gallery.length; i++) {
        const img = gallery[i];
        if (img.file) {
          const ext = img.file.name.split('.').pop();
          const url = await uploadImageToFirebase(img.file, `products/${docId}/gallery-${i}.${ext}`);
          galleryUrls.push(url);
        } else {
          galleryUrls.push(img.preview); // Ya era una URL
        }
      }

      // 3. Preparar Objeto
      const productData = {
        title: formData.title,
        slug: cleanFilename,
        description: formData.description,
        prices: { usd: parseFloat(formData.priceUsd) },
        category: formData.category,
        brand: formData.brand,
        sku: formData.sku,
        inStock: formData.inStock,
        isFeatured: formData.isFeatured,
        tags: formData.tags,
        specs: formData.specs.map(s => ({ key: s.key, value: s.value })),
        seo: formData.seo,
        images: { main: mainImageUrl, gallery: galleryUrls },
        updatedAt: new Date(),
        // Si es nuevo agregamos createdAt y status
        ...(!productToEdit && { createdAt: new Date(), status: 'published' })
      };

      await setDoc(doc(db, "products", docId), productData, { merge: true });
      alert("✅ Producto Guardado Correctamente");
      onBack(); // Volver a la lista

    } catch (e) {
      console.error(e);
      alert("Error al guardar: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-12 animate-in slide-in-from-right duration-300">
      {/* HEADER ACCIONES */}
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-20 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <span className="font-bold text-neutral-800 text-xl">
            {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
          </span>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg shadow-sm font-bold bg-[#FF6600] hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Guardando...' : 'Guardar Producto'}
        </button>
      </header>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA (Principal) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 1. INFO BÁSICA */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-5">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nombre del Producto</label>
              <input 
                type="text" 
                value={formData.title} 
                onChange={(e) => handleInputChange('title', e.target.value)} 
                className="w-full px-4 py-2 border rounded-lg outline-none focus:border-[#FF6600] font-medium" 
                placeholder="Ej: Laptop HP Pavilion 15..."
              />
            </div>
            <div>
               <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-neutral-700">Descripción Comercial</label>
                  <button onClick={generateDescriptionAI} disabled={loadingDesc} className="flex items-center gap-1.5 text-xs font-medium text-[#FF6600] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 hover:bg-orange-100 transition-colors">
                    {loadingDesc ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} 
                    Generar con IA
                  </button>
               </div>
               <textarea 
                  rows="5" 
                  value={formData.description} 
                  onChange={(e) => handleInputChange('description', e.target.value)} 
                  className="w-full p-4 border rounded-lg outline-none focus:border-[#FF6600] text-sm leading-relaxed" 
                  placeholder="Describe las características principales..."
               />
            </div>
          </div>

          {/* 2. IMÁGENES */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-semibold text-neutral-800 text-lg mb-4 flex items-center gap-2">
              <ImageIcon size={20} className="text-neutral-400"/> Imágenes
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {/* Main Image Upload */}
              <div className="col-span-2 row-span-2 border-2 border-dashed border-orange-200 bg-orange-50 rounded-xl relative overflow-hidden group cursor-pointer hover:bg-orange-100 transition-colors">
                <input type="file" onChange={handleMainImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" />
                {mainImage.preview ? (
                  <img src={mainImage.preview} className="w-full h-full object-contain" alt="Main" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#FF6600]">
                    <UploadCloud size={32} className="mb-2"/>
                    <span className="text-sm font-bold">Subir Portada</span>
                    <span className="text-xs opacity-70">JPG, PNG</span>
                  </div>
                )}
              </div>
              
              {/* Gallery List */}
              {gallery.map((img, i) => (
                <div key={img.id || i} className="aspect-square border rounded-xl bg-white relative overflow-hidden group">
                  <img src={img.preview} className="w-full h-full object-cover" />
                  <button 
                    onClick={() => removeGalleryImage(i)}
                    className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12}/>
                  </button>
                </div>
              ))}
              
              {/* Gallery Upload Btn */}
              <div className="aspect-square border rounded-xl bg-neutral-50 flex items-center justify-center relative cursor-pointer hover:bg-neutral-100 transition-colors text-neutral-400 hover:text-[#FF6600]">
                <input type="file" onChange={handleGallerySelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                <Plus size={24} />
              </div>
            </div>
          </div>

          {/* 3. FICHA TÉCNICA */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-800 text-lg">Ficha Técnica</h3>
              <button 
                onClick={() => setFormData(p => ({...p, specs: [...p.specs, { id: Date.now(), key: '', value: '' }] }))} 
                className="text-sm text-[#FF6600] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100"
              >
                <Plus size={16} /> Añadir fila
              </button>
            </div>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {formData.specs.map((spec) => (
                    <tr key={spec.id}>
                      <td className="p-2 w-1/3">
                        <input 
                          type="text" 
                          value={spec.key} 
                          onChange={(e) => updateSpec(spec.id, 'key', e.target.value)} 
                          className="w-full px-3 py-1.5 rounded bg-transparent focus:bg-neutral-50 outline-none font-bold text-neutral-600 placeholder:font-normal" 
                          placeholder="Ej: Procesador" 
                        />
                      </td>
                      <td className="p-2">
                        <input 
                          type="text" 
                          value={spec.value} 
                          onChange={(e) => updateSpec(spec.id, 'value', e.target.value)} 
                          className="w-full px-3 py-1.5 rounded bg-transparent focus:bg-neutral-50 outline-none text-neutral-800" 
                          placeholder="Ej: Intel Core i5..." 
                        />
                      </td>
                      <td className="p-2 text-center w-10">
                        <button 
                          onClick={() => setFormData(p => ({...p, specs: p.specs.filter(s => s.id !== spec.id)}))} 
                          className="text-neutral-400 hover:text-red-500"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        
        {/* COLUMNA DERECHA (Sidebar Form) */}
        <div className="space-y-6">
          
          {/* PRECIO */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-semibold text-neutral-800 text-lg mb-4 flex items-center gap-2">
              <DollarSign size={20} className="text-green-600"/> Precio
            </h3>
            <div className="mb-4 relative">
              <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Precio (USD)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                <input 
                  type="number" 
                  value={formData.priceUsd} 
                  onChange={(e) => handleInputChange('priceUsd', e.target.value)} 
                  className="w-full pl-7 pr-3 py-3 text-lg font-bold border border-neutral-300 rounded-lg focus:border-[#FF6600] outline-none" 
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* ORGANIZACIÓN */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-4">
             <h3 className="font-semibold text-neutral-800">Organización</h3>
             
             {/* Categoría */}
             <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="text-xs font-semibold text-neutral-500 uppercase">Categoría</label>
                   <button onClick={() => { setIsCustomCategory(!isCustomCategory); handleInputChange('category', ''); }} className="text-[10px] text-[#FF6600] hover:underline">
                      {isCustomCategory ? 'Seleccionar lista' : 'Escribir nueva'}
                   </button>
                </div>
                {isCustomCategory ? (
                   <input type="text" value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Nueva Categoría..." />
                ) : (
                   <select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white">
                      <option value="">Seleccionar...</option>
                      {categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                )}
             </div>

             {/* Marca */}
             <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="text-xs font-semibold text-neutral-500 uppercase">Marca</label>
                   <button onClick={() => { setIsCustomBrand(!isCustomBrand); handleInputChange('brand', ''); }} className="text-[10px] text-[#FF6600] hover:underline">
                      {isCustomBrand ? 'Seleccionar lista' : 'Escribir nueva'}
                   </button>
                </div>
                {isCustomBrand ? (
                   <input type="text" value={formData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Nueva Marca..." />
                ) : (
                   <select value={formData.brand} onChange={(e) => handleInputChange('brand', e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white">
                      <option value="">Seleccionar...</option>
                      {brandsList.map(b => <option key={b} value={b}>{b}</option>)}
                   </select>
                )}
             </div>

             {/* Switch Destacado */}
             <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer" onClick={() => handleInputChange('isFeatured', !formData.isFeatured)}>
                <span className="text-xs font-bold text-yellow-700 flex items-center gap-2"><Star size={14}/> Destacar en Home</span>
                <div className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${formData.isFeatured ? 'bg-yellow-500' : 'bg-neutral-300'}`}>
                   <div className={`w-3 h-3 bg-white rounded-full transition-transform shadow-sm ${formData.isFeatured ? 'translate-x-5' : 'translate-x-0'}`}></div>
                </div>
             </div>

             {/* Etiquetas */}
             <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase mb-1 block">Etiquetas (Tags)</label>
                <div className="p-2 border rounded-lg bg-white">
                   <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map(t => (
                         <span key={t} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs flex items-center gap-1 font-medium">
                            {t} <X size={12} className="cursor-pointer hover:text-orange-900" onClick={() => removeTag(t)}/>
                         </span>
                      ))}
                   </div>
                   <input 
                      type="text" 
                      value={tagInput} 
                      onChange={(e) => setTagInput(e.target.value)} 
                      onKeyDown={handleAddTag} 
                      className="w-full outline-none text-sm" 
                      placeholder="Escribe y presiona Enter..." 
                   />
                </div>
             </div>
          </div>

          {/* INVENTARIO */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
             <h3 className="font-semibold text-neutral-800 mb-4 text-sm uppercase tracking-wider">Inventario</h3>
             <div className="space-y-4">
                <div>
                   <label className="text-xs text-neutral-500 block mb-1 font-bold">SKU (Código)</label>
                   <input type="text" value={formData.sku} onChange={(e) => handleInputChange('sku', e.target.value)} className="w-full border border-neutral-300 rounded px-3 py-2 uppercase outline-none focus:border-[#FF6600] text-sm font-mono" placeholder="LAP-001" />
                </div>
                <div className="flex items-center justify-between pt-2">
                   <span className="text-sm font-medium text-neutral-700">Estado de Stock</span>
                   <button 
                      onClick={() => handleInputChange('inStock', !formData.inStock)} 
                      className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.inStock ? 'bg-green-500' : 'bg-neutral-300'}`}
                   >
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.inStock ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </button>
                </div>
                <div className="text-right text-xs font-bold uppercase text-neutral-500">
                   {formData.inStock ? 'Disponible' : 'Agotado'}
                </div>
             </div>
          </div>

          {/* SEO AI */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-neutral-800 text-sm flex items-center gap-2">
                   <Globe size={16} className="text-[#FF6600]"/> SEO
                </h3>
                <button onClick={generateSeoAI} disabled={loadingSEO} className="text-[10px] font-bold text-[#FF6600] bg-orange-50 px-2 py-1 rounded-md border border-orange-100 hover:bg-orange-100">
                   {loadingSEO ? '...' : 'Generar'}
                </button>
             </div>
             <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-2">
                <div className="truncate">
                   <div className="text-xs text-neutral-500 mb-0.5 font-bold">Título Meta</div>
                   <input 
                      value={formData.seo.title} 
                      onChange={(e) => setFormData(p => ({...p, seo: {...p.seo, title: e.target.value}}))}
                      className="w-full bg-transparent text-blue-700 font-medium outline-none text-sm border-b border-transparent focus:border-blue-200"
                      placeholder="Título en Google..."
                   />
                </div>
                <div>
                   <div className="text-xs text-neutral-500 mb-0.5 font-bold">Meta Descripción</div>
                   <textarea 
                      value={formData.seo.description} 
                      onChange={(e) => setFormData(p => ({...p, seo: {...p.seo, description: e.target.value}}))}
                      className="w-full bg-transparent text-neutral-600 text-xs outline-none resize-none border-b border-transparent focus:border-neutral-300"
                      rows="3"
                      placeholder="Descripción en resultados de búsqueda..."
                   />
                </div>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductFormPage;