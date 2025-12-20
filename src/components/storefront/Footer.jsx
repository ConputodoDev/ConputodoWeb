import React from 'react';
import { MapPin, ArrowRight, Instagram, Facebook } from 'lucide-react';

/**
 * Pie de página global
 * @param {Function} onNavigate - Función para navegación interna
 */
const Footer = ({ onNavigate }) => {
  return (
    <footer className="bg-neutral-900 text-white pt-16 pb-8 border-t border-neutral-800 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Columna 1: Marca */}
          <div className="md:col-span-1 space-y-4">
            <div 
              className="flex items-center gap-2 text-white font-bold text-2xl cursor-pointer"
              onClick={() => onNavigate('home')}
            >
              <div className="w-10 h-10 bg-[#FF6600] rounded-lg flex items-center justify-center">C</div> 
              Conputodo
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Tu aliado tecnológico de confianza en Maracay. Venta de equipos, servicio técnico y asesoría profesional.
            </p>
            <div className="pt-4 flex items-center gap-2 text-neutral-500 text-xs">
              <MapPin size={16}/> Maracay, Edo. Aragua
            </div>
          </div>

          {/* Columna 2: Navegación */}
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-neutral-800 pb-2 inline-block">Navegación</h4>
            <ul className="space-y-3 text-sm text-neutral-400">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-[#FF6600] transition-colors flex items-center gap-2">
                  <ArrowRight size={14}/> Inicio
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('catalog')} className="hover:text-[#FF6600] transition-colors flex items-center gap-2">
                  <ArrowRight size={14}/> Catálogo
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('contact')} className="hover:text-[#FF6600] transition-colors flex items-center gap-2">
                  <ArrowRight size={14}/> Contacto
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('legal')} className="hover:text-[#FF6600] transition-colors flex items-center gap-2">
                  <ArrowRight size={14}/> Legales
                </button>
              </li>
            </ul>
          </div>

          {/* Columna 3: Redes Conputodo */}
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-neutral-800 pb-2 inline-block">Síguenos</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-400 hover:text-pink-500 transition-colors">
                  <Instagram size={20} /> <span>@conputodo</span>
                </a>
              </li>
              <li>
                <a href="https://facebook.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-400 hover:text-blue-500 transition-colors">
                  <Facebook size={20} /> <span>Conputodo Oficial</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Columna 4: Redes Gamer */}
          <div>
            <h4 className="font-bold text-lg mb-6 border-b border-neutral-800 pb-2 inline-block">Zona Gamer</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://instagram.com" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-neutral-400 hover:text-purple-500 transition-colors">
                  <Instagram size={20} /> <span>@conputodogamer</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-neutral-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-neutral-600">
          <p>© 2025 Josep Suply, C.A. Todos los derechos reservados.</p>
          <p>Desarrollado con ❤️ en Venezuela.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;