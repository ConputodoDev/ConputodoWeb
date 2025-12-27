import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase'; // Asegúrate de que la ruta a firebase.js sea correcta

const COLLECTION_NAME = 'products';

export const productService = {
  /**
   * Obtiene todos los productos (Para el Dashboard - incluye inactivos)
   */
  getAllProducts: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('name')); // Ojo: Verifica si tu campo es 'name' o 'title'
      // Si usas 'title' en el resto del app, aquí debería ser 'title'. 
      // Por consistencia con el archivo original dejé 'name' pero sugiero revisar si da error de ordenamiento.
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      // Si falla por falta de índice o campo inexistente, intentamos sin orden
      try {
         const qFallback = query(collection(db, COLLECTION_NAME));
         const snapshot = await getDocs(qFallback);
         return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      } catch (err2) {
         console.error("Error al obtener productos:", err2);
         throw err2;
      }
    }
  },

  /**
   * Obtiene solo productos activos y con stock
   */
  getActiveProducts: async () => {
    try {
      const q = query(collection(db, COLLECTION_NAME)); 
      const snapshot = await getDocs(q);
      const allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Retornamos solo los que tienen stock > 0 o status activo
      // Ahora soportamos que el stock raíz sea la suma de variantes
      return allProducts.filter(p => p.stock > 0 && p.status !== 'inactive');
    } catch (error) {
      console.error("Error al obtener productos activos:", error);
      throw error;
    }
  },

  /**
   * Crea un nuevo producto (Soporta Simple y Variable)
   * @param {Object} productData 
   */
  createProduct: async (productData) => {
    try {
      // Limpieza y Tipado de Datos
      const isVariable = productData.variants && productData.variants.length > 0;
      
      let finalStock = parseInt(productData.stock) || 0;
      let finalPrice = parseFloat(productData.price) || 0;

      // Si es variable, recalculamos stock total y precio base (el menor)
      let cleanVariants = [];
      if (isVariable) {
        cleanVariants = productData.variants.map(v => ({
           id: v.id || crypto.randomUUID(), // Generar ID si no tiene
           name: v.name,
           price: parseFloat(v.price),
           stock: parseInt(v.stock),
           sku: v.sku || ''
        }));

        finalStock = cleanVariants.reduce((acc, curr) => acc + curr.stock, 0);
        finalPrice = Math.min(...cleanVariants.map(v => v.price));
      }

      const cleanData = {
        ...productData,
        price: finalPrice,
        stock: finalStock,
        variants: isVariable ? cleanVariants : [], // Guardamos variantes si existen
        createdAt: new Date().toISOString()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), cleanData);
      return { id: docRef.id, ...cleanData };
    } catch (error) {
      console.error("Error al crear producto:", error);
      throw error;
    }
  },

  /**
   * Actualiza un producto existente
   * @param {string} id 
   * @param {Object} productData 
   */
  updateProduct: async (id, productData) => {
    try {
      const productRef = doc(db, COLLECTION_NAME, id);
      
      const isVariable = productData.variants && productData.variants.length > 0;
      
      let finalStock = parseInt(productData.stock) || 0;
      let finalPrice = parseFloat(productData.price) || 0;
      let cleanVariants = [];

      if (isVariable) {
        cleanVariants = productData.variants.map(v => ({
           id: v.id || crypto.randomUUID(),
           name: v.name,
           price: parseFloat(v.price),
           stock: parseInt(v.stock),
           sku: v.sku || ''
        }));
        
        finalStock = cleanVariants.reduce((acc, curr) => acc + curr.stock, 0);
        // Si hay variantes, el precio raíz puede ser el menor para mostrar "Desde $X"
        if (cleanVariants.length > 0) {
           finalPrice = Math.min(...cleanVariants.map(v => v.price));
        }
      }

      const cleanData = {
        ...productData,
        price: finalPrice,
        stock: finalStock,
        variants: isVariable ? cleanVariants : [], // Si pasamos a simple, esto borra variantes anteriores
        updatedAt: new Date().toISOString()
      };

      await updateDoc(productRef, cleanData);
      return { id, ...cleanData };
    } catch (error) {
      console.error("Error al actualizar producto:", error);
      throw error;
    }
  },

  /**
   * Elimina un producto
   * @param {string} id 
   */
  deleteProduct: async (id) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, id));
      return true;
    } catch (error) {
      console.error("Error al eliminar producto:", error);
      throw error;
    }
  }
};