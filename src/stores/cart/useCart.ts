'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  productId: number;
  variantId?: number;
  name: string;
  variantName?: string;
  priceCents: number;
  quantity: number;
  imageUrl?: string;
}

interface CartState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'id'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  syncWithServer: () => Promise<void>;
}

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: async (item) => {
        const items = get().items;
        const existingIndex = items.findIndex(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );

        let updatedItems: CartItem[];
        if (existingIndex >= 0) {
          // Update quantity if item already exists
          updatedItems = [...items];
          updatedItems[existingIndex] = {
            ...updatedItems[existingIndex],
            quantity: updatedItems[existingIndex].quantity + item.quantity,
          };
        } else {
          // Add new item
          const newItem: CartItem = {
            ...item,
            id: `${item.productId}-${item.variantId || 'default'}-${Date.now()}`,
          };
          updatedItems = [...items, newItem];
        }
        
        set({ items: updatedItems });

        // Sync with server if authenticated
        try {
          const response = await fetch('/api/cart', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }),
          });
          
          if (!response.ok && response.status !== 401) {
            // If not auth error, sync back from server
            await get().syncWithServer();
          }
        } catch (error) {
          // Silently fail - cart still works locally
          console.warn('Failed to sync cart to server:', error);
        }
      },

      removeItem: async (id) => {
        const items = get().items;
        const itemToRemove = items.find((item) => item.id === id);
        const updatedItems = items.filter((item) => item.id !== id);
        set({ items: updatedItems });

        // Sync with server if authenticated
        if (itemToRemove) {
          try {
            await fetch(`/api/cart?itemId=${id}`, {
              method: 'DELETE',
              credentials: 'include',
            });
          } catch (error) {
            console.warn('Failed to remove item from server:', error);
          }
        }
      },

      updateQuantity: async (id, quantity) => {
        if (quantity <= 0) {
          await get().removeItem(id);
          return;
        }
        
        const updatedItems = get().items.map((item) =>
          item.id === id ? { ...item, quantity } : item
        );
        set({ items: updatedItems });

        // Sync with server if authenticated
        try {
          await fetch('/api/cart', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ itemId: id, quantity }),
          });
        } catch (error) {
          console.warn('Failed to update quantity on server:', error);
        }
      },

      clearCart: () => {
        set({ items: [] });
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.priceCents * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      syncWithServer: async () => {
        // Sync cart with PocketBase if user is authenticated
        try {
          const response = await fetch('/api/cart', {
            credentials: 'include',
          });
          if (response.ok) {
            const data = await response.json();
            if (data.items && Array.isArray(data.items)) {
              set({ items: data.items });
            }
          }
        } catch (error) {
          console.error('Failed to sync cart:', error);
          // Don't throw, just log - allow offline cart usage
        }
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
