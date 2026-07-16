import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isLoggedIn: false,

      setIsLoggedIn: (status) => set({ isLoggedIn: status }),

      syncCart: async (newCart) => {
        if (!get().isLoggedIn) return;
        try {
          await fetch('/api/users/cart', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cart: newCart }),
          });
        } catch (err) {
          console.error('Error syncing cart with DB:', err);
        }
      },

      addToCart: (product, quantity = 1, weight) => {
        const { cart } = get();
        const existingItemIndex = cart.findIndex(
          (item) => item.id === product.id && item.selectedWeight === weight
        );

        let newCart;
        if (existingItemIndex > -1) {
          newCart = [...cart];
          newCart[existingItemIndex].quantity += quantity;
        } else {
          newCart = [...cart, { ...product, quantity, selectedWeight: weight }];
        }
        set({ cart: newCart });
        get().syncCart(newCart);
      },

      removeFromCart: (productId, weight) => {
        const newCart = get().cart.filter(
          (item) => !(item.id === productId && item.selectedWeight === weight)
        );
        set({ cart: newCart });
        get().syncCart(newCart);
      },

      updateQuantity: (productId, weight, quantity) => {
        const newCart = get().cart.map((item) =>
          item.id === productId && item.selectedWeight === weight
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        );
        set({ cart: newCart });
        get().syncCart(newCart);
      },

      clearCart: () => {
        set({ cart: [] });
        get().syncCart([]);
      },

      getTotalPrice: () => {
        const { cart } = get();
        return cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
      },
      
      getItemsCount: () => {
          const { cart } = get();
          return cart.reduce((total, item) => total + item.quantity, 0);
      }
    }),
    {
      name: 'shopping-cart', 
      partialize: (state) => ({ cart: state.cart }), // Solo persistir el array del carrito en localStorage
    }
  )
);

export default useCartStore;
