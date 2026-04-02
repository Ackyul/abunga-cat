import { create } from "zustand";
import { fetchProducts } from "../services/api";

const useProductStore = create((set, get) => ({
  products: [],
  loading: false,
  error: null,
  visibleCount: 10,

  validateProducts: async () => {
    const { products } = get();
    if (products.length === 0) {
      await get().getProducts();
    }
  },

  getProducts: async () => {
    set({ loading: true, error: null });
    try {
      let data = await fetchProducts();
      for (let i = data.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [data[i], data[j]] = [data[j], data[i]];
      }

      data = data.map((p) => {
        let fruta = p.fruta === "Asaí" ? "Acaí" : p.fruta;
        let newImage = p.image;

        if (p.tipo === "Fruta") {
          if (fruta === "Piña") newImage = "/f-pina.png";
          else if (fruta === "Mango") newImage = "/f-mango.png";
          else if (fruta === "Manzana") newImage = "/f-manzana.png";
          else if (fruta === "Fresa") newImage = "/f-fresa.png";
          else if (fruta === "Papaya") newImage = "/f-papaya.png";
          else if (fruta === "Plátano") newImage = "/f-platano.png";
        } else if (p.tipo.includes("Láminas")) {
          if (fruta === "Acaí" || p.name.toLowerCase().includes("acai"))
            newImage = "/r-acai.png";
          else if (fruta === "Maracuyá") newImage = "/r-maracuya.png";
          else if (fruta === "Cacao") newImage = "/r-cacao.png";
          else if (fruta === "Coco") newImage = "/r-coco.png";
          else if (fruta === "Fresa") newImage = "/r-fresa.png";
          else if (fruta === "Sandía") newImage = "/r-sandia.png";
          else if (fruta === "Tamarindo") newImage = "/r-tamarindo.png";
          else if (fruta === "Papaya") newImage = "/r-papaya.png";
          else if (fruta === "Piña") newImage = "/r-pina.png";
        }

        return { ...p, fruta, image: newImage };
      });

      set({ products: data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  filters: {
    types: [],
    fruits: [],
  },

  setFilter: (category, value) =>
    set((state) => {
      const current = state.filters[category];
      const newFilters = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];

      return {
        filters: {
          ...state.filters,
          [category]: newFilters,
        },
        visibleCount: 10,
      };
    }),

  getFilteredProducts: () => {
    const { products, filters } = get();
    return products.filter((product) => {
      const typeMatch =
        filters.types.length === 0 ||
        filters.types.some((filterType) => {
          if (filterType === "Laminas") return product.tipo.includes("Láminas");
          return product.tipo === filterType;
        });

      const fruitMatch =
        filters.fruits.length === 0 || filters.fruits.includes(product.fruta);
      return typeMatch && fruitMatch;
    });
  },

  setVisibleCount: (count) =>
    set((state) => ({ visibleCount: state.visibleCount + count })),
}));

export default useProductStore;
