import { useState, useEffect } from 'react';

export const useCart = () => {
  // Inicializar desde localStorage
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('conputodo_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });
  
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Persistir cambios
  useEffect(() => {
    localStorage.setItem('conputodo_cart', JSON.stringify(cart));
  }, [cart]);

  // Agregar producto (o incrementar cantidad)
  const addToCart = (product) => {
    setCart(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        return prev.map(item => 
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsCartOpen(true); // Abrir carrito automáticamente al comprar
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.removeItem('conputodo_cart');
  };

  const toggleCart = () => setIsCartOpen(!isCartOpen);

  // Totales
  const totalUSD = cart.reduce((sum, item) => sum + (item.prices.usd * item.qty), 0);
  const cartCount = cart.length;

  return {
    cart,
    isCartOpen,
    addToCart,
    removeFromCart,
    clearCart,
    toggleCart,
    setIsCartOpen,
    totalUSD,
    cartCount
  };
};