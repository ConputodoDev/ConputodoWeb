import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION_NAME = 'orders';

export const orderService = {
  /**
   * Crea un nuevo pedido en la base de datos
   * @param {Object} orderData - Datos del cliente y carrito
   * @returns {Promise<Object>} - El objeto del pedido creado con su ID
   */
  createOrder: async (orderData) => {
    try {
      // Preparamos el objeto final asegurando fechas de servidor
      const newOrder = {
        ...orderData,
        status: 'pendiente', // Estado inicial
        createdAt: serverTimestamp(),
        // Podemos agregar metadatos útiles aquí (ej: user agent, fecha legible)
        dateString: new Date().toLocaleDateString('es-VE')
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), newOrder);
      
      return {
        id: docRef.id,
        ...newOrder
      };
    } catch (error) {
      console.error("Error al crear el pedido:", error);
      throw error;
    }
  }
};