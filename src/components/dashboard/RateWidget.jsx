import React, { useState, useEffect } from 'react';
import { Check, X } from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';

const RateWidget = ({ label, rate, rateKey, onRateUpdate, colorClass }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempVal, setTempVal] = useState('');

  // Iniciar edición
  const startEdit = () => {
    setTempVal(rate);
    setIsEditing(true);
  };

  // Guardar cambio
  const handleUpdate = async () => {
    const newRate = parseFloat(tempVal);
    if (!newRate || newRate <= 0) return alert("Tasa inválida");

    try {
      await updateDoc(doc(db, "settings", "global"), { [rateKey]: newRate });
      onRateUpdate(newRate); // Actualizar estado padre
      setIsEditing(false);
    } catch (error) {
      console.error("Error actualizando tasa:", error);
      alert("Error al guardar");
    }
  };

  return (
    <div className="bg-white border border-neutral-200 rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-sm">
      <div className={`w-2 h-2 rounded-full animate-pulse ${colorClass}`}></div>
      <span className="text-xs font-bold text-neutral-600 uppercase">{label}:</span>
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <input 
            type="number" 
            value={tempVal} 
            onChange={(e) => setTempVal(e.target.value)} 
            className="w-16 text-sm font-bold border-b border-[#FF6600] outline-none p-0 text-center" 
            autoFocus 
            onKeyDown={(e) => e.key === 'Enter' && handleUpdate()} 
          />
          <button onClick={handleUpdate} className="text-green-600 hover:bg-green-100 rounded p-0.5"><Check size={14}/></button>
          <button onClick={() => setIsEditing(false)} className="text-red-500 hover:bg-red-100 rounded p-0.5"><X size={14}/></button>
        </div>
      ) : (
        <span 
          className="text-sm font-bold text-neutral-800 cursor-pointer border-b border-dashed border-neutral-300 hover:text-[#FF6600] hover:border-[#FF6600] transition-colors" 
          onClick={startEdit}
          title="Clic para editar"
        >
          {rate} Bs
        </span>
      )}
    </div>
  );
};

export default RateWidget;