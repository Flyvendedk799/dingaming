import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  variantId: string;
  title: string;
  quantity: number;
  price: {
    amount: string;
    currencyCode: string;
  };
  image?: string;
  // Kinguin specific fields
  kinguinId?: number;
  originalPrice?: number;
}

interface CartStore {
  items: CartItem[];
  isLoading: boolean;
  
  // Actions
  addItem: (item: CartItem) => void;
  updateQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clearCart: () => void;
  setLoading: (loading: boolean) => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getKinguinItems: () => { kinguinId: number; price: number; qty: number; name: string; sellPrice: number; coverImage?: string }[];
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find(i => i.variantId === item.variantId);
        
        if (existingItem) {
          set({
            items: items.map(i =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            )
          });
        } else {
          set({ items: [...items, item] });
        }
      },

      updateQuantity: (variantId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(variantId);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.variantId === variantId ? { ...item, quantity } : item
          )
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter(item => item.variantId !== variantId)
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      setLoading: (isLoading) => set({ isLoading }),

      getTotalItems: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((sum, item) => sum + (parseFloat(item.price.amount) * item.quantity), 0);
      },

      getKinguinItems: () => {
        return get().items
          .filter(item => item.kinguinId)
          .map(item => ({
            kinguinId: item.kinguinId!,
            price: item.originalPrice || parseFloat(item.price.amount),
            sellPrice: parseFloat(item.price.amount),
            qty: item.quantity,
            name: item.title,
            coverImage: item.image
          }));
      }
    }),
    {
      name: 'dingaming-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
