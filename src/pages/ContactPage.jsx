import React, { useState } from 'react';
import { MapPin, Phone, ArrowRight, Check, Building, Mail } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../services/firebase';
import 'leaflet/dist/leaflet.css';

// Fix icono Leaflet (copiar del original si da problemas de iconos rotos)
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34] });
L.Marker.prototype.options.icon = DefaultIcon;

const ContactPage = () => {
  const [formData, setFormData] = useState({ companyName: '', companyRif: '', email: '', phone: '', message: '' });
  const [status, setStatus] = useState('idle');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await addDoc(collection(db, "wholesale_requests"), { 
        ...formData, 
        createdAt: serverTimestamp(), 
        status: 'pending' 
      });
      setStatus('success');
      setFormData({ companyName: '', companyRif: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="animate-in fade-in duration-500">
      <div className="bg-neutral-900 text-white py-20 text-center">
        <h1 className="mb-4 text-4xl font-bold">Contáctanos</h1>
        <p className="max-w-xl mx-auto text-neutral-400">Estamos ubicados en el corazón de Maracay para ofrecerte las mejores soluciones tecnológicas.</p>
      </div>

      <div className="container mx-auto px-4 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* INFO + MAPA */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-slate-900">Información de la Tienda</h2>
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><MapPin size={24}/></div>
                  {/* INFORMACION */}
                  <div>
                    <h4 className="font-bold text-slate-800">Ubicación</h4>
                    <p className="text-slate-600">Av. Bolívar, Centro Comercial Global, Local 12.<br/>Maracay, Edo. Aragua.</p>
                    {/*LINK DE GOOGLE MAPS */}
                    <a href="https://maps.app.goo.gl/mZGVGx6C4LHT69ur6" target="_blank" rel="noopener noreferrer" className="text-sm text-[#FF6600] font-bold hover:underline flex items-center gap-1 mt-1">
                      Ver en Google Maps <ArrowRight size={14} />
                    </a>
                  </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><Phone size={24}/></div>
              <div>
                <h4 className="font-bold text-slate-800">Teléfonos</h4>
                <p className="text-slate-600">+58 412-2163876</p>
              </div>
            </div>
                          <div className="flex items-start gap-4">
                              <div className="p-3 bg-orange-100 text-[#FF6600] rounded-lg"><Mail size={24}/></div>
                              <div>
                                  <h4 className="font-bold text-slate-800">Correo Electrónico</h4>
                                  <p className="text-slate-600">ventas@conputodo.com</p>
                              </div>
                          </div>
          </div>

          {/* MAPA INTERACTIVO (LEAFLET) */}
            <div className="relative z-0 w-full overflow-hidden border border-gray-200 shadow-inner h-80 rounded-2xl">
               <MapContainer 
                  center={[10.249758418955139, -67.60040315522524]} // COORDENADAS EXACTAS
                  zoom={17} 
                  scrollWheelZoom={false} 
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[10.249758418955139, -67.60040315522524]}>
                    <Popup>
                      <strong>Conputodo</strong><br />¡Te esperamos aquí!
                    </Popup>
                  </Marker>
                </MapContainer>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-xl">
          <h3 className="flex items-center gap-2 mb-2 text-xl font-bold text-slate-900"><Building size={20} className="text-[#FF6600]"/> Mayoristas</h3>
            <p className="mb-6 text-sm text-slate-500">Solicita lista de precios para distribuidores. Todos los campos son obligatorios.</p>          
          {status === 'success' ? (
            <div className="bg-green-50 text-green-700 p-6 rounded-xl text-center animate-in zoom-in">
              <Check size={24} className="mx-auto mb-2"/>
              <h4 className="font-bold">¡Mensaje Enviado!</h4>
              <p className="text-sm">Nos pondremos en contacto pronto.</p>
              <button onClick={() => setStatus('idle')} className="underline mt-4 text-sm">Enviar otro</button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF6600] outline-none" placeholder="Nombre de la Empresa" required/>
              <input type="text" name="companyRif" value={formData.companyRif} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF6600] outline-none" placeholder="RIF (J-12345678)" required/>
              <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF6600] outline-none" placeholder="Correo Electrónico" required/>
              <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF6600] outline-none" placeholder="Teléfono de Contacto" required/>
              <textarea name="message" value={formData.message} onChange={handleChange} className="w-full p-3 border rounded-lg bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#FF6600] outline-none" placeholder="¿Qué productos te interesan?" rows="3" required></textarea>
              
              <button disabled={status === 'loading'} className="w-full py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-[#FF6600] transition-colors shadow-lg">
                {status === 'loading' ? 'Enviando...' : 'Solicitar Presupuesto'}
              </button>
            </form>
          )}S
        </div>
      </div>
    </div>
  );
};

export default ContactPage;