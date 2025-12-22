import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';
import { orderService } from '../../services/orderService'; 

const CartDrawer = ({ 
  isOpen, 
  onClose, 
  cart, 
  onRemoveItem, 
  onClearCart, 
  totalUSD, 
  exchangeRate // Se mantiene para cálculo interno del pedido, pero no se muestra
}) => {
  const [step, setStep] = useState('cart'); 
  const [loading, setLoading] = useState(false);
  const [client, setClient] = useState({ 
    name: '', 
    cedula: '', 
    contact: '', 
    method: 'pago_movil', 
    shipping: 'tienda' 
  });
  const [confirmedOrder, setConfirmedOrder] = useState(null);

  useEffect(() => {
    function handleKeyDown(e) { if (e.key === 'Escape' && isOpen) onClose(); }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInputChange = (e) => {
    setClient({ ...client, [e.target.name]: e.target.value });
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        clientName: client.name,
        clientCedula: client.cedula,
        clientContact: client.contact,
        shippingMethod: client.shipping,
        paymentMethod: client.method,
        products: cart.map(p => ({
          id: p.id,
          title: p.title,
          qty: p.qty,
          price: p.prices.usd 
        })),
        totalUsd: totalUSD,
        totalBs: totalUSD * exchangeRate, // Se guarda para referencia contable interna
        exchangeRateSnapshot: exchangeRate,
      };

      const newOrder = await orderService.createOrder(orderData);
      
      setConfirmedOrder(newOrder);
      setStep('success');
      onClearCart(); 
    } catch (error) {
      alert("Hubo un error al procesar tu pedido. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsappRedirect = () => {
    if (!confirmedOrder) return;
    const message = `Hola Conputodo, acabo de realizar el pedido #${confirmedOrder.id}. Mi nombre es ${confirmedOrder.clientName}. Total: $${confirmedOrder.totalUsd.toFixed(2)}`;
    const phone = "584120000000"; 
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div 
      className={`fixed inset-0 z-50 bg-black/50 flex justify-end transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} 
      onClick={onClose}
    >
      <div 
        className={`w-full max-w-md bg-white h-full shadow-2xl flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">
            {step === 'cart' ? 'Tu Carrito' : step === 'form' ? 'Finalizar Compra' : '¡Pedido Exitoso!'}
          </h2>
          <button onClick={onClose} className="hover:bg-gray-200 p-1 rounded-full transition-colors">
            <X size={20}/>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          
          {step === 'cart' && (
            <>
              {cart.length === 0 ? (
                <div className="text-center py-20 text-slate-400 flex flex-col items-center">
                   <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 text-gray-300">
                     <Trash2 size={32} />
                   </div>
                   Tu carrito está vacío.
                </div>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-3 border-b border-gray-50 pb-4 last:border-0">
                      <div className="w-16 h-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0">
                        {item.images?.main && <img src={item.images.main} className="w-full h-full object-cover" alt="" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.title}</h4>
                        <div className="flex justify-between items-end mt-1">
                          <div className="text-xs text-slate-500">
                            ${item.prices.usd.toFixed(2)} x {item.qty}
                          </div>
                          <div className="font-bold text-slate-900">
                            ${(item.prices.usd * item.qty).toFixed(2)}
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => onRemoveItem(item.id)} 
                        className="text-gray-400 hover:text-red-500 self-center p-2"
                      >
                        <Trash2 size={18}/>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {step === 'form' && (
            <form id="checkout-form" onSubmit={handleSubmitOrder} className="space-y-4 animate-in slide-in-from-right duration-300">
              <div className="bg-blue-50 text-blue-800 p-3 rounded-lg text-sm mb-4">
                🔒 Tus datos se usarán solo para coordinar la entrega.
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nombre Completo</label>
                <input name="name" value={client.name} onChange={handleInputChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-[#FF6600]" placeholder="Ej: Juan Pérez" required />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Cédula / RIF</label>
                <input name="cedula" value={client.cedula} onChange={handleInputChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-[#FF6600]" placeholder="Ej: V-12345678" required />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">WhatsApp de Contacto</label>
                <input name="contact" value={client.contact} onChange={handleInputChange} className="w-full border border-gray-300 p-2.5 rounded-lg outline-none focus:border-[#FF6600]" placeholder="Ej: 0412-0000000" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Entrega</label>
                  <select name="shipping" value={client.shipping} onChange={handleInputChange} className="w-full border border-gray-300 p-2.5 rounded-lg bg-white">
                    <option value="tienda">Retiro en Tienda</option>
                    <option value="envio">Envío Nacional</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pago</label>
                  <select name="method" value={client.method} onChange={handleInputChange} className="w-full border border-gray-300 p-2.5 rounded-lg bg-white">
                    <option value="pago_movil">Pago Móvil</option>
                    <option value="zelle">Zelle / Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                  </select>
                </div>
              </div>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center py-10 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <Check size={40} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">¡Pedido Recibido!</h3>
              <p className="text-slate-500 mb-8">
                Tu orden #{confirmedOrder?.id} ha sido registrada.
                <br/>Por favor finaliza el proceso en WhatsApp.
              </p>
              <button onClick={handleWhatsappRedirect} className="bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-4 rounded-xl font-bold shadow-lg w-full flex items-center justify-center gap-2 transition-transform hover:-translate-y-1">
                Finalizar en WhatsApp
              </button>
            </div>
          )}
        </div>

        {/* Footer (Totales) */}
        {step !== 'success' && cart.length > 0 && (
          <div className="p-4 border-t bg-white safe-area-bottom">
            {/* Solo mostramos total en USD */}
            <div className="flex justify-between font-bold text-xl mb-4 text-slate-900">
              <span>Total a Pagar:</span>
              <span>${totalUSD.toFixed(2)}</span>
            </div>
            
            {step === 'cart' ? (
              <button onClick={() => setStep('form')} className="w-full bg-[#FF6600] hover:bg-orange-700 text-white py-3.5 rounded-xl font-bold shadow-lg transition-all active:scale-95">
                Continuar a Datos
              </button>
            ) : (
              <div className="flex gap-3">
                <button onClick={() => setStep('cart')} className="px-4 py-3.5 rounded-xl font-bold text-slate-600 border border-gray-200 hover:bg-gray-50" type="button">
                  Atrás
                </button>
                <button form="checkout-form" disabled={loading} className="flex-1 bg-slate-900 hover:bg-black text-white py-3.5 rounded-xl font-bold shadow-lg disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;