import React, { useRef, useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const DataToolsPage = () => {
  const fileInputRef = useRef(null);
  const [importing, setImporting] = useState(false);
  const [logs, setLogs] = useState([]);

  // Generar Plantilla CSV
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

  // Procesar CSV
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
        const data = {
          title,
          slug: id,
          description: getData("description"),
          prices: { usd: priceUsd },
          category: getData("category"),
          brand: getData("brand"),
          sku: getData("sku"),
          inStock: ["si", "yes", "true", "1"].includes(getData("in_stock").toLowerCase()),
          tags: getData("tags").split("|").map(t => t.trim()).filter(Boolean),
          status: 'published',
          updatedAt: new Date(),
          createdAt: new Date() // Nota: en update esto no debería ir, pero para bulk import asumimos nuevos
        };

        await setDoc(doc(db, "products", id), data, { merge: true });
        successCount++;
      } catch (error) {
        console.error(error);
        newLogs.push({ type: 'error', msg: `Fila ${i+1}: Error Firebase` });
        errorCount++;
      }
    }

    setLogs(newLogs);
    setImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    alert(`Proceso terminado.\n✅ Importados: ${successCount}\n❌ Errores: ${errorCount}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
      <h1 className="text-2xl font-bold text-neutral-800">Herramientas de Datos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exportar */}
        <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center hover:border-blue-300 transition-colors">
          <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center text-blue-600 mb-4">
            <Download size={32}/>
          </div>
          <h3 className="font-bold text-lg mb-2">1. Descargar Plantilla</h3>
          <p className="text-sm text-neutral-500 mb-6">Obtén el formato CSV correcto para agregar productos masivamente.</p>
          <button onClick={handleDownloadTemplate} className="px-6 py-2 border border-blue-200 text-blue-700 font-bold rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2">
            <FileSpreadsheet size={18}/> Descargar CSV
          </button>
        </div>

        {/* Importar */}
        <div className="bg-white p-8 rounded-xl border border-neutral-200 shadow-sm flex flex-col items-center text-center hover:border-[#FF6600] transition-colors relative">
          <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center text-[#FF6600] mb-4">
            {importing ? <Loader2 className="animate-spin" size={32}/> : <Upload size={32}/>}
          </div>
          <h3 className="font-bold text-lg mb-2">2. Importar Productos</h3>
          <p className="text-sm text-neutral-500 mb-6">Sube tu archivo CSV rellenado para actualizar el inventario.</p>
          
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".csv"
            disabled={importing}
            className="block w-full text-sm text-neutral-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-[#FF6600] file:text-white hover:file:bg-orange-700 cursor-pointer"
          />
        </div>
      </div>

      {/* Logs */}
      {logs.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="font-bold text-neutral-800 mb-4">Reporte de Importación</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className={`text-sm flex items-center gap-2 ${log.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {log.type === 'error' ? <AlertCircle size={14}/> : <CheckCircle size={14}/>}
                {log.msg}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataToolsPage;