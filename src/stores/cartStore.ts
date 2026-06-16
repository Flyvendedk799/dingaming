import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartItem {
  /** Stable cart key, e.g. `kinguin-12345`. */
  variantId: string;
  /** Kinguin product id used for server-side ordering. */
  kinguinId: number;
  title: string;
  quantity: number;
  price: {
    amount: string;
    currencyCode: string;
  };
  /** Original (pre-discount) unit price in the same currency, for "you save" display. */
  originalAmount?: string;
  image?: string;
  sku?: string;
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
  getTotalSavings: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isLoading: false,

      addItem: (item) => {
        const { items } = get();
        const existingItem = items.find((i) => i.variantId === item.variantId);

        if (existingItem) {
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, quantity: i.quantity + item.quantity }
                : i
            ),
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
          items: get().items.map((item) =>
            item.variantId === variantId ? { ...item, quantity } : item
          ),
        });
      },

      removeItem: (variantId) => {
        set({
          items: get().items.filter((item) => item.variantId !== variantId),
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
        return get().items.reduce(
          (sum, item) => sum + parseFloat(item.price.amount) * item.quantity,
          0
        );
      },

      getTotalSavings: () => {
        return get().items.reduce((sum, item) => {
          const original = item.originalAmount ? parseFloat(item.originalAmount) : 0;
          const price = parseFloat(item.price.amount);
          const diff = original - price;
          return sum + (diff > 0 ? diff * item.quantity : 0);
        }, 0);
      },
    }),
    {
      name: 'dingaming-cart',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
