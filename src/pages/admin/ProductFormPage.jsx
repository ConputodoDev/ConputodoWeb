import React, { useState, useEffect, useRef } from 'react';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { 
  Save, ArrowLeft, Image as ImageIcon, Plus, Trash2, Sparkles, 
  Loader2, DollarSign, X, UploadCloud, Globe, Star, Layers, Box,
  Bold, Italic, List, RefreshCw
} from 'lucide-react';

const ProductFormPage = ({ productToEdit, onBack }) => {
  // --- ESTADOS DEL FORMULARIO ---
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingSEO, setLoadingSEO] = useState(false);

  // MODO: Simple vs Variable
  const [isVariable, setIsVariable] = useState(false);

  // Datos del Producto
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    priceUsd: '', // Precio Base / Raíz
    description: '',
    category: '',
    brand: '',
    sku: '', // SKU Raíz
    inStock: true,
    isFeatured: false,
    tags: [],
    specs: [{ id: 1, key: 'Procesador', value: '' }, { id: 2, key: 'Memoria RAM', value: '' }],
    seo: { title: '', description: '' },
    status: 'published'
  });

  // Variantes
  const [variants, setVariants] = useState([]);
  const [newVariant, setNewVariant] = useState({ name: '', price: '', stock: 1, sku: '' });

  // Imágenes
  const [mainImage, setMainImage] = useState({ file: null, preview: '' });
  const [gallery, setGallery] = useState([]);

  // UI Auxiliares
  const [tagInput, setTagInput] = useState('');
  const [availableTags, setAvailableTags] = useState([]); // Etiquetas existentes en DB
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [isCustomBrand, setIsCustomBrand] = useState(false);
  const descriptionRef = useRef(null); // Ref para insertar texto en descripción
  
  // Listas Dinámicas (Inician con defaults pero se llenan con la DB)
  const defaultCategories = ['Computadoras', 'Laptops', 'Refurbished', 'Impresoras', 'UPS', 'Gamer', 'Accesorios'];
  const defaultBrands = ['HP', 'Dell', 'Lenovo', 'Asus', 'Canon', 'Epson', 'Logitech'];
  
  const [categoriesList, setCategoriesList] = useState(defaultCategories);
  const [brandsList, setBrandsList] = useState(defaultBrands);

  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;

  // --- CARGA INICIAL ---
  useEffect(() => {
    // 1. Cargar datos si es edición
    if (productToEdit) {
      const hasVariants = productToEdit.variants && productToEdit.variants.length > 0;
      setIsVariable(hasVariants);

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

      if (hasVariants) setVariants(productToEdit.variants);
      if (productToEdit.images?.main) setMainImage({ file: null, preview: productToEdit.images.main });
      if (productToEdit.images?.gallery) {
        setGallery(productToEdit.images.gallery.map((url, i) => ({ id: i, file: null, preview: url, url: url })));
      }
    }

    // 2. Cargar DATOS DINÁMICOS (Tags, Categorías y Marcas usadas en la DB)
    const fetchData = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "products"));
            
            // Sets para evitar duplicados
            const tagsSet = new Set();
            const catsSet = new Set(defaultCategories); // Iniciamos con los defaults
            const brandsSet = new Set(defaultBrands);   // Iniciamos con los defaults

            querySnapshot.forEach((doc) => {
                const d = doc.data();
                // Tags
                if (Array.isArray(d.tags)) d.tags.forEach(t => tagsSet.add(t));
                // Categorías
                if (d.category) catsSet.add(d.category);
                // Marcas
                if (d.brand) brandsSet.add(d.brand);
            });

            // Actualizamos estados convertidos a Arrays y ordenados
            setAvailableTags(Array.from(tagsSet).sort());
            setCategoriesList(Array.from(catsSet).sort());
            setBrandsList(Array.from(brandsSet).sort());

        } catch (e) {
            console.error("Error cargando datos dinámicos:", e);
        }
    };
    fetchData();

  }, [productToEdit]);

  // --- HELPERS ---
  const sanitizeFilename = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
  
  const handleInputChange = (field, value) => {
    setFormData(prev => {
        const newData = { ...prev, [field]: value };
        // Auto-generar slug si cambiamos el título y no estamos en modo edición estricta (o si el slug estaba vacío)
        if (field === 'title' && (!productToEdit || !prev.slug)) {
            newData.slug = sanitizeFilename(value);
        }
        return newData;
    });
  };

  // --- FORMATO DE TEXTO (Rich Text Simple) ---
  const insertFormat = (tagStart, tagEnd = '') => {
    if (!descriptionRef.current) return;
    const textarea = descriptionRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    const newText = before + tagStart + selection + tagEnd + after;
    
    handleInputChange('description', newText);
    
    // Recuperar foco
    setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + tagStart.length, end + tagStart.length);
    }, 10);
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

  // --- VARIANTES ---
  const addVariant = () => {
    if (!newVariant.name || !newVariant.price) return alert("Nombre y Precio son obligatorios");
    setVariants(prev => [...prev, { id: crypto.randomUUID(), name: newVariant.name, price: parseFloat(newVariant.price), stock: parseInt(newVariant.stock)||0, sku: newVariant.sku }]);
    setNewVariant({ name: '', price: '', stock: 1, sku: '' });
  };
  const removeVariant = (id) => setVariants(prev => prev.filter(v => v.id !== id));
  const updateVariant = (id, field, value) => setVariants(prev => prev.map(v => v.id === id ? { ...v, [field]: value } : v));

  // --- TAGS & SPECS ---
  const handleAddTag = (tag) => {
      const val = tag || tagInput.trim();
      if (val && !formData.tags.includes(val)) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, val] }));
      }
      setTagInput('');
  };

  const removeTag = (tag) => setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));

  const updateSpec = (id, field, value) => {
    setFormData(prev => ({ ...prev, specs: prev.specs.map(s => s.id === id ? { ...s, [field]: value } : s) }));
  };

  // --- IA GENERATORS (MODELO ACTUALIZADO) ---
  const generateDescriptionAI = async () => {
    if (!formData.title) return alert("Escribe un título primero");
    setLoadingDesc(true);
    try {
      const prompt = `Copywriter e-commerce experto. Escribe una descripción de producto atractiva (usando etiquetas HTML simples como <b>, <i>, <br> para formato) para: "${formData.title}". 
      Especificaciones: ${formData.specs.map(s => `${s.key}: ${s.value}`).join(', ')}. 
      Etiquetas: ${formData.tags.join(', ')}. 
      Tono: Vendedor, tecnológico, persuasivo para Venezuela. Máximo 100 palabras.`;
      
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      
      if (!response.ok) throw new Error("Error en API de Gemini");

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text) handleInputChange('description', text);
    } catch (e) { 
        console.error(e); 
        alert("Error generando descripción: " + e.message); 
    } finally { 
        setLoadingDesc(false); 
    }
  };

  const generateSeoAI = async () => {
    if (!formData.title) return alert("Escribe un título primero");
    setLoadingSEO(true);
    try {
      const prompt = `Genera un JSON estricto con keys "title" (max 60 chars) y "description" (max 150 chars) optimizado para SEO para: "${formData.title}".`;
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`, {
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

  // --- GUARDADO ---
  const handleSave = async () => {
    if (!formData.title) return alert("⚠️ Completa el Título");
    if (isVariable && variants.length === 0) return alert("⚠️ Agrega al menos una variante.");
    if (!isVariable && !formData.priceUsd) return alert("⚠️ Completa el Precio USD.");

    setIsSaving(true);
    try {
      const cleanFilename = formData.slug || sanitizeFilename(formData.title);
      const docId = productToEdit?.id || cleanFilename; 
      
      let mainImageUrl = mainImage.preview;
      if (mainImage.file) {
        const ext = mainImage.file.name.split('.').pop();
        mainImageUrl = await uploadImageToFirebase(mainImage.file, `products/${docId}/main.${ext}`);
      }

      const galleryUrls = [];
      for (let i = 0; i < gallery.length; i++) {
        const img = gallery[i];
        if (img.file) {
          const ext = img.file.name.split('.').pop();
          const url = await uploadImageToFirebase(img.file, `products/${docId}/gallery-${i}.${ext}`);
          galleryUrls.push(url);
        } else {
          galleryUrls.push(img.preview); 
        }
      }

      let finalPrice = 0, finalStock = 0, finalVariants = [];
      if (isVariable) {
         finalVariants = variants.map(v => ({ ...v, price: parseFloat(v.price), stock: parseInt(v.stock) }));
         finalStock = finalVariants.reduce((acc, curr) => acc + curr.stock, 0);
         finalPrice = Math.min(...finalVariants.map(v => v.price));
      } else {
         finalPrice = parseFloat(formData.priceUsd);
         finalStock = formData.inStock ? 999 : 0; 
      }

      const productData = {
        title: formData.title,
        slug: cleanFilename,
        description: formData.description,
        prices: { usd: finalPrice },
        stock: finalStock,
        category: formData.category,
        brand: formData.brand,
        sku: formData.sku,
        inStock: formData.inStock,
        isFeatured: formData.isFeatured,
        tags: formData.tags,
        specs: formData.specs.map(s => ({ key: s.key, value: s.value })),
        seo: formData.seo,
        images: { main: mainImageUrl, gallery: galleryUrls },
        variants: finalVariants,
        updatedAt: new Date(),
        status: formData.status, // Asegurar status
        ...(!productToEdit && { createdAt: new Date() })
      };

      await setDoc(doc(db, "products", docId), productData, { merge: true });
      alert("✅ Guardado Correctamente");
      onBack(); 
    } catch (e) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="pb-12 animate-in slide-in-from-right duration-300">
      {/* HEADER */}
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-gray-50 z-20 py-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col">
            <span className="font-bold text-neutral-800 text-xl">
                {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </span>
            <span className="text-xs text-neutral-500 font-medium">
                {isVariable ? 'Modo: Variantes' : 'Modo: Simple'}
            </span>
          </div>
        </div>
        <button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg shadow-sm font-bold bg-[#FF6600] hover:bg-orange-700 transition-colors disabled:opacity-50"
        >
          {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </header>
      
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUMNA IZQUIERDA */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-5">
            {/* Switch */}
            <div className="flex p-1 bg-neutral-100 rounded-lg mb-4 w-fit">
                <button onClick={() => setIsVariable(false)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${!isVariable ? 'bg-white text-[#FF6600] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    <Box size={16} className="inline mr-2 mb-0.5"/> Simple
                </button>
                <button onClick={() => setIsVariable(true)} className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${isVariable ? 'bg-white text-[#FF6600] shadow-sm' : 'text-neutral-500 hover:text-neutral-700'}`}>
                    <Layers size={16} className="inline mr-2 mb-0.5"/> Variable
                </button>
            </div>

            {/* Titulo & Slug */}
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
            
            {/* Slug Input Nuevo */}
            <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-200 flex items-center gap-2">
                <Globe size={16} className="text-neutral-400"/>
                <span className="text-xs text-neutral-500 font-bold">conputodo.com/producto/</span>
                <input 
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    className="flex-1 bg-transparent border-none outline-none text-sm text-neutral-700 font-mono"
                    placeholder="url-amigable-automatica"
                />
                <button 
                    onClick={() => handleInputChange('slug', sanitizeFilename(formData.title))} 
                    className="p-1 text-neutral-400 hover:text-[#FF6600]" title="Regenerar desde título"
                >
                    <RefreshCw size={14}/>
                </button>
            </div>

            {/* Descripción Rica */}
            <div>
               <div className="flex justify-between items-end mb-2">
                  <label className="block text-sm font-medium text-neutral-700">Descripción</label>
                  <button onClick={generateDescriptionAI} disabled={loadingDesc} className="flex items-center gap-1.5 text-xs font-medium text-[#FF6600] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200 hover:bg-orange-100">
                    {loadingDesc ? <Loader2 className="animate-spin" size={14}/> : <Sparkles size={14}/>} IA
                  </button>
               </div>
               
               {/* Toolbar */}
               <div className="flex items-center gap-1 p-1 bg-neutral-100 border border-neutral-300 border-b-0 rounded-t-lg">
                  <button type="button" onClick={() => insertFormat('<b>', '</b>')} className="p-1.5 hover:bg-white rounded text-neutral-600" title="Negrita"><Bold size={16}/></button>
                  <button type="button" onClick={() => insertFormat('<i>', '</i>')} className="p-1.5 hover:bg-white rounded text-neutral-600" title="Cursiva"><Italic size={16}/></button>
                  <button type="button" onClick={() => insertFormat('<ul>\n<li>', '</li>\n</ul>')} className="p-1.5 hover:bg-white rounded text-neutral-600" title="Lista"><List size={16}/></button>
               </div>

               <textarea 
                  ref={descriptionRef}
                  rows="6" 
                  value={formData.description} 
                  onChange={(e) => handleInputChange('description', e.target.value)} 
                  className="w-full p-4 border rounded-b-lg border-t-0 outline-none focus:border-[#FF6600] text-sm leading-relaxed font-mono" 
                  placeholder="Descripción con formato HTML básico..."
               />
               <p className="text-[10px] text-neutral-400 mt-1">* Acepta HTML básico: &lt;b&gt;, &lt;i&gt;, &lt;ul&gt;, &lt;li&gt;</p>
            </div>
          </div>

          {/* GESTOR DE VARIANTES */}
          {isVariable && (
            <div className="bg-white rounded-xl border border-orange-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-neutral-800 text-lg flex items-center gap-2">
                        <Layers size={20} className="text-[#FF6600]"/> Variantes
                    </h3>
                </div>
                {/* Tabla Variantes */}
                <div className="border border-neutral-200 rounded-lg overflow-hidden mb-4">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-neutral-50 text-neutral-500 font-semibold uppercase text-xs">
                            <tr>
                                <th className="p-3">Nombre</th><th className="p-3 w-24">Precio</th><th className="p-3 w-20">Stock</th><th className="p-3 w-32">SKU</th><th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-100">
                            {variants.map((variant) => (
                                <tr key={variant.id} className="group hover:bg-neutral-50">
                                    <td className="p-2"><input type="text" value={variant.name} onChange={(e) => updateVariant(variant.id, 'name', e.target.value)} className="w-full bg-transparent outline-none font-medium"/></td>
                                    <td className="p-2"><input type="number" value={variant.price} onChange={(e) => updateVariant(variant.id, 'price', e.target.value)} className="w-full bg-transparent outline-none font-bold"/></td>
                                    <td className="p-2"><input type="number" value={variant.stock} onChange={(e) => updateVariant(variant.id, 'stock', e.target.value)} className="w-full bg-transparent outline-none"/></td>
                                    <td className="p-2"><input type="text" value={variant.sku} onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)} className="w-full bg-transparent outline-none text-xs font-mono uppercase"/></td>
                                    <td className="p-2 text-center"><button onClick={() => removeVariant(variant.id)} className="text-neutral-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                            <tr className="bg-orange-50/50">
                                <td className="p-2"><input placeholder="Ej: Rojo / Talla M" value={newVariant.name} onChange={(e) => setNewVariant(p => ({...p, name: e.target.value}))} className="w-full px-2 py-1 bg-white border border-orange-200 rounded outline-none text-sm"/></td>
                                <td className="p-2"><input type="number" placeholder="0.00" value={newVariant.price} onChange={(e) => setNewVariant(p => ({...p, price: e.target.value}))} className="w-full px-2 py-1 bg-white border border-orange-200 rounded outline-none text-sm"/></td>
                                <td className="p-2"><input type="number" placeholder="1" value={newVariant.stock} onChange={(e) => setNewVariant(p => ({...p, stock: e.target.value}))} className="w-full px-2 py-1 bg-white border border-orange-200 rounded outline-none text-sm"/></td>
                                <td className="p-2"><input placeholder="SKU" value={newVariant.sku} onChange={(e) => setNewVariant(p => ({...p, sku: e.target.value}))} className="w-full px-2 py-1 bg-white border border-orange-200 rounded outline-none text-xs uppercase"/></td>
                                <td className="p-2 text-center"><button onClick={addVariant} className="bg-[#FF6600] text-white p-1.5 rounded hover:bg-orange-700"><Plus size={16}/></button></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
          )}

          {/* IMÁGENES */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <h3 className="font-semibold text-neutral-800 text-lg mb-4 flex items-center gap-2"><ImageIcon size={20} className="text-neutral-400"/> Imágenes</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="col-span-2 row-span-2 border-2 border-dashed border-orange-200 bg-orange-50 rounded-xl relative overflow-hidden group cursor-pointer hover:bg-orange-100 transition-colors">
                <input type="file" onChange={handleMainImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" accept="image/*" />
                {mainImage.preview ? (
                  <img src={mainImage.preview} className="w-full h-full object-contain" alt="Main" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[#FF6600]"><UploadCloud size={32} className="mb-2"/><span className="text-sm font-bold">Subir Portada</span></div>
                )}
              </div>
              {gallery.map((img, i) => (
                <div key={img.id || i} className="aspect-square border rounded-xl bg-white relative overflow-hidden group">
                  <img src={img.preview} className="w-full h-full object-cover" />
                  <button onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"><X size={12}/></button>
                </div>
              ))}
              <div className="aspect-square border rounded-xl bg-neutral-50 flex items-center justify-center relative cursor-pointer hover:bg-neutral-100 text-neutral-400 hover:text-[#FF6600]">
                <input type="file" onChange={handleGallerySelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                <Plus size={24} />
              </div>
            </div>
          </div>

          {/* FICHA TÉCNICA */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-neutral-800 text-lg">Ficha Técnica</h3>
              <button onClick={() => setFormData(p => ({...p, specs: [...p.specs, { id: Date.now(), key: '', value: '' }] }))} className="text-sm text-[#FF6600] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100 hover:bg-orange-100">
                <Plus size={16} /> Añadir
              </button>
            </div>
            <div className="border border-neutral-200 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <tbody className="divide-y divide-neutral-100">
                  {formData.specs.map((spec) => (
                    <tr key={spec.id}>
                      <td className="p-2 w-1/3">
                        <input type="text" value={spec.key} onChange={(e) => updateSpec(spec.id, 'key', e.target.value)} className="w-full px-3 py-1.5 rounded bg-transparent focus:bg-neutral-50 outline-none font-bold text-neutral-600 placeholder:font-normal" placeholder="Ej: Procesador" />
                      </td>
                      <td className="p-2">
                        <input type="text" value={spec.value} onChange={(e) => updateSpec(spec.id, 'value', e.target.value)} className="w-full px-3 py-1.5 rounded bg-transparent focus:bg-neutral-50 outline-none text-neutral-800" placeholder="Ej: Intel Core i5..." />
                      </td>
                      <td className="p-2 text-center w-10">
                        <button onClick={() => setFormData(p => ({...p, specs: p.specs.filter(s => s.id !== spec.id)}))} className="text-neutral-400 hover:text-red-500"><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        {/* COLUMNA DERECHA */}
        <div className="space-y-6">
          {!isVariable && (
            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                <h3 className="font-semibold text-neutral-800 text-lg mb-4 flex items-center gap-2"><DollarSign size={20} className="text-green-600"/> Precio & Stock</h3>
                <div className="mb-4 relative">
                    <label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Precio (USD)</label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">$</span>
                        <input type="number" value={formData.priceUsd} onChange={(e) => handleInputChange('priceUsd', e.target.value)} className="w-full pl-7 pr-3 py-3 text-lg font-bold border border-neutral-300 rounded-lg focus:border-[#FF6600] outline-none" placeholder="0.00"/>
                    </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-neutral-100 mt-4">
                   <span className="text-sm font-medium text-neutral-700">Disponible</span>
                   <button onClick={() => handleInputChange('inStock', !formData.inStock)} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${formData.inStock ? 'bg-green-500' : 'bg-neutral-300'}`}>
                      <div className={`w-4 h-4 bg-white rounded-full transition-transform shadow-sm ${formData.inStock ? 'translate-x-6' : 'translate-x-0'}`}></div>
                   </button>
                </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-4">
             <h3 className="font-semibold text-neutral-800">Organización</h3>
             
             {/* Categoría Dinámica */}
             <div>
                <div className="flex justify-between items-center mb-1">
                   <label className="text-xs font-semibold text-neutral-500 uppercase">Categoría</label>
                   <button onClick={() => { setIsCustomCategory(!isCustomCategory); handleInputChange('category', ''); }} className="text-[10px] text-[#FF6600] hover:underline">{isCustomCategory ? 'Lista' : 'Nueva'}</button>
                </div>
                {isCustomCategory ? (
                   <input type="text" value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-2 border rounded-lg text-sm" placeholder="Nueva..." />
                ) : (
                   <select value={formData.category} onChange={(e) => handleInputChange('category', e.target.value)} className="w-full p-2 border rounded-lg text-sm bg-white">
                      <option value="">Seleccionar...</option>{categoriesList.map(c => <option key={c} value={c}>{c}</option>)}
                   </select>
                )}
             </div>

             {/* Marca Dinámica */}
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

             {/* Etiquetas */}
             <div>
                <label className="text-xs font-semibold text-neutral-500 uppercase mb-1 block">Etiquetas (Tags)</label>
                <div className="p-2 border rounded-lg bg-white mb-2">
                   <div className="flex flex-wrap gap-2 mb-2">
                      {formData.tags.map(t => (
                         <span key={t} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs flex items-center gap-1 font-medium">
                            {t} <X size={12} className="cursor-pointer hover:text-orange-900" onClick={() => removeTag(t)}/>
                         </span>
                      ))}
                   </div>
                   <input type="text" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())} className="w-full outline-none text-sm" placeholder="Escribe y presiona Enter..." />
                </div>
                {/* Nube de sugerencias */}
                {availableTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                        {availableTags.filter(t => !formData.tags.includes(t) && t.toLowerCase().includes(tagInput.toLowerCase())).slice(0, 10).map(t => (
                            <button key={t} onClick={() => handleAddTag(t)} className="text-[10px] bg-neutral-100 hover:bg-neutral-200 px-2 py-1 rounded-full text-neutral-600 transition-colors">
                                + {t}
                            </button>
                        ))}
                    </div>
                )}
             </div>
          </div>
          
          {/* SEO */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
             <div className="flex justify-between items-center mb-3">
                <h3 className="font-semibold text-neutral-800 text-sm flex items-center gap-2"><Globe size={16} className="text-[#FF6600]"/> SEO</h3>
                <button onClick={generateSeoAI} disabled={loadingSEO} className="text-[10px] font-bold text-[#FF6600] bg-orange-50 px-2 py-1 rounded-md border border-orange-100 hover:bg-orange-100">{loadingSEO ? '...' : 'Generar'}</button>
             </div>
             <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100 space-y-2">
                <input value={formData.seo.title} onChange={(e) => setFormData(p => ({...p, seo: {...p.seo, title: e.target.value}}))} className="w-full bg-transparent text-blue-700 font-medium outline-none text-sm border-b border-transparent focus:border-blue-200" placeholder="Título Meta"/>
                <textarea value={formData.seo.description} onChange={(e) => setFormData(p => ({...p, seo: {...p.seo, description: e.target.value}}))} className="w-full bg-transparent text-neutral-600 text-xs outline-none resize-none border-b border-transparent focus:border-neutral-300" rows="3" placeholder="Descripción Meta"/>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFormPage;