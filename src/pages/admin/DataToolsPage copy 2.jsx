import React, { useRef, useState } from 'react';
import { doc, setDoc, getDocs, collection, writeBatch } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2, Wrench, ShieldCheck } from 'lucide-react';

const DataToolsPage = () => {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [repairing, setRepairing] = useState(false);
  const [logs, setLogs] = useState([]);

  // --- 1. PLANTILLA CSV ---
  const handleDownloadTemplate = () => {
    const headers = ["title", "price_usd", "category", "brand", "in_stock", "sku", "description", "tags"];
    const rows = [
      ["Laptop HP 15", "450.00", "Laptops", "HP", "si", "HP-15-BW", "Core i5 8GB RAM", "oferta|nuevo"]
    ];
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\r\n" + rows.map(e => e.join(",")).join("\r\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "plantilla_conputodo.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- 2. IMPORTAR CSV ---
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => await processCSV(event.target.result);
    reader.readAsText(file);
  };

  const sanitizeFilename = (text) => text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const processCSV = async (csvText) => {
    setImporting(true);
    setLogs([]);
    const lines = csvText.split("\n");
    const headers = lines[0].split(",").map(h => h.trim());

    if (!headers.includes("title") || !headers.includes("price_usd")) {
      alert("❌ El CSV no tiene el formato correcto (faltan cabeceras 'title' o 'price_usd')");
      setImporting(false);
      return;
    }

    let successCount = 0;
    let errorCount = 0;
    const newLogs = [];

    // Usamos batch (lotes) de 500 para mayor eficiencia
    const batch = writeBatch(db);
    let batchCount = 0;

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split(",");
      const getData = (key) => {
        const index = headers.indexOf(key);
        return index > -1 ? values[index]?.trim() : "";
      };

      const title = getData("title");
      const priceUsd = parseFloat(getData("price_usd"));
      
      if (!title || isNaN(priceUsd)) {
        newLogs.push({ type: 'error', msg: `Fila ${i+1}: Datos inválidos (Título o Precio)` });
        errorCount++;
        continue;
      }

      try {
        const id = sanitizeFilename(title);
        const docRef = doc(db, "products", id);
        
        const data = {
          title,
          slug: id,
          description: getData("description"),
          prices: { usd: priceUsd },
          category: getData("category"),
          brand: getData("brand"),
          sku: getData("sku"),
          inStock: ["si", "yes", "true", "1"].includes(getData("in_stock").toLowerCase()),
          stock: ["si", "yes", "true", "1"].includes(getData("in_stock").toLowerCase()) ? 100 : 0, // Stock numérico default
          tags: getData("tags").split("|").map(t => t.trim()).filter(Boolean),
          status: 'published',
          variants: [], // Aseguramos que tenga variants array
          updatedAt: new Date(),
          createdAt: new Date()
        };

        batch.set(docRef, data, { merge: true });
        batchCount++;
        successCount++;
        
        // Firebase limita batch a 500 operaciones
        if (batchCount >= 450) {
            await batch.commit();
            batchCount = 0; // Reset
        }

      } catch (error) {
        console.error(error);
        newLogs.push({ type: 'error', msg: `Fila ${i+1}: Error preparacion` });
        errorCount++;
      }
    }

    if (batchCount > 0) await batch.commit();

    setLogs(newLogs);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    alert(`Proceso terminado.\n✅ Importados: ${successCount}\n❌ Errores: ${errorCount}`);
  };

  // --- 3. REPARACIÓN MASIVA (SCRIPT) ---
  const normalizeInventory = async () => {
    if (!window.confirm("⚠️ ESTO ESCANEARÁ Y CORREGIRÁ TODOS LOS PRODUCTOS.\n¿Deseas continuar?")) return;
    
    setRepairing(true);
    setLogs([]);
    const newLogs = [];
    let fixedCount = 0;

    try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const batch = writeBatch(db);
        let batchCount = 0;

        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let needsUpdate = false;
            let updates = {};

            // 1. Falta Status
            if (!data.status) {
                updates.status = 'published';
                needsUpdate = true;
            }

            // 2. Stock es String
            if (typeof data.stock === 'string') {
                updates.stock = parseInt(data.stock) || 0;
                needsUpdate = true;
            }
            // 2.1 Falta campo Stock numérico (solo tiene inStock bool)
            if (data.stock === undefined && data.inStock === true) {
                updates.stock = 999;
                needsUpdate = true;
            }

            // 3. Falta Variants
            if (!Array.isArray(data.variants)) {
                updates.variants = [];
                needsUpdate = true;
            }

            // 4. Falta Slug
            if (!data.slug) {
                updates.slug = sanitizeFilename(data.title || docSnap.id);
                needsUpdate = true;
            }

            if (needsUpdate) {
                const docRef = doc(db, "products", docSnap.id);
                batch.update(docRef, updates);
                batchCount++;
                fixedCount++;
                newLogs.push({ type: 'success', msg: `Corregido: ${data.title}` });
            }

            // Commit cada 450
            // Nota: En un loop forEach async no podemos hacer await batch.commit() facilmente sin promesas
            // Para simplicidad en este script de cliente, asumimos < 500 productos a corregir. 
            // Si son más, habría que paginar.
        });

        if (batchCount > 0) {
            await batch.commit();
            newLogs.push({ type: 'success', msg: `✅ SE ACTUALIZARON ${fixedCount} PRODUCTOS.` });
        } else {
            newLogs.push({ type: 'success', msg: `✨ Todo el inventario ya estaba correcto.` });
        }

    } catch (e) {
        console.error(e);
        newLogs.push({ type: 'error', msg: `Error crítico: ${e.message}` });
    } finally {
        setLogs(newLogs);
        setRepairing(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in pb-12">
      <h1 className="text-2xl font-bold text-neutral-800">Herramientas de Datos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Exportar */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
          <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <Download size={24}/>
          </div>
          <h3 className="font-bold text-sm mb-2">Plantilla CSV</h3>
          <p className="text-xs text-neutral-500 mb-4 h-10">Descarga el formato para carga masiva.</p>
          <button onClick={handleDownloadTemplate} className="w-full py-2 border border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-50 text-xs flex items-center justify-center gap-2">
            <FileSpreadsheet size={16}/> Descargar
          </button>
        </div>

        {/* Importar */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center hover:border-[#FF6600] transition-colors relative">
          <div className="w-12 h-12 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6600] mb-4">
            {importing ? <Loader2 className="animate-spin" size={24}/> : <Upload size={24}/>}
          </div>
          <h3 className="font-bold text-sm mb-2">Importar CSV</h3>
          <p className="text-xs text-neutral-500 mb-4 h-10">Sube productos nuevos al inventario.</p>
          
          <label className="w-full py-2 bg-[#FF6600] text-white font-bold rounded-lg hover:bg-orange-700 text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors">
             <Upload size={16}/> Subir Archivo
             <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".csv"
                disabled={importing}
                className="hidden"
            />
          </label>
        </div>

        {/* Reparar (NUEVO) */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center hover:border-purple-300 transition-colors">
          <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4">
             {repairing ? <Loader2 className="animate-spin" size={24}/> : <Wrench size={24}/>}
          </div>
          <h3 className="font-bold text-sm mb-2">Reparar Datos</h3>
          <p className="text-xs text-neutral-500 mb-4 h-10">Normaliza stock y status de cargas antiguas.</p>
          <button 
             onClick={normalizeInventory} 
             disabled={repairing}
             className="w-full py-2 border border-purple-200 text-purple-700 font-bold rounded-lg hover:bg-purple-50 text-xs flex items-center justify-center gap-2"
          >
            <ShieldCheck size={16}/> Ejecutar Corrección
          </button>
        </div>

      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm animate-in slide-in-from-bottom duration-300">
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-neutral-800">Registro de Actividad</h3>
             <button onClick={() => setLogs([])} className="text-xs text-neutral-400 hover:text-neutral-600">Limpiar</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto bg-neutral-50 p-4 rounded-lg border border-neutral-100 font-mono">
            {logs.map((log, i) => (
              <div key={i} className={`text-xs flex items-start gap-2 ${log.type === 'error' ? 'text-red-600' : 'text-green-700'}`}>
                {log.type === 'error' ? <AlertCircle size={12} className="mt-0.5"/> : <CheckCircle size={12} className="mt-0.5"/>}
                <span>{log.msg}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataToolsPage;