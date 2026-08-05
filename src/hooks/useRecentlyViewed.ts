import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { KinguinProduct } from '@/lib/kinguin';

interface RecentlyViewedStore {
  products: KinguinProduct[];
  addProduct: (product: KinguinProduct) => void;
  clearProducts: () => void;
}

const MAX_RECENT_PRODUCTS = 10;

export const useRecentlyViewed = create<RecentlyViewedStore>()(
  persist(
    (set, get) => ({
      products: [],

      addProduct: (product) => {
        const { products } = get();
        
        // Remove if already exists
        const filtered = products.filter(p => p.kinguin_id !== product.kinguin_id);
        
        // Add to front, limit to max
        const updated = [product, ...filtered].slice(0, MAX_RECENT_PRODUCTS);
        
        set({ products: updated });
      },

      clearProducts: () => set({ products: [] }),
    }),
    {
      name: 'wgaming-recently-viewed',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
