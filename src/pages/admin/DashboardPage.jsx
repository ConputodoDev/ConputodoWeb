import React, { useEffect, useState } from 'react';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../services/firebase';
import RateWidget from '../../components/dashboard/RateWidget';
import { Loader2 } from 'lucide-react';

const DashboardPage = () => {
  const [stats, setStats] = useState({ pendingOrders: 0, activeProducts: 0 });
  const [rates, setRates] = useState({ exchangeRate: 0, exchangeRateBCV: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 1. Obtener Tasas
        const settingsSnap = await getDoc(doc(db, "settings", "global"));
        if (settingsSnap.exists()) {
          setRates(settingsSnap.data());
        } else {
          // Crear si no existen
          const defaultRates = { exchangeRate: 64.50, exchangeRateBCV: 55.00 };
          await setDoc(doc(db, "settings", "global"), defaultRates);
          setRates(defaultRates);
        }

        // 2. Obtener KPIs (Contadores simples)
        // Nota: En producción real, usar 'count()' aggregation query es más barato, pero esto sirve por ahora
        const productsSnap = await getDocs(collection(db, "products"));
        const ordersSnap = await getDocs(collection(db, "orders"));

        setStats({
          activeProducts: productsSnap.docs.filter(d => d.data().status === 'published').length,
          pendingOrders: ordersSnap.docs.filter(d => d.data().status === 'pendiente').length
        });

      } catch (error) {
        console.error("Error cargando dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-[#FF6600]" /></div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <h1 className="text-2xl font-bold text-neutral-800">Resumen de Operaciones</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KPI: Pedidos */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm border-l-4 border-l-[#FF6600]">
          <h3 className="text-neutral-500 text-sm font-medium uppercase mb-2">Pedidos Pendientes</h3>
          <p className="text-4xl font-bold text-[#FF6600]">{stats.pendingOrders}</p>
        </div>

        {/* KPI: Productos */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <h3 className="text-neutral-500 text-sm font-medium uppercase mb-2">Productos Activos</h3>
          <p className="text-4xl font-bold text-neutral-900">{stats.activeProducts}</p>
        </div>

        {/* Control de Tasas */}
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm flex flex-col justify-center gap-4">
          <div className="flex justify-between items-center">
             <span className="text-sm text-neutral-500 font-medium">Tasa Paralela</span>
             <RateWidget 
                label="Ref" 
                rate={rates.exchangeRate} 
                rateKey="exchangeRate"
                onRateUpdate={(val) => setRates(prev => ({ ...prev, exchangeRate: val }))}
                colorClass="bg-green-500"
             />
          </div>
          <div className="flex justify-between items-center">
             <span className="text-sm text-neutral-500 font-medium">Tasa BCV</span>
             <RateWidget 
                label="BCV" 
                rate={rates.exchangeRateBCV} 
                rateKey="exchangeRateBCV"
                onRateUpdate={(val) => setRates(prev => ({ ...prev, exchangeRateBCV: val }))}
                colorClass="bg-blue-500"
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;