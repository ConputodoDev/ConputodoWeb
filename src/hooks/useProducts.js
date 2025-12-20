import { useState, useEffect } from 'react';
import { productService } from '../services/productService'; // Asegúrate de haber creado este archivo antes

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Función para recargar productos manualmente si fuera necesario
  const fetchProducts = async () => {
    setLoading(true);
    try {
      // Usamos getActiveProducts para el StoreFront (solo stock y activos)
      const data = await productService.getActiveProducts();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error("Error en useProducts:", err);
      setError(err.message || 'Error al cargar productos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return { products, loading, error, refreshProducts: fetchProducts };
};