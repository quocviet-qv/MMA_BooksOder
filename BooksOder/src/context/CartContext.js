import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { API_URL, apiFetch as fetch } from '../constants/api';
import { useAuth } from './AuthContext';
const CartContext = createContext();
export function CartProvider({ children }) {
  const { userId, isLoggedIn } = useAuth();
  const [count, setCartCount] = useState({ userId: null, value: 0 });
  const generation = useRef(0);
  const refreshCartCount = useCallback(async (overrideUserId) => {
    const uid = overrideUserId || userId;
    if (!uid || !isLoggedIn) return;
    const request = ++generation.current;
    try {
      const response = await fetch(`${API_URL}/cart/${uid}`);
      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items) && request === generation.current) setCartCount({ userId: uid, value: items.reduce((sum, item) => sum + item.quantity, 0) });
      }
    } catch { /* A later focus or cart action retries the badge request. */ }
  }, [userId, isLoggedIn]);
  useEffect(() => {
    if (!userId || !isLoggedIn) return;
    const request = ++generation.current;
    let active = true;
    fetch(`${API_URL}/cart/${userId}`)
      .then(response => response.ok ? response.json() : null)
      .then(items => {
        if (active && request === generation.current && Array.isArray(items)) {
          setCartCount({ userId, value: items.reduce((sum, item) => sum + item.quantity, 0) });
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [userId, isLoggedIn]);
  const cartCount = isLoggedIn && count.userId === userId ? count.value : 0;
  return <CartContext.Provider value={{ cartCount, refreshCartCount }}>{children}</CartContext.Provider>;
}
export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used inside CartProvider');
  return context;
}
