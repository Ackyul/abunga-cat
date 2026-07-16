import { create } from 'zustand';
import useCartStore from './useCartStore';

const useAuthStore = create((set, get) => ({
  user: null,
  loading: true,
  error: null,

  // Comprobar si hay sesión activa al cargar la aplicación
  checkSession: async () => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users/session');
      if (response.ok) {
        const data = await response.json();
        if (data.authenticated) {
          useCartStore.getState().setIsLoggedIn(true);
          set({ user: data.user, loading: false });
          // Si el usuario tiene un carrito guardado en la base de datos, lo cargamos en useCartStore
          if (data.user.cart) {
            // Fusionamos el carrito local actual (si tiene algo) con el de la base de datos
            const localCart = useCartStore.getState().cart;
            if (localCart.length > 0) {
              const mergedCart = get().mergeCarts(localCart, data.user.cart);
              useCartStore.setState({ cart: mergedCart });
              // Sincronizar el carrito fusionado de vuelta a la base de datos
              await get().syncCartWithDb(mergedCart);
            } else {
              useCartStore.setState({ cart: data.user.cart });
            }
          }
        } else {
          useCartStore.getState().setIsLoggedIn(false);
          set({ user: null, loading: false });
        }
      } else {
        useCartStore.getState().setIsLoggedIn(false);
        set({ user: null, loading: false });
      }
    } catch (err) {
      console.error('Error comprobando sesión de usuario:', err);
      set({ user: null, loading: false });
    }
  },

  // Registro de usuario
  register: async (name, email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al crear la cuenta');
      }

      useCartStore.getState().setIsLoggedIn(true);
      set({ user: data.user, loading: false });

      // Si el nuevo usuario se registra y tiene productos en el carrito local,
      // sincronizamos ese carrito con su cuenta nueva en la base de datos
      const localCart = useCartStore.getState().cart;
      if (localCart.length > 0) {
        await get().syncCartWithDb(localCart);
      }
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Inicio de sesión de usuario
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      useCartStore.getState().setIsLoggedIn(true);
      set({ user: data.user, loading: false });

      // Fusionar carrito local con el carrito de la base de datos
      const localCart = useCartStore.getState().cart;
      const dbCart = data.user.cart || [];
      const mergedCart = get().mergeCarts(localCart, dbCart);
      
      // Actualizar el estado del carrito local
      useCartStore.setState({ cart: mergedCart });
      
      // Sincronizar el carrito fusionado final con la base de datos
      await get().syncCartWithDb(mergedCart);
      
      return data;
    } catch (err) {
      set({ error: err.message, loading: false });
      throw err;
    }
  },

  // Cerrar sesión
  logout: async () => {
    set({ loading: true });
    try {
      const response = await fetch('/api/users/logout', {
        method: 'POST',
      });
      if (response.ok) {
        useCartStore.getState().setIsLoggedIn(false);
        set({ user: null, loading: false });
        // Limpiamos el carrito local al cerrar sesión por privacidad
        useCartStore.getState().clearCart();
      } else {
        set({ loading: false });
      }
    } catch (err) {
      console.error('Error cerrando sesión:', err);
      set({ loading: false });
    }
  },

  // Helper para fusionar ítems del carrito local y de la base de datos
  mergeCarts: (localCart, dbCart) => {
    const merged = [...dbCart];
    localCart.forEach((localItem) => {
      const idx = merged.findIndex(
        (item) => item.id === localItem.id && item.selectedWeight === localItem.selectedWeight
      );
      if (idx > -1) {
        merged[idx].quantity += localItem.quantity;
      } else {
        merged.push(localItem);
      }
    });
    return merged;
  },

  // Helper para guardar el carrito en la base de datos
  syncCartWithDb: async (cart) => {
    try {
      const response = await fetch('/api/users/cart', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cart }),
      });
      if (!response.ok) {
        console.error('No se pudo sincronizar el carrito con la base de datos');
      }
    } catch (err) {
      console.error('Error al sincronizar el carrito con base de datos:', err);
    }
  }
}));

export default useAuthStore;
