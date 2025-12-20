import React, { useState, useEffect, useRef } from 'react';

// --- IMPORTACIONES DE FIREBASE ---
// Nota: Eliminamos initializeApp, getFirestore, etc. porque ya vienen listos
import { 
  collection, addDoc, getDocs, deleteDoc, updateDoc, doc, setDoc, onSnapshot, getDoc, writeBatch 
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";

// --- IMPORTAR INSTANCIAS COMPARTIDAS ---
import { db, auth, storage } from './services/firebase';

import { 
  LayoutDashboard, ShoppingBag, Users, Settings, Package, 
  Save, Eye, ArrowLeft, Image as ImageIcon, Plus, Trash2, 
  Search, DollarSign, BarChart3, Globe, MoreVertical, 
  ChevronDown, Edit, Filter, RefreshCw, X, 
  Sparkles, Loader2, AlertCircle, Tag, List, Layers, Bookmark, 
  PenLine, RotateCcw, Check, XCircle, UploadCloud, Calculator, 
  FileSpreadsheet, Download, Upload, ToggleLeft, ToggleRight, 
  Lock, LogOut, User, MapPin, Truck, ChevronLeft, ChevronRight,
  Megaphone, Star 
} from 'lucide-react';

// Colores de la Marca
const BRAND_ORANGE = "#FF6600"; 

// ==========================================
// 1. LOGIN
// ==========================================
function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setError("Credenciales incorrectas.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md border-t-4 border-[#FF6600]">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#FF6600] rounded-xl mx-auto flex items-center justify-center mb-4 text-white font-bold text-2xl">C</div>
          <h1 className="text-2xl font-bold text-neutral-800">Conputodo</h1>
          <p className="text-neutral-500 text-sm">Josep Suply, C.A</p>
        </div>
        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2"><XCircle size={16}/>{error}</div>}
        <form onSubmit={handleLogin} className="space-y-4">
          <div><label className="block text-sm font-medium text-neutral-700 mb-1">Correo</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-[#FF6600]" placeholder="admin@conputodo.com"/></div>
          <div><label className="block text-sm font-medium text-neutral-700 mb-1">Contraseña</label><input type="password" required value={password} onChange={e=>setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-[#FF6600]" placeholder="••••••••"/></div>
          <button type="submit" disabled={loading} className="w-full bg-[#FF6600] text-white py-2.5 rounded-lg font-bold hover:bg-orange-700 transition-colors flex justify-center">{loading ? <Loader2 className="animate-spin"/> : "Ingresar"}</button>
        </form>
      </div>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD PRINCIPAL
// ==========================================
export default function FullDashboard() {
  
  const geminiApiKey = "AIzaSyCXrzfjky4yrfBVT_JY8uXzVrgK1O2KlRM"; 

  // --- AUTH ---
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  // --- NAVEGACIÓN ---
  const [currentView, setCurrentView] = useState('dashboard'); 

  // --- DATOS ---
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]); 
  const [loadingData, setLoadingData] = useState(false); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // --- MARKETING DATA ---
  const [marketingData, setMarketingData] = useState({ heroImage: '', newsText: '' });
  const [marketingLoading, setMarketingLoading] = useState(false);
  const [tempNewsText, setTempNewsText] = useState('');
  
  // --- PAGINACIÓN ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // --- TASAS ---
  const [exchangeRate, setExchangeRate] = useState(0); 
  const [exchangeRateBCV, setExchangeRateBCV] = useState(0); 
  const [isEditingRate, setIsEditingRate] = useState(false); 
  const [tempRate, setTempRate] = useState(''); 
  const [isEditingRateBCV, setIsEditingRateBCV] = useState(false); 
  const [tempRateBCV, setTempRateBCV] = useState(''); 

  // --- OTROS ESTADOS ---
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({ category: '', brand: '', tag: '' });
  const [quickEditPriceId, setQuickEditPriceId] = useState(null); 
  const [quickEditPriceValue, setQuickEditPriceValue] = useState(''); 
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importLog, setImportLog] = useState([]);
  const fileInputRef = useRef(null);

  // --- FORM PRODUCTO ---
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [priceUsd, setPriceUsd] = useState('');
  const [mainImageFile, setMainImageFile] = useState(null); 
  const [mainImagePreview, setMainImagePreview] = useState(''); 
  const [galleryFiles, setGalleryFiles] = useState([]); 
  const [galleryPreviews, setGalleryPreviews] = useState([]); 
  const [specs, setSpecs] = useState([{ id: 1, key: 'Procesador', value: '' }, { id: 2, key: 'Memoria RAM', value: '' }]);
  const [tags, setTags] = useState([]); 
  const [tagInput, setTagInput] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false); 
  const [isCustomBrand, setIsCustomBrand] = useState(false); 
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [inStock, setInStock] = useState(true); 
  const [isFeatured, setIsFeatured] = useState(false);
  const [sku, setSku] = useState('');
  const [seoData, setSeoData] = useState({ title: '', description: '' });
  const [loadingDesc, setLoadingDesc] = useState(false);
  const [loadingSEO, setLoadingSEO] = useState(false);
  const [isSaving, setIsSaving] = useState(false); 

  // ==========================================
  // EFECTOS
  // ==========================================

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      fetchRates();
      if (['product-list', 'product-trash', 'dashboard'].includes(currentView)) fetchProducts();
      if (['orders', 'dashboard'].includes(currentView)) fetchOrders();
      if (currentView === 'marketing') fetchMarketing();
    }
  }, [user, currentView]);

  useEffect(() => {
    setCurrentPage(1);
  }, [currentView, searchTerm, activeFilters]);

  // --- DATA FETCHERS ---
  const fetchRates = async () => {
    try {
      const docSnap = await getDoc(doc(db, "settings", "global"));
      if (docSnap.exists()) {
        const data = docSnap.data();
        setExchangeRate(data.exchangeRate || 64.50);
        setExchangeRateBCV(data.exchangeRateBCV || 55.00); 
      } else {
        await setDoc(doc(db, "settings", "global"), { exchangeRate: 64.50, exchangeRateBCV: 55.00 });
        setExchangeRate(64.50); setExchangeRateBCV(55.00);
      }
    } catch (error) { console.error("Error tasas:", error); }
  };

  const fetchProducts = async () => {
    setLoadingData(true);
    try {
      const qs = await getDocs(collection(db, "products"));
      setProducts(qs.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)));
    } catch (error) { console.error(error); } finally { setLoadingData(false); }
  };

  const fetchOrders = async () => {
    setLoadingData(true);
    try {
      const qs = await getDocs(collection(db, "orders"));
      setOrders(qs.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds));
    } catch (e) { console.error(e); } finally { setLoadingData(false); }
  };

  const fetchMarketing = async () => {
      setMarketingLoading(true);
      try {
          const docSnap = await getDoc(doc(db, "settings", "marketing"));
          if(docSnap.exists()){
              const data = docSnap.data();
              setMarketingData(data);
              setTempNewsText(data.newsText || '');
          }
      } catch (error) { console.error("Error marketing", error); } finally { setMarketingLoading(false); }
  };

  // ==========================================
  // LÓGICA MARKETING
  // ==========================================
  const handleBannerUpload = async (e) => {
      const file = e.target.files[0];
      if(!file) return;
      setMarketingLoading(true);
      try {
          const storageRef = ref(storage, `marketing/hero_banner_${Date.now()}`);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          
          const newData = { ...marketingData, heroImage: url };
          await setDoc(doc(db, "settings", "marketing"), newData, { merge: true });
          setMarketingData(newData);
      } catch (error) { console.error(error); alert("Error al subir imagen"); } finally { setMarketingLoading(false); }
  };

  const handleSaveMarketing = async () => {
      setMarketingLoading(true);
      try {
          const newData = { ...marketingData, newsText: tempNewsText };
          await setDoc(doc(db, "settings", "marketing"), newData, { merge: true });
          setMarketingData(newData);
          alert("✅ Configuración guardada");
      } catch (error) { console.error(error); alert("Error al guardar"); } finally { setMarketingLoading(false); }
  };

  // ==========================================
  // LÓGICA DE NEGOCIO Y FILTROS
  // ==========================================
  
  const calculateBs = (usd) => (parseFloat(usd) || 0) * exchangeRate;
  const calculatePVP = (usd) => (!exchangeRate || !exchangeRateBCV) ? 0 : ((parseFloat(usd)||0) * exchangeRate) / exchangeRateBCV;
  const currentPriceBs = calculateBs(priceUsd);
  const currentPVP = calculatePVP(priceUsd);
  const sanitizeFilename = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const uniqueCategories = [...new Set(products.map(p => p.category).filter(Boolean))];
  const uniqueBrands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const uniqueTags = [...new Set(products.flatMap(p => p.tags || []).filter(Boolean))];

  const filteredProducts = products.filter(product => {
    const term = searchTerm.toLowerCase();
    const isTrashView = currentView === 'product-trash';
    const isDeleted = product.status === 'trash';
    if (isTrashView && !isDeleted) return false;
    if (!isTrashView && isDeleted) return false;
    const matchSearch = product.title.toLowerCase().includes(term) || product.sku?.toLowerCase().includes(term);
    return matchSearch && (activeFilters.category ? product.category === activeFilters.category : true) && (activeFilters.brand ? product.brand === activeFilters.brand : true);
  });

  const filteredOrders = orders.filter(order => {
     const term = searchTerm.toLowerCase();
     return order.clientName?.toLowerCase().includes(term) || order.id.toLowerCase().includes(term) || order.clientCedula?.toLowerCase().includes(term);
  });

  const paginate = (data) => {
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = data.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(data.length / itemsPerPage);
    return { currentItems, totalPages };
  };

  const handleUpdateExchangeRate = async () => {
    const newRate = parseFloat(tempRate);
    if (!newRate || newRate <= 0) return alert("Tasa inválida");
    await updateDoc(doc(db, "settings", "global"), { exchangeRate: newRate });
    setExchangeRate(newRate); setIsEditingRate(false);
  };
  const handleUpdateExchangeRateBCV = async () => {
    const newRate = parseFloat(tempRateBCV);
    if (!newRate || newRate <= 0) return alert("Tasa BCV inválida");
    await updateDoc(doc(db, "settings", "global"), { exchangeRateBCV: newRate });
    setExchangeRateBCV(newRate); setIsEditingRateBCV(false);
  };

  const handleOrderStatusChange = async (orderId, newStatus) => {
    try {
        await updateDoc(doc(db, "orders", orderId), { status: newStatus });
        setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) { console.error("Error", error); alert("Error"); }
  };

  // --- CRUD PRODUCTOS ---
  const handleSaveProduct = async () => {
    if (!title || !priceUsd) return alert("⚠️ Completa Título y Precio USD");
    setIsSaving(true);
    try {
      const cleanFilename = sanitizeFilename(title);
      let targetDocRef = editingId ? doc(db, "products", editingId) : doc(db, "products", cleanFilename);
      const targetId = targetDocRef.id;

      let mainImageUrl = mainImagePreview; 
      if (mainImageFile) {
        const ext = mainImageFile.name.split('.').pop();
        mainImageUrl = await uploadImageToFirebase(mainImageFile, `products/${targetId}/${cleanFilename}-portada.${ext}`);
      }
      const newGalleryUrls = [];
      const existingImagesCount = galleryPreviews.filter(url => url.startsWith('http')).length;
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const ext = file.name.split('.').pop();
        const url = await uploadImageToFirebase(file, `products/${targetId}/${cleanFilename}-${existingImagesCount + i + 1}.${ext}`);
        newGalleryUrls.push(url);
      }
      const oldGalleryUrls = galleryPreviews.filter(url => url.startsWith('http'));
      const finalGalleryUrls = [...oldGalleryUrls, ...newGalleryUrls];

      const productData = {
        title, slug: cleanFilename, description, prices: { usd: parseFloat(priceUsd) }, 
        specs: specs.map(spec => ({ key: spec.key, value: spec.value })), 
        category, brand, tags, inStock, sku, seo: seoData,
        isFeatured, 
        images: { main: mainImageUrl, gallery: finalGalleryUrls },
        status: editingId ? undefined : 'published', updatedAt: new Date(),
        ...(editingId ? {} : { createdAt: new Date() })
      };
      if (productData.status === undefined) delete productData.status;
      await setDoc(targetDocRef, productData, { merge: true });
      alert(editingId ? `💾 Actualizado` : `✅ Creado`);
      resetForm(); setCurrentView('product-list');
    } catch (e) { console.error(e); alert("Error"); } finally { setIsSaving(false); }
  };
  const uploadImageToFirebase = async (file, path) => {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return await getDownloadURL(storageRef);
  };
  const resetForm = () => {
    setEditingId(null); setTitle(''); setSlug(''); setPriceUsd(''); setDescription('');
    setCategory(''); setBrand(''); setSku(''); setSeoData({title:'', description:''});
    setInStock(true); setIsFeatured(false); setSpecs([{ id: 1, key: 'Procesador', value: '' }, { id: 2, key: 'Memoria RAM', value: '' }]); setTags([]); 
    setMainImageFile(null); setMainImagePreview(''); setGalleryFiles([]); setGalleryPreviews([]);
  };
  const handleEditProduct = (product) => {
    setEditingId(product.id); setTitle(product.title); setSlug(product.slug); setPriceUsd(product.prices?.usd || '');
    setDescription(product.description || ''); setCategory(product.category || ''); setBrand(product.brand || '');
    setInStock(product.inStock !== false); setIsFeatured(product.isFeatured || false); setSku(product.sku || '');
    setTags(product.tags || []); setSeoData(product.seo || { title: '', description: '' });
    setMainImagePreview(product.images?.main || ''); setGalleryPreviews(product.images?.gallery || []);
    setMainImageFile(null); setGalleryFiles([]); 
    if (product.specs?.length > 0) setSpecs(product.specs.map((s, i) => ({ id: i, key: s.key, value: s.value })));
    else setSpecs([{ id: 1, key: 'Procesador', value: '' }]);
    setCurrentView('product-create');
  };
  const saveQuickEditPrice = async (productId) => { try { const newUsd = parseFloat(quickEditPriceValue) || 0; await updateDoc(doc(db, "products", productId), { "prices.usd": newUsd, updatedAt: new Date() }); setProducts(products.map(p => p.id === productId ? { ...p, prices: { ...p.prices, usd: newUsd } } : p)); setQuickEditPriceId(null); } catch (error) { console.error(error); } };
  const handleQuickStatusChange = async (productId, newStatus) => { try { await updateDoc(doc(db, "products", productId), { status: newStatus, updatedAt: new Date() }); setProducts(products.map(p => p.id === productId ? { ...p, status: newStatus } : p)); if (currentView !== 'product-list' && newStatus === 'trash') fetchProducts(); } catch (error) { console.error(error); } };
  const handleDeleteProduct = async (product) => { if (product.status === 'trash') { if (window.confirm("⛔ ¿Eliminar definitivamente?")) { await deleteDoc(doc(db, "products", product.id)); fetchProducts(); } } else { if (window.confirm("¿Mover a la papelera?")) { await updateDoc(doc(db, "products", product.id), { status: 'trash' }); fetchProducts(); } } };
  const handleRestoreProduct = async (productId) => { await updateDoc(doc(db, "products", productId), { status: 'published' }); fetchProducts(); };
  const addSpecRow = () => { setSpecs([...specs, { id: Date.now(), key: '', value: '' }]); };
  const removeSpecRow = (id) => { setSpecs(specs.filter(spec => spec.id !== id)); };
  const updateSpec = (id, field, value) => { setSpecs(specs.map(spec => spec.id === id ? { ...spec, [field]: value } : spec)); };
  const handleAddTag = (e) => { if (e.key === 'Enter' && tagInput.trim()) { e.preventDefault(); if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]); setTagInput(''); } };
  const removeTag = (t) => { setTags(tags.filter(tag => tag !== t)); };
  const handleMainImageSelect = (e) => { if (e.target.files && e.target.files[0]) { setMainImageFile(e.target.files[0]); setMainImagePreview(URL.createObjectURL(e.target.files[0])); } };
  const handleGallerySelect = (e) => { if (e.target.files && e.target.files[0]) { setGalleryFiles([...galleryFiles, e.target.files[0]]); setGalleryPreviews([...galleryPreviews, URL.createObjectURL(e.target.files[0])]); } };
  
  // AI
  const generateDescriptionAI = async () => { if (!title) return alert("Escribe un título"); setLoadingDesc(true); try { const prompt = `Copywriter e-commerce. Descripción (80 palabras) para: "${title}". Specs: ${specs.map(s => `${s.key}: ${s.value}`).join(', ')}. Tags: ${tags.join(', ')}. Tono vendedor Venezuela.`; const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }); const data = await response.json(); const text = data.candidates?.[0]?.content?.parts?.[0]?.text; if (text) setDescription(text); } catch (e) { console.error(e); } finally { setLoadingDesc(false); } };
  const generateSeoAI = async () => { if (!title) return alert("Escribe un título"); setLoadingSEO(true); try { const prompt = `Genera JSON { "title": "...", "description": "..." } SEO para: "${title}". Tags: ${tags.join(', ')}.`; const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${geminiApiKey}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) }); const data = await response.json(); let text = data.candidates?.[0]?.content?.parts?.[0]?.text; text = text.replace(/```json/g, '').replace(/```/g, '').trim(); setSeoData(JSON.parse(text)); } catch (e) { console.error(e); } finally { setLoadingSEO(false); } };
  
  // Export/Import
  const handleExportTemplate = () => {
    const headers = ["title", "price_usd", "category", "brand", "in_stock", "sku", "description", "tags"];
    const rows = [["Laptop Ejemplo", "1200.00", "Computacion", "HP", "si", "HP-LPT-001", "Descripción corta", "gaming|oferta"]];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\r\n" + rows.map(e => e.join(",")).join("\r\n");
    const link = document.createElement("a"); link.setAttribute("href", encodeURI(csvContent)); link.setAttribute("download", "plantilla_productos.csv");
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };
  const handleFileUpload = (event) => { const file = event.target.files[0]; if (!file) return; const reader = new FileReader(); reader.onload = async (e) => await processCSV(e.target.result); reader.readAsText(file); };
  const processCSV = async (csvText) => {
    setImporting(true); setImportProgress(0); setImportLog([]);
    const lines = csvText.split("\n"); const headers = lines[0].split(",").map(h => h.trim());
    if (!headers.includes("title") || !headers.includes("price_usd")) { alert("❌ Error formato CSV."); setImporting(false); return; }
    let successCount = 0; const totalLines = lines.length - 1;
    for (let i = 1; i < lines.length; i++) {
        const currentLine = lines[i].trim(); if (!currentLine) continue;
        const values = currentLine.split(","); const getData = (key) => { const index = headers.indexOf(key); return index > -1 ? values[index]?.trim() : ""; };
        const title = getData("title"); const priceUsd = parseFloat(getData("price_usd")); const inStock = ["si", "yes", "true", "1", "s"].includes(getData("in_stock").toLowerCase());
        if (!title || isNaN(priceUsd)) { setImportLog(prev => [...prev, `⚠️ Fila ${i}: Error datos`]); continue; }
        const customId = sanitizeFilename(title);
        const productData = { title, slug: customId, description: getData("description"), category: getData("category").toLowerCase(), brand: getData("brand"), sku: getData("sku"), inStock, prices: { usd: priceUsd }, tags: getData("tags").split("|").map(t => t.trim()).filter(Boolean), status: 'published', createdAt: new Date(), updatedAt: new Date() };
        try { await setDoc(doc(db, "products", customId), productData); successCount++; } catch (error) { setImportLog(prev => [...prev, `❌ Fila ${i}: Error Firebase`]); }
        setImportProgress(Math.round((i / totalLines) * 100));
    }
    setImporting(false); alert(`✅ Importados: ${successCount} productos.`); if (fileInputRef.current) fileInputRef.current.value = ""; fetchProducts();
  };

  // ==========================================
  // COMPONENTS HELPER
  // ==========================================

  const RateWidget = ({ label, rate, isEditing, tempVal, setTemp, setIsEditing, onUpdate, colorClass }) => (
    <div className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
        <div className={`w-2 h-2 rounded-full animate-pulse ${colorClass}`}></div>
        <span className="text-xs font-bold text-neutral-600 uppercase">{label}:</span>
        {isEditing ? (
            <div className="flex items-center gap-1">
                <input type="number" value={tempVal} onChange={(e) => setTemp(e.target.value)} className="w-16 text-sm font-bold border-b border-[#FF6600] outline-none p-0 text-center" autoFocus onKeyDown={(e) => e.key === 'Enter' && onUpdate()} />
                <Check size={14} className="text-green-600 cursor-pointer" onClick={onUpdate}/><X size={14} className="text-red-500 cursor-pointer" onClick={() => setIsEditing(false)}/>
            </div>
        ) : (
            <span className="text-sm font-bold text-neutral-800 cursor-pointer border-b border-dashed border-neutral-300 hover:text-[#FF6600]" onClick={() => { setTemp(rate); setIsEditing(true); }}>{rate} Bs</span>
        )}
    </div>
  );

  const PaginationControls = ({ totalPages }) => (
    <div className="flex justify-center items-center gap-4 mt-6">
        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-neutral-100 disabled:opacity-50"><ChevronLeft size={20}/></button>
        <span className="text-sm text-neutral-600">Página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong></span>
        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border rounded-lg hover:bg-neutral-100 disabled:opacity-50"><ChevronRight size={20}/></button>
    </div>
  );

  // ==========================================
  // RENDERIZADO
  // ==========================================

  if (authLoading) return <div className="h-screen flex items-center justify-center bg-neutral-100"><Loader2 className="animate-spin text-[#FF6600]" size={40}/></div>;
  if (!user) return <LoginScreen />;

  return (
    <div className="flex h-screen bg-neutral-100 font-sans text-neutral-800 overflow-hidden">
      
      {/* SIDEBAR FIJA */}
      <aside className="w-64 bg-black text-neutral-400 hidden md:flex flex-col flex-shrink-0 border-r border-neutral-800">
        <div className="p-6 border-b border-neutral-800 flex items-center gap-3">
          <div className="w-8 h-8 bg-[#FF6600] rounded-lg flex items-center justify-center font-bold text-white">C</div>
          <div>
              <span className="text-white font-bold text-lg tracking-wide block leading-none">Conputodo</span>
              <span className="text-[10px] text-neutral-500">Josep Suply, C.A</span>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
          <NavItem icon={<LayoutDashboard size={20}/>} label="Resumen" active={currentView === 'dashboard'} onClick={() => setCurrentView('dashboard')} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-neutral-600 uppercase">Gestión</div>
          <NavItem icon={<ShoppingBag size={20}/>} label="Pedidos" active={currentView === 'orders'} onClick={() => { setCurrentView('orders'); fetchOrders(); }} badge={orders.filter(o=>o.status==='pendiente').length || null} />
          <NavItem icon={<Package size={20}/>} label="Productos" active={currentView === 'product-list' || currentView === 'product-create'} onClick={() => { resetForm(); setCurrentView('product-list'); }} />
          <NavItem icon={<Megaphone size={20}/>} label="Marketing" active={currentView === 'marketing'} onClick={() => setCurrentView('marketing')} />
          <div className="pt-4 pb-2 px-3 text-xs font-semibold text-neutral-600 uppercase">Sistema</div>
          <NavItem icon={<Trash2 size={20}/>} label="Papelera" active={currentView === 'product-trash'} onClick={() => { resetForm(); setCurrentView('product-trash'); }} />
          <NavItem icon={<FileSpreadsheet size={20}/>} label="Importar / Exportar" active={currentView === 'data-tools'} onClick={() => setCurrentView('data-tools')} />
        </nav>
        <div className="p-4 border-t border-neutral-800">
          <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-neutral-500 hover:text-white transition-colors w-full px-2 py-2"><LogOut size={18} /> <span>Cerrar Sesión</span></button>
        </div>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* HEADER */}
        <header className="bg-white border-b border-neutral-200 px-8 py-3 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                 <h2 className="text-xl font-bold text-neutral-800 capitalize">{currentView.replace('-', ' ')}</h2>
             </div>
             <div className="flex items-center gap-4">
                 <div className="flex flex-col text-right">
                     <span className="text-sm font-bold text-neutral-800">{user.email}</span>
                     <span className="text-[10px] text-[#FF6600] font-medium uppercase">Administrador</span>
                 </div>
                 <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 text-[#FF6600]">
                     <User size={20} />
                 </div>
             </div>
        </header>

        {/* AREA DE CONTENIDO */}
        <div className="flex-1 overflow-y-auto p-8 scroll-smooth">

            {/* VISTA DASHBOARD */}
            {currentView === 'dashboard' && (
                <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm border-l-4 border-l-[#FF6600]">
                            <h3 className="text-neutral-500 text-sm font-medium uppercase mb-2">Pedidos Pendientes</h3>
                            <p className="text-4xl font-bold text-[#FF6600]">{orders.filter(o=>o.status==='pendiente').length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                            <h3 className="text-neutral-500 text-sm font-medium uppercase mb-2">Productos Activos</h3>
                            <p className="text-4xl font-bold text-neutral-900">{products.filter(p => p.status === 'published').length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center gap-3">
                             <div className="flex justify-between items-center">
                                 <span className="text-sm text-neutral-500">Tasa Paralela</span>
                                 <RateWidget label="Ref" rate={exchangeRate} isEditing={isEditingRate} tempVal={tempRate} setTemp={setTempRate} setIsEditing={setIsEditingRate} onUpdate={handleUpdateExchangeRate} colorClass="bg-green-500"/>
                             </div>
                             <div className="flex justify-between items-center">
                                 <span className="text-sm text-neutral-500">Tasa BCV</span>
                                 <RateWidget label="BCV" rate={exchangeRateBCV} isEditing={isEditingRateBCV} tempVal={tempRateBCV} setTemp={setTempRateBCV} setIsEditing={setIsEditingRateBCV} onUpdate={handleUpdateExchangeRateBCV} colorClass="bg-blue-500"/>
                             </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA MARKETING */}
            {currentView === 'marketing' && (
                <div className="max-w-4xl mx-auto space-y-8">
                    <h1 className="text-2xl font-bold text-neutral-800">Configuración Visual de la Tienda</h1>
                    
                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Banner Principal (Hero)</h3>
                        <p className="text-sm text-neutral-500 mb-4">Sube una imagen para la portada de la tienda (Recomendado: 1920x600px)</p>
                        
                        <div className="relative aspect-[3/1] bg-neutral-100 rounded-lg overflow-hidden border-2 border-dashed border-neutral-300 flex items-center justify-center group hover:border-[#FF6600] transition-colors">
                            {marketingData.heroImage ? (
                                <img src={marketingData.heroImage} className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-center text-neutral-400">
                                    <ImageIcon size={48} className="mx-auto mb-2"/>
                                    <span>Sin imagen seleccionada</span>
                                </div>
                            )}
                            <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleBannerUpload} />
                            {marketingLoading && <div className="absolute inset-0 bg-white/80 flex items-center justify-center"><Loader2 className="animate-spin text-[#FF6600]" size={32}/></div>}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
                        <h3 className="font-bold text-lg mb-4">Cintillo de Noticias</h3>
                        <div className="flex gap-4">
                            <input 
                                type="text" 
                                value={tempNewsText}
                                onChange={(e) => setTempNewsText(e.target.value)}
                                placeholder="Ej: ¡Ofertas de Black Friday disponibles!" 
                                className="flex-1 p-3 border border-neutral-300 rounded-lg outline-none focus:border-[#FF6600]"
                            />
                            <button onClick={handleSaveMarketing} disabled={marketingLoading} className="px-6 py-2 bg-[#FF6600] text-white font-bold rounded-lg hover:bg-orange-700 disabled:opacity-50">
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* VISTA PRODUCTOS (TABLA) */}
            {(currentView === 'product-list' || currentView === 'product-trash') && (
            <div className="max-w-7xl mx-auto space-y-6 pb-12">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-neutral-800">{currentView === 'product-trash' ? 'Papelera' : 'Inventario'}</h1>
                        <p className="text-neutral-500 text-sm">{filteredProducts.length} productos</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <RateWidget label="Tasa" rate={exchangeRate} isEditing={isEditingRate} tempVal={tempRate} setTemp={setTempRate} setIsEditing={setIsEditingRate} onUpdate={handleUpdateExchangeRate} colorClass="bg-green-500"/>
                        <RateWidget label="BCV" rate={exchangeRateBCV} isEditing={isEditingRateBCV} tempVal={tempRateBCV} setTemp={setTempRateBCV} setIsEditing={setIsEditingRateBCV} onUpdate={handleUpdateExchangeRateBCV} colorClass="bg-blue-500"/>
                        {currentView === 'product-list' && (
                        <button onClick={() => { resetForm(); setCurrentView('product-create'); }} className="flex items-center gap-2 px-4 py-2 bg-[#FF6600] hover:bg-orange-700 text-white rounded-lg shadow-sm font-medium ml-2 transition-colors"><Plus size={20} /> Nuevo</button>
                        )}
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="relative w-full sm:w-96">
                        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                        <input type="text" placeholder="Buscar productos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF6600]" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="relative">
                            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm font-medium ${showFilters ? 'border-[#FF6600] bg-orange-50 text-[#FF6600]' : 'border-neutral-300'}`}>
                            <Filter size={16} /> Filtros
                            </button>
                            {showFilters && (
                            <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-neutral-200 p-4 z-20">
                                <div className="space-y-3">
                                <select value={activeFilters.category} onChange={(e) => setActiveFilters({...activeFilters, category: e.target.value})} className="w-full p-2 border rounded-lg text-sm"><option value="">Categoría: Todas</option>{uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}</select>
                                <select value={activeFilters.brand} onChange={(e) => setActiveFilters({...activeFilters, brand: e.target.value})} className="w-full p-2 border rounded-lg text-sm"><option value="">Marca: Todas</option>{uniqueBrands.map(b => <option key={b} value={b}>{b}</option>)}</select>
                                </div>
                            </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                    {loadingData ? <div className="p-12 text-center text-neutral-500"><Loader2 size={32} className="animate-spin mx-auto mb-2 text-[#FF6600]" />Cargando...</div> : 
                    filteredProducts.length === 0 ? <div className="p-12 text-center text-neutral-500"><Package size={48} className="mx-auto mb-2 text-neutral-300" />Sin resultados</div> : (
                    <>
                    <div className="overflow-x-auto">
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
                                <th className="p-4 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {paginate(filteredProducts).currentItems.map((product) => (
                                <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors group">
                                    <td className="p-4">
                                    <div className="w-12 h-12 rounded-lg bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 overflow-hidden shadow-sm">
                                        {product.images?.main ? <img src={product.images.main} alt="Miniatura" className="w-full h-full object-cover" /> : <ImageIcon size={20} />}
                                    </div>
                                    </td>
                                    <td className="p-4">
                                    <div className="font-medium text-neutral-800">{product.title}</div>
                                    <div className="flex gap-1 mt-1">{product.tags?.slice(0, 2).map((tag, i) => <span key={i} className="text-[10px] bg-orange-50 text-[#FF6600] px-1.5 rounded border border-orange-100">{tag}</span>)}</div>
                                    </td>
                                    <td className="p-4 text-sm text-neutral-600 capitalize">{product.category || '-'}</td>
                                    <td className="p-4 text-right font-bold text-neutral-700 relative group/price">
                                    {quickEditPriceId === product.id ? (
                                        <div className="flex items-center justify-end gap-1">
                                        <input type="number" value={quickEditPriceValue} onChange={(e) => setQuickEditPriceValue(e.target.value)} className="w-20 p-1 border border-[#FF6600] rounded text-right outline-none text-sm" autoFocus onKeyDown={(e) => e.key === 'Enter' && saveQuickEditPrice(product.id)} />
                                        <button onClick={() => saveQuickEditPrice(product.id)} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14}/></button>
                                        <button onClick={() => setQuickEditPriceId(null)} className="text-red-500 hover:bg-red-100 p-1 rounded"><X size={14}/></button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-end gap-2">
                                        <span className="cursor-pointer text-lg" onClick={() => { setQuickEditPriceId(product.id); setQuickEditPriceValue(product.prices?.usd || 0); }}>${product.prices?.usd?.toFixed(2)}</span>
                                        <Edit size={12} className="text-neutral-300 opacity-0 group-hover/price:opacity-100 cursor-pointer hover:text-[#FF6600]" onClick={() => { setQuickEditPriceId(product.id); setQuickEditPriceValue(product.prices?.usd || 0); }}/>
                                        </div>
                                    )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="text-xs font-bold text-[#FF6600] mb-0.5">PVP: ${calculatePVP(product.prices?.usd).toFixed(2)}</div>
                                        <div className="text-[10px] text-neutral-500 font-medium">Ref: {calculateBs(product.prices?.usd).toLocaleString('es-VE', { minimumFractionDigits: 2 })} Bs</div>
                                    </td>
                                    <td className="p-4 text-center">
                                    {product.inStock === false ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-neutral-200 bg-neutral-50 text-neutral-500 text-xs font-medium"><XCircle size={10}/> Agotado</span>
                                    ) : (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-green-200 bg-green-50 text-green-700 text-xs font-medium"><Check size={10}/> Disponible</span>
                                    )}
                                    </td>
                                    <td className="p-4 text-center">
                                    {product.status === 'trash' ? (
                                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded border border-red-200 bg-red-50 text-red-700 text-xs"><Trash2 size={10}/> Eliminado</span>
                                    ) : (
                                        <div className="relative inline-block">
                                        <select value={product.status} onChange={(e) => handleQuickStatusChange(product.id, e.target.value)} className={`appearance-none pl-6 pr-8 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer ${product.status === 'published' ? 'bg-green-50 text-green-700 border-green-200' : ''} ${product.status === 'draft' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''} ${product.status === 'hidden' ? 'bg-neutral-50 text-neutral-600 border-neutral-200' : ''}`}>
                                            <option value="published">Publicado</option><option value="draft">Borrador</option><option value="hidden">Oculto</option>
                                        </select>
                                        <div className={`absolute left-2 top-1.5 w-1.5 h-1.5 rounded-full ${product.status === 'published' ? 'bg-green-500' : product.status === 'draft' ? 'bg-yellow-500' : 'bg-neutral-400'}`}></div>
                                        <ChevronDown size={12} className="absolute right-2 top-1.5 opacity-50 pointer-events-none"/>
                                        </div>
                                    )}
                                    </td>
                                    <td className="p-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        {currentView === 'product-trash' ? (
                                        <>
                                            <button onClick={() => handleRestoreProduct(product.id)} className="p-2 text-neutral-400 hover:text-green-600 rounded-lg" title="Restaurar"><RotateCcw size={16}/></button>
                                            <button onClick={() => handleDeleteProduct(product)} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg" title="Eliminar"><XCircle size={16}/></button>
                                        </>
                                        ) : (
                                        <>
                                            <button onClick={() => handleEditProduct(product)} className="p-2 text-neutral-400 hover:text-[#FF6600] rounded-lg" title="Editar"><Edit size={16}/></button>
                                            <button onClick={() => handleDeleteProduct(product)} className="p-2 text-neutral-400 hover:text-red-600 rounded-lg" title="Mover a Papelera"><Trash2 size={16}/></button>
                                        </>
                                        )}
                                    </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <PaginationControls totalPages={paginate(filteredProducts).totalPages} />
                    </>
                    )}
                </div>
            </div>
            )}

            {/* VISTA FORMULARIO */}
            {currentView === 'product-create' && (
               <div className="pb-12">
                   <header className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { resetForm(); setCurrentView('product-list'); }} className="p-2 hover:bg-neutral-200 rounded-lg text-neutral-500 transition-colors"><ArrowLeft size={20} /></button>
                        <span className="font-bold text-neutral-800 text-xl">{editingId ? 'Editar Producto' : 'Nuevo Producto'}</span>
                      </div>
                      <button onClick={handleSaveProduct} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 text-white rounded-lg shadow-sm font-bold bg-[#FF6600] hover:bg-orange-700 transition-colors">{isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}{isSaving ? 'Guardando...' : (editingId ? 'Actualizar' : 'Guardar')}</button>
                   </header>
                   
                   <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                       <div className="lg:col-span-2 space-y-6">
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-5">
                                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Nombre</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-2 border rounded-lg outline-none focus:border-[#FF6600]" /></div>
                                <div><label className="block text-sm font-medium text-neutral-700 mb-1">Slug</label><input type="text" value={slug} readOnly className="w-full px-4 py-2 bg-neutral-50 border rounded-lg text-neutral-500" /></div>
                                <div><div className="flex justify-between items-end mb-2"><label className="block text-sm font-medium text-neutral-700">Descripción</label><button onClick={generateDescriptionAI} disabled={loadingDesc} className="flex items-center gap-1.5 text-xs font-medium text-[#FF6600] bg-orange-50 px-3 py-1.5 rounded-full border border-orange-200"><Sparkles size={14}/> IA</button></div><textarea rows="5" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full p-4 border rounded-lg outline-none focus:border-[#FF6600]" /></div>
                            </div>
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6"><h3 className="font-semibold text-neutral-800 text-lg mb-4">Imágenes</h3><div className="grid grid-cols-2 sm:grid-cols-4 gap-4"><div className="col-span-2 row-span-2 border-2 border-dashed border-orange-200 bg-orange-50 rounded-xl relative overflow-hidden group cursor-pointer hover:bg-orange-100"><input type="file" onChange={handleMainImageSelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />{mainImagePreview ? <img src={mainImagePreview} className="w-full h-full object-contain" alt="Main" /> : <div className="flex flex-col items-center justify-center h-full text-center text-[#FF6600]"><UploadCloud size={24} /><span className="text-sm font-semibold">Portada</span></div>}</div>{galleryPreviews.map((src, i) => <div key={i} className="aspect-square border rounded-xl bg-white relative overflow-hidden"><img src={src} className="w-full h-full object-cover" /></div>)}<div className="aspect-square border rounded-xl bg-neutral-50 flex items-center justify-center relative cursor-pointer hover:bg-neutral-100"><input type="file" onChange={handleGallerySelect} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" /><Plus size={24} /></div></div></div>
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6"><div className="flex justify-between items-center mb-4"><h3 className="font-semibold text-neutral-800 text-lg">Ficha Técnica</h3><button onClick={addSpecRow} className="text-sm text-[#FF6600] bg-orange-50 px-3 py-1.5 rounded-lg border border-orange-100"><Plus size={16} /> Añadir</button></div><div className="border border-neutral-200 rounded-lg overflow-hidden"><table className="w-full text-sm"><tbody className="divide-y divide-neutral-100">{specs.map((spec) => (<tr key={spec.id}><td className="p-2"><input type="text" value={spec.key} onChange={(e) => updateSpec(spec.id, 'key', e.target.value)} className="w-full px-3 py-1.5 rounded bg-transparent focus:bg-neutral-50 outline-none focus:text-[#FF6600] font-medium" placeholder="Característica" /></td><td className="p-2"><input type="text" value={spec.value} onChange={(e) => updateSpec(spec.id, 'value', e.target.value)} className="w-full px-3 py-1.5 rounded bg-transparent focus:bg-neutral-50 outline-none" placeholder="Valor" /></td><td className="p-2 text-center"><button onClick={() => removeSpecRow(spec.id)} className="text-neutral-400 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div></div>
                       </div>
                       
                       <div className="space-y-6">
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
                                <h3 className="font-semibold text-neutral-800 text-lg mb-4 flex items-center gap-2"><DollarSign size={20} className="text-green-600"/> Precios</h3>
                                <div className="mb-4"><label className="block text-xs font-bold uppercase text-neutral-500 mb-1">Precio Base (USD)</label><input type="number" value={priceUsd} onChange={(e) => setPriceUsd(e.target.value)} className="w-full p-3 text-lg font-bold border border-neutral-300 rounded-lg focus:border-[#FF6600] outline-none" placeholder="0.00"/></div>
                                <div className="space-y-2">
                                    <div className="bg-neutral-50 rounded-lg p-3 border border-neutral-200 flex justify-between items-center"><div><div className="text-[10px] font-bold text-neutral-500 uppercase">Ref Bs</div><div className="text-xs text-neutral-400">Tasa: {exchangeRate}</div></div><div className="text-xl font-bold text-neutral-700">{currentPriceBs.toLocaleString('es-VE')} Bs</div></div>
                                </div>
                            </div>
                            
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 space-y-4">
                                <h3 className="font-semibold text-neutral-800">Organización</h3>
                                <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-semibold text-neutral-500 uppercase">Categoría</label><button onClick={() => { setIsCustomCategory(!isCustomCategory); setCategory(''); }} className="text-[10px] text-[#FF6600]">{isCustomCategory ? 'Seleccionar' : 'Crear'}</button></div>{isCustomCategory ? <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Nueva..." /> : <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2 border rounded-lg"><option value="">Seleccionar...</option>{uniqueCategories.map(c=><option key={c} value={c}>{c}</option>)}</select>}</div>
                                <div><div className="flex justify-between items-center mb-1"><label className="text-xs font-semibold text-neutral-500 uppercase">Marca</label><button onClick={() => { setIsCustomBrand(!isCustomBrand); setBrand(''); }} className="text-[10px] text-[#FF6600]">{isCustomBrand ? 'Seleccionar' : 'Crear'}</button></div>{isCustomBrand ? <input type="text" value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 border rounded-lg" placeholder="Nueva..." /> : <select value={brand} onChange={(e) => setBrand(e.target.value)} className="w-full p-2 border rounded-lg"><option value="">Seleccionar...</option>{uniqueBrands.map(b=><option key={b} value={b}>{b}</option>)}</select>}</div>
                                
                                <div className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <span className="text-xs font-bold text-yellow-700 flex items-center gap-2"><Star size={14}/> Destacar en Home</span>
                                    <button onClick={() => setIsFeatured(!isFeatured)} className={`w-10 h-5 rounded-full transition-colors flex items-center px-1 ${isFeatured ? 'bg-yellow-500' : 'bg-neutral-300'}`}><div className={`w-3 h-3 bg-white rounded-full transition-transform ${isFeatured ? 'translate-x-5' : 'translate-x-0'}`}></div></button>
                                </div>

                                <div><label className="text-xs font-semibold text-neutral-500 uppercase mb-1 block">Etiquetas</label><div className="p-2 border rounded-lg flex flex-wrap gap-2">{tags.map(t => <span key={t} className="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs flex items-center gap-1">{t} <X size={12} className="cursor-pointer" onClick={()=>removeTag(t)}/></span>)}<input type="text" list="tags-suggestions" value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag} className="flex-1 outline-none text-sm min-w-[80px]" placeholder="Escribe..." /></div></div>
                            </div>

                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6"><h3 className="font-semibold text-neutral-800 mb-4">Inventario</h3><div className="flex gap-3 items-center"><div className="flex-1"><label className="text-xs text-neutral-500 block mb-1 font-bold uppercase">SKU</label><input type="text" value={sku} onChange={(e) => setSku(e.target.value)} className="w-full border border-neutral-300 rounded px-3 py-2 uppercase outline-none focus:border-[#FF6600]" placeholder="COD-001" /></div><div className="flex items-center gap-2 pt-5"><button onClick={() => setInStock(!inStock)} className={`w-12 h-6 rounded-full transition-colors flex items-center px-1 ${inStock ? 'bg-green-500' : 'bg-neutral-300'}`}><div className={`w-4 h-4 bg-white rounded-full transition-transform ${inStock ? 'translate-x-6' : 'translate-x-0'}`}></div></button><span className="text-xs font-bold text-neutral-600 uppercase">{inStock ? 'En Stock' : 'Agotado'}</span></div></div></div>
                            <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 relative"><div className="flex justify-between items-center mb-3"><h3 className="font-semibold text-neutral-800 text-sm flex items-center gap-2"><Globe size={16} className="text-[#FF6600]"/> SEO (Google)</h3><button onClick={generateSeoAI} disabled={loadingSEO} className="text-[10px] font-bold text-[#FF6600] bg-orange-50 px-2 py-1 rounded-md border border-orange-100">Generar con IA</button></div><div className="bg-neutral-50 p-4 rounded-lg border border-neutral-100"><h4 className="text-blue-700 text-lg truncate hover:underline cursor-pointer">{seoData.title || title || 'Título del producto en Google...'}</h4><div className="flex items-center gap-1 text-xs text-green-700 mb-1"><span className="bg-green-700 text-white px-1 rounded-[2px] text-[10px] font-bold">Anuncio</span><span>conputodo.com › producto › {slug}</span></div><p className="text-sm text-neutral-600 line-clamp-2">{seoData.description || description || 'Descripción que aparecerá en los resultados de búsqueda...'}</p></div></div>
                       </div>
                   </div>
               </div>
            )}

            {/* VISTA PEDIDOS */}
            {currentView === 'orders' && (
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <div className="relative w-full max-w-sm">
                            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                            <input type="text" placeholder="Buscar pedido, cliente, cédula..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF6600]" />
                        </div>
                        <button onClick={fetchOrders} className="p-2 border rounded-lg hover:bg-neutral-50"><RefreshCw size={18} className={loadingData ? 'animate-spin' : ''} /></button>
                    </div>
                    
                    <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
                        {loadingData ? <div className="p-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-[#FF6600]"/></div> : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-orange-50 border-b border-orange-100 text-xs uppercase text-[#FF6600] font-semibold">
                                        <tr>
                                            <th className="p-4">ID / Fecha</th>
                                            <th className="p-4">Cliente</th>
                                            <th className="p-4">Entrega</th>
                                            <th className="p-4">Productos</th>
                                            <th className="p-4 text-right">Total Pagar</th>
                                            <th className="p-4 text-center">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-neutral-100 text-sm">
                                        {paginate(filteredOrders).currentItems.length === 0 ? <tr><td colSpan="6" className="p-8 text-center text-neutral-400">No hay pedidos registrados.</td></tr> : 
                                        paginate(filteredOrders).currentItems.map(order => (
                                            <tr key={order.id} className="hover:bg-neutral-50">
                                                <td className="p-4 align-top">
                                                    <div className="font-mono text-xs text-[#FF6600] font-bold">#{order.id.slice(0,6)}</div>
                                                    <div className="text-xs text-neutral-400">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <div className="font-bold text-neutral-800">{order.clientName}</div>
                                                    <div className="text-xs text-neutral-500 font-mono mb-1">CI: {order.clientCedula || 'N/A'}</div>
                                                    <div className="text-neutral-600 text-xs">{order.clientContact}</div>
                                                    <div className="text-[10px] uppercase bg-neutral-100 inline-block px-1.5 py-0.5 rounded mt-1 border border-neutral-200">{order.paymentMethod.replace('_', ' ')}</div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    {order.shippingMethod ? (
                                                        <div className="flex items-center gap-1.5">
                                                            {order.shippingMethod === 'tienda' ? <MapPin size={16} className="text-[#FF6600]"/> : <Truck size={16} className="text-neutral-600"/>}
                                                            <span className="capitalize font-medium text-neutral-700">{order.shippingMethod === 'nacional' ? 'Envío Nac.' : order.shippingMethod}</span>
                                                        </div>
                                                    ) : <span className="text-neutral-400 text-xs italic">No especificado</span>}
                                                </td>
                                                <td className="p-4 align-top">
                                                    <div className="space-y-1">
                                                        {order.products?.map((p,i) => (
                                                            <div key={i} className="text-xs flex justify-between gap-4">
                                                                <span className="text-neutral-700 line-clamp-1">{p.qty}x {p.title}</span>
                                                                <span className="font-medium text-neutral-900">${p.price}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top text-right">
                                                    <div className="text-lg font-extrabold text-neutral-900">${order.totalUsd?.toFixed(2)}</div>
                                                    <div className="text-xs font-bold text-[#FF6600] mt-0.5">PVP: ${calculatePVP(order.totalUsd).toFixed(2)}</div>
                                                    <div className="text-[10px] text-neutral-500 font-medium">Ref: {order.totalBs?.toLocaleString('es-VE')} Bs</div>
                                                </td>
                                                <td className="p-4 align-top text-center">
                                                    <div className="relative inline-block">
                                                    <select 
                                                        value={order.status || 'pendiente'} 
                                                        onChange={(e) => handleOrderStatusChange(order.id, e.target.value)}
                                                        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer transition-colors
                                                        ${order.status === 'pendiente' ? 'bg-orange-100 text-orange-800 border-orange-200' : ''}
                                                        ${order.status === 'completado' ? 'bg-green-100 text-green-700 border-green-200' : ''}
                                                        ${order.status === 'cancelado' ? 'bg-red-100 text-red-700 border-red-200' : ''}
                                                        `}
                                                    >
                                                        <option value="pendiente">Pendiente</option>
                                                        <option value="completado">Completado</option>
                                                        <option value="cancelado">Cancelado</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-2 top-1.5 opacity-50 pointer-events-none"/>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <PaginationControls totalPages={paginate(filteredOrders).totalPages} />
                        </>
                        )}
                    </div>
                </div>
            )}

            {currentView === 'data-tools' && (
                <div><h1 className="text-2xl font-bold text-neutral-800">Importación</h1><p className="text-neutral-500 mb-6">Herramientas CSV</p><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm"><h3 className="font-bold mb-2">1. Plantilla</h3><button onClick={handleExportTemplate} className="w-full py-2 border rounded flex items-center justify-center gap-2 hover:bg-neutral-50"><Download size={18}/> Descargar</button></div><div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm"><h3 className="font-bold mb-2">2. Subir</h3><input type="file" ref={fileInputRef} onChange={handleFileUpload} className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-[#FF6600] hover:file:bg-orange-100"/></div></div></div>
            )}
        
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick, badge }) {
  return (
    <div onClick={onClick} className={`flex justify-between px-3 py-2.5 rounded-lg cursor-pointer mb-1 transition-all ${active ? 'bg-[#FF6600] text-white shadow-lg shadow-orange-900/20' : 'text-neutral-400 hover:bg-neutral-800 hover:text-white'}`}>
      <div className="flex items-center gap-3">{icon}<span className="font-medium text-sm">{label}</span></div>
      {badge && <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{badge}</span>}
    </div>
  );
}