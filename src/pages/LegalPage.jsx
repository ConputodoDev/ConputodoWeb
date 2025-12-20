import React from 'react';
import { ArrowRight, ShieldCheck } from 'lucide-react';

const LegalPage = ({ onBack }) => {
  return (
    <div className="container mx-auto px-4 py-16 max-w-4xl animate-in fade-in duration-500">
      <button onClick={onBack} className="mb-8 flex items-center gap-2 text-slate-500 hover:text-[#FF6600] transition-colors">
        <ArrowRight className="rotate-180" size={18}/> Volver al Inicio
      </button>
      
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 space-y-10">
        <div className="text-center border-b border-gray-100 pb-8">
          <div className="w-16 h-16 bg-orange-50 text-[#FF6600] rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldCheck size={32}/>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Políticas y Garantía</h1>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">1. Garantía Limitada</h3>
          <p className="text-slate-600 leading-relaxed">
            Todos nuestros equipos cuentan con garantía por defectos de fábrica. 
            La garantía no cubre daños ocasionados por mal uso, fluctuaciones eléctricas, golpes, humedad o software malintencionado.
            Es indispensable presentar la factura o nota de entrega original.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">2. Envíos Nacionales</h3>
          <p className="text-slate-600 leading-relaxed">
            Realizamos envíos a través de Zoom y Tealca. Todos los envíos viajan asegurados y a riesgo del cliente. 
            Conputodo no se hace responsable por retrasos, pérdidas o daños ocasionados por la empresa de encomiendas una vez entregado el paquete.
          </p>
        </div>

        <div className="space-y-4">
          <h3 className="text-xl font-bold text-slate-900">3. Privacidad de Datos</h3>
          <p className="text-slate-600 leading-relaxed">
            Tus datos personales (nombre, teléfono, dirección) son utilizados exclusivamente para la facturación y coordinación de entrega. 
            No compartimos tu información con terceros.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LegalPage;