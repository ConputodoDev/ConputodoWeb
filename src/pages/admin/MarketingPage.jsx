import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../services/firebase';
import { Loader2, Image as ImageIcon, Save } from 'lucide-react';

const MarketingPage = () => {
  const [data, setData] = useState({ heroImage: '', newsText: '' });
  const [tempNews, setTempNews] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, "settings", "marketing"));
        if (docSnap.exists()) {
          const d = docSnap.data();
          setData(d);
          setTempNews(d.newsText || '');
        }
      } catch (error) { console.error(error); }
    };
    fetchSettings();
  }, []);

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const storageRef = ref(storage, `marketing/hero_banner_${Date.now()}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      
      const newData = { ...data, heroImage: url };
      await setDoc(doc(db, "settings", "marketing"), newData, { merge: true });
      setData(newData);
      alert("Imagen actualizada");
    } catch (error) {
      console.error(error);
      alert("Error al subir imagen");
    } finally {
      setUploading(false);
    }
  };

  const saveNews = async () => {
    setLoading(true);
    try {
      const newData = { ...data, newsText: tempNews };
      await setDoc(doc(db, "settings", "marketing"), newData, { merge: true });
      setData(newData);
      alert("Noticia guardada");
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <h1 className="text-2xl font-bold text-neutral-800">Configuración Visual</h1>

      {/* Hero Banner */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="font-bold text-lg mb-2">Banner Principal (Hero)</h3>
        <p className="text-sm text-neutral-500 mb-6">Esta imagen aparece en la cabecera del Home. Tamaño recomendado: 1920x600px.</p>

        <div className="relative aspect-[3/1] bg-neutral-100 rounded-xl overflow-hidden border-2 border-dashed border-neutral-300 flex items-center justify-center group hover:border-[#FF6600] transition-colors">
          {data.heroImage ? (
            <img src={data.heroImage} className="w-full h-full object-cover" alt="Hero" />
          ) : (
            <div className="text-center text-neutral-400">
              <ImageIcon size={48} className="mx-auto mb-2"/>
              <span>Sin imagen activa</span>
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold cursor-pointer pointer-events-none">
            Click para cambiar imagen
          </div>
          
          <input 
            type="file" 
            className="absolute inset-0 opacity-0 cursor-pointer" 
            onChange={handleImageUpload} 
            accept="image/*"
          />
          
          {uploading && (
            <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
              <Loader2 className="animate-spin text-[#FF6600]" size={32}/>
            </div>
          )}
        </div>
      </div>

      {/* News Ticker */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <h3 className="font-bold text-lg mb-2">Cintillo de Noticias</h3>
        <p className="text-sm text-neutral-500 mb-4">Texto amarillo que aparece arriba en el Home. Déjalo vacío para ocultarlo.</p>
        
        <div className="flex gap-4">
          <input 
            type="text" 
            value={tempNews}
            onChange={(e) => setTempNews(e.target.value)}
            className="flex-1 px-4 py-3 border border-neutral-300 rounded-lg outline-none focus:border-[#FF6600] font-medium"
            placeholder="Ej: ¡Envíos Gratis por compras mayores a $100!"
          />
          <button 
            onClick={saveNews} 
            disabled={loading}
            className="px-6 py-3 bg-[#FF6600] text-white font-bold rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>}
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

export default MarketingPage;