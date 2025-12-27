import React, { useEffect, useState } from 'react';
import { collection, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import { Search, RefreshCw, Loader2, MapPin, Truck, ChevronDown, ChevronLeft, ChevronRight, Package, User, Phone, CreditCard } from 'lucide-react';

const OrderListPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Tasas para cálculos visuales
  const [exchangeRates, setExchangeRates] = useState({ usd: 0, bcv: 0 });

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const qs = await getDocs(collection(db, "orders"));
      // Ordenar por fecha (más reciente primero)
      const sortedOrders = qs.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setOrders(sortedOrders);
      
      // Obtener tasas para referencias
      const settings = await getDoc(doc(db, "settings", "global"));
      if(settings.exists()) setExchangeRates({ usd: settings.data().exchangeRate, bcv: settings.data().exchangeRateBCV });

    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Actualizar Estado
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { status: newStatus });
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (error) { alert("Error al actualizar estado"); }
  };

  // Filtrado y Paginación
  const filteredOrders = orders.filter(order => {
    const term = searchTerm.toLowerCase();
    return order.clientName?.toLowerCase().includes(term) || 
           order.id.toLowerCase().includes(term) || 
           order.clientCedula?.toLowerCase().includes(term);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  // Helpers de Precio
  const calculatePVP = (usd) => (!exchangeRates.usd || !exchangeRates.bcv) ? 0 : (usd * exchangeRates.usd) / exchangeRates.bcv;

  return (
    <div className="space-y-6 pb-12">
      {/* Header y Buscador */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-neutral-800">Gestión de Pedidos</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input 
              type="text" 
              placeholder="Buscar por cliente, ID, cédula..." 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full pl-10 pr-4 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:border-[#FF6600]" 
            />
          </div>
          <button onClick={fetchOrders} className="p-2 border rounded-lg hover:bg-neutral-50" title="Recargar">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Contenido Principal (Híbrido) */}
      <div className="bg-transparent md:bg-white rounded-xl md:border border-neutral-200 md:shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center"><Loader2 size={32} className="animate-spin mx-auto text-[#FF6600]"/></div>
        ) : (
          <>
            {/* VISTA MÓVIL (Cards) */}
            <div className="md:hidden grid grid-cols-1 gap-4">
                {currentOrders.map(order => (
                    <div key={order.id} className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
                        {/* Header Card */}
                        <div className="flex justify-between items-start mb-3 pb-3 border-b border-gray-50">
                            <div>
                                <span className="text-[10px] font-mono text-[#FF6600] font-bold block">#{order.id.slice(0,6)}</span>
                                <span className="text-[10px] text-neutral-400">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</span>
                            </div>
                            <div className="relative inline-block">
                                <select 
                                    value={order.status || 'pendiente'} 
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                    className={`appearance-none pl-3 pr-6 py-1 rounded text-[10px] font-bold border outline-none uppercase tracking-wider
                                    ${order.status === 'pendiente' ? 'bg-orange-50 text-orange-700 border-orange-200' : ''}
                                    ${order.status === 'completado' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                                    ${order.status === 'cancelado' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                                    `}
                                >
                                    <option value="pendiente">Pendiente</option>
                                    <option value="completado">Completado</option>
                                    <option value="cancelado">Cancelado</option>
                                </select>
                                <ChevronDown size={12} className="absolute right-1.5 top-1.5 opacity-50 pointer-events-none"/>
                            </div>
                        </div>

                        {/* Info Cliente */}
                        <div className="space-y-1 mb-4">
                            <div className="flex items-center gap-2">
                                <User size={14} className="text-neutral-400"/>
                                <span className="font-bold text-sm text-neutral-800">{order.clientName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500 pl-6">
                                <span className="font-mono bg-neutral-100 px-1 rounded">{order.clientCedula || 'N/A'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <Phone size={14} className="text-neutral-400"/>
                                <span>{order.clientContact}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-neutral-500">
                                <CreditCard size={14} className="text-neutral-400"/>
                                <span className="capitalize">{order.paymentMethod?.replace('_', ' ') || 'N/A'}</span>
                            </div>
                            {order.shippingMethod && (
                                <div className="flex items-center gap-2 text-xs mt-1">
                                    {order.shippingMethod === 'tienda' ? <MapPin size={14} className="text-[#FF6600]"/> : <Truck size={14} className="text-neutral-600"/>}
                                    <span className="capitalize font-medium text-neutral-700">{order.shippingMethod === 'nacional' ? 'Envío Nac.' : order.shippingMethod}</span>
                                </div>
                            )}
                        </div>

                        {/* Productos Resumen */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                            <div className="space-y-2">
                                {order.products?.map((p,i) => (
                                    <div key={i} className="flex justify-between items-center text-xs">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-neutral-500">{p.qty}x</span>
                                            <span className="text-neutral-700 line-clamp-1 max-w-[150px]">{p.title}</span>
                                        </div>
                                        <span className="font-medium text-neutral-900">${p.price}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Totales */}
                        <div className="flex justify-between items-end border-t border-gray-100 pt-3">
                            <div className="text-right w-full">
                                <div className="text-xl font-black text-neutral-900 leading-none mb-1">${order.totalUsd?.toFixed(2)}</div>
                                <div className="text-[10px] text-[#FF6600] font-bold mb-0.5">PVP: ${calculatePVP(order.totalUsd).toFixed(2)}</div>
                                <div className="text-[10px] text-neutral-400 font-medium">Ref: {order.totalBs?.toLocaleString('es-VE')} Bs</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* VISTA ESCRITORIO (Tabla) */}
            <div className="hidden md:block overflow-x-auto">
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
                  {currentOrders.length === 0 ? (
                    <tr><td colSpan="6" className="p-8 text-center text-neutral-400">No hay pedidos registrados.</td></tr>
                  ) : (
                    currentOrders.map(order => (
                      <tr key={order.id} className="hover:bg-neutral-50 transition-colors">
                        <td className="p-4 align-top">
                          <div className="font-mono text-xs text-[#FF6600] font-bold" title={order.id}>#{order.id.slice(0,6)}</div>
                          <div className="text-xs text-neutral-400">{new Date(order.createdAt?.seconds * 1000).toLocaleDateString()}</div>
                        </td>
                        <td className="p-4 align-top">
                          <div className="font-bold text-neutral-800">{order.clientName}</div>
                          <div className="text-xs text-neutral-500 font-mono mb-1">CI: {order.clientCedula || 'N/A'}</div>
                          <div className="text-neutral-600 text-xs">{order.clientContact}</div>
                          <div className="text-[10px] uppercase bg-neutral-100 inline-block px-1.5 py-0.5 rounded mt-1 border border-neutral-200">
                             {order.paymentMethod?.replace('_', ' ') || 'N/A'}
                          </div>
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
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
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
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="flex justify-center items-center gap-4 p-4 border-t border-gray-100 bg-white md:bg-transparent rounded-b-xl">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 border rounded-lg hover:bg-neutral-100 disabled:opacity-50"><ChevronLeft size={20}/></button>
                <span className="text-sm text-neutral-600">Página <strong>{currentPage}</strong> de <strong>{totalPages || 1}</strong></span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages || totalPages === 0} className="p-2 border rounded-lg hover:bg-neutral-100 disabled:opacity-50"><ChevronRight size={20}/></button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OrderListPage;