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
      const q = query(collection(db, COLLECTION_NAME), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error("Error al obtener productos:", error);
      throw error;
    }
  },

  /**
   * Obtiene solo productos activos y con stock (Opcional, para el StoreFront)
   * Nota: Requiere crear un índice en Firestore si combinas where() con orderBy()
   */
  getActiveProducts: async () => {
    try {
      // Filtrar por status 'active' si implementamos ese campo, por ahora traemos todos
      // y filtramos en el cliente o ajustamos según tu lógica actual de StoreFront.
      const q = query(collection(db, COLLECTION_NAME)); 
      const snapshot = await getDocs(q);
      const allProducts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Retornamos solo los que tienen stock > 0 o status activo
      return allProducts.filter(p => p.stock > 0 && p.status !== 'inactive');
    } catch (error) {
      console.error("Error al obtener productos activos:", error);
      throw error;
    }
  },

  /**
   * Crea un nuevo producto
   * @param {Object} productData 
   */
  createProduct: async (productData) => {
    try {
      // Aseguramos que los números sean números
      const cleanData = {
        ...productData,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
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
      // Limpieza de datos antes de guardar
      const cleanData = {
        ...productData,
        price: parseFloat(productData.price),
        stock: parseInt(productData.stock),
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