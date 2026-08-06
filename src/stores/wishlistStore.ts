import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { KinguinProduct } from '@/lib/kinguin';

/**
 * Wishlist.
 *
 * The heart buttons on the product card, the mobile card and the quick view
 * each held their own `useState(false)`, toasted "Tilføjet til ønskelisten"
 * and forgot the moment you navigated away. Nothing was stored and no page
 * ever listed the result, so the feature was an animation.
 *
 * It persists to localStorage like the recently-viewed list, so it survives
 * reloads for signed-out visitors too — a wishlist that requires an account
 * before it remembers anything is the one thing guaranteed not to bring
 * someone back.
 */
interface WishlistStore {
  items: KinguinProduct[];
  toggle: (product: KinguinProduct) => boolean;
  remove: (kinguinId: number) => void;
  clear: () => void;
  has: (kinguinId: number) => boolean;
}

const MAX_ITEMS = 100;

export const useWishlist = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],

      /** Returns true when the product ends up on the list. */
      toggle: (product) => {
        const { items } = get();
        const exists = items.some((p) => p.kinguin_id === product.kinguin_id);
        if (exists) {
          set({ items: items.filter((p) => p.kinguin_id !== product.kinguin_id) });
          return false;
        }
        set({ items: [product, ...items].slice(0, MAX_ITEMS) });
        return true;
      },

      remove: (kinguinId) =>
        set({ items: get().items.filter((p) => p.kinguin_id !== kinguinId) }),

      clear: () => set({ items: [] }),

      has: (kinguinId) => get().items.some((p) => p.kinguin_id === kinguinId),
    }),
    {
      name: 'wgaming-wishlist',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

/**
 * Subscribing to the array rather than calling `has()` matters: `has` reads
 * from a getter, so a component using it would not re-render when the list
 * changes and the heart would not fill until something else forced a paint.
 */
export const useIsWishlisted = (kinguinId?: number | null): boolean =>
  useWishlist((s) => (kinguinId ? s.items.some((p) => p.kinguin_id === kinguinId) : false));
