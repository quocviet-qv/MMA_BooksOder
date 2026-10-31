import React, { createContext, useContext, useEffect, useState } from 'react';

import { API_URL } from '../constants/api';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { userId, isLoggedIn } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    if (isLoggedIn && userId) {
      refreshCartCount();
    } else {
      setCartCount(0);
    }
  }, [isLoggedIn, userId]);

  const refreshCartCount = async (overrideUserId) => {
    const uid = overrideUserId || userId;
    if (!uid) return;

    try {
      const response = await fetch(`${API_URL}/cart/${uid}`);
      if (response.ok) {
        const items = await response.json();
        if (Array.isArray(items)) {
          // Tổng số lượng cuốn sách trong giỏ
          const count = items.reduce((sum, item) => sum + (item.quantity || 1), 0);
          setCartCount(count);
        }
      }
    } catch (error) {
      // Bỏ qua lỗi kết nối âm thầm khi tải badge giỏ
    }
  };

  return (
    <CartContext.Provider value={{ cartCount, refreshCartCount, setCartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart phải được sử dụng bên trong CartProvider');
  }
  return context;
}
