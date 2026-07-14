import { useState } from "react";
import { cn } from "../lib/utils";
import { PRECIOS } from "../lib/constants";
import { ProductModal } from "./product-modal";
import useCartStore from "../stores/useCartStore";
import useAuthStore from "../stores/useAuthStore";
import useProductStore from "../stores/useProductStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { slugify } from "../lib/slugify";

function ProductCard({ product, showActions = false }) {
  const [selectedWeight, setSelectedWeight] = useState("50gr");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart, cart, updateQuantity, removeFromCart } = useCartStore();
  const { user } = useAuthStore();
  const { filters } = useProductStore();
  const navigate = useNavigate();

  if (!product) return null;

  const hasActiveFilters = !!(filters && (filters.types.length > 0 || filters.fruits.length > 0));

  // Detecta rituales/infusiones por tipo "Infusión" o por nombre
  const isRitual =
    hasActiveFilters && (
      product.tipo === "Infusión" ||
      product.tipo === "Infusiones" ||
      product.tipo?.toLowerCase().includes("infusion") ||
      product.name?.toLowerCase().includes("ritual")
    );

  // Color específico por ritual
  const getRitualTheme = () => {
    const name = product.name?.toLowerCase() || "";
    if (name.includes("calma")) return {
      bg: "linear-gradient(135deg, #8B0B0B 0%, #5a0707 100%)",
      accent: "#8B0B0B", accentDark: "#5a0707", text: "#5a0707", brand: "#8B0B0B",
    };
    if (name.includes("defensa")) return {
      bg: "linear-gradient(135deg, #8B0040 0%, #5a0028 100%)",
      accent: "#8B0040", accentDark: "#5a0028", text: "#5a0028", brand: "#8B0040",
    };
    if (name.includes("digesti")) return {
      bg: "linear-gradient(135deg, #2D8C3A 0%, #1a5c25 100%)",
      accent: "#2D8C3A", accentDark: "#1a5c25", text: "#1a5c25", brand: "#2D8C3A",
    };
    // Energía Tropical y default → ámbar dorado
    return {
      bg: "linear-gradient(135deg, #f5c842 0%, #c4870a 100%)",
      accent: "#c4870a", accentDark: "#8b5e07", text: "#6b4a07", brand: "#c4870a",
    };
  };

  // Color específico por fruta
  const getFrutaTheme = () => {
    const fruta = product.fruta || "";
    const nameLow = product.name?.toLowerCase() || "";
    switch (true) {
      case fruta === "Fresa":
        return { bg: "linear-gradient(135deg, #e8354a 0%, #b5192c 100%)", accent: "#c4202f", accentDark: "#8f1220", text: "#7a0f1c", brand: "#c4202f" };
      case fruta === "Manzana" && nameLow.includes("canela"):
        // Café canela cálido
        return { bg: "linear-gradient(135deg, #9b6a3a 0%, #6b3f1e 100%)", accent: "#8a5a2e", accentDark: "#5c3515", text: "#4a2910", brand: "#8a5a2e" };
      case fruta === "Manzana":
        return { bg: "linear-gradient(135deg, #7dc44a 0%, #4f9a28 100%)", accent: "#5aab2e", accentDark: "#3d7d1e", text: "#2e5e15", brand: "#4f9a28" };
      case fruta === "Plátano":
        return { bg: "linear-gradient(135deg, #f7d94c 0%, #d4a90d 100%)", accent: "#c49a0c", accentDark: "#8f6f08", text: "#6b5007", brand: "#c49a0c" };
      case fruta === "Papaya":
        // Naranja coral-salmón
        return { bg: "linear-gradient(135deg, #f4623a 0%, #c43518 100%)", accent: "#d44820", accentDark: "#9c2f0e", text: "#7a2610", brand: "#d44820" };
      case fruta === "Piña":
        return { bg: "linear-gradient(135deg, #f5c33a 0%, #c8910e 100%)", accent: "#c48d0e", accentDark: "#8f6608", text: "#6b4d08", brand: "#c48d0e" };
      case fruta === "Mango":
        // Naranja ámbar profundo
        return { bg: "linear-gradient(135deg, #f47a10 0%, #b84d00 100%)", accent: "#d46010", accentDark: "#9c3e00", text: "#7a3200", brand: "#d46010" };
      case fruta === "Naranja":
        // Naranja intenso vibrante
        return { bg: "linear-gradient(135deg, #ff7300 0%, #d45000 100%)", accent: "#e05800", accentDark: "#a33800", text: "#7a2c00", brand: "#e05800" };
      default:
        return null;
    }
  };

  const isFruta = hasActiveFilters && product.tipo === "Fruta" && !!getFrutaTheme();
  const frutaTheme = isFruta ? getFrutaTheme() : null;

  // Color específico por lámina
  const getLaminaTheme = () => {
    const fruta = product.fruta || "";
    switch (fruta) {
      case "Fresa":
        // Rojo vibrante
        return { bg: "linear-gradient(135deg, #e8354a 0%, #b5192c 100%)", accent: "#c4202f", accentDark: "#8f1220", text: "#7a0f1c", brand: "#c4202f" };
      case "Tamarindo":
        // Marrón caramelo cálido
        return { bg: "linear-gradient(135deg, #b5703a 0%, #7a4218 100%)", accent: "#9a5c28", accentDark: "#6b3c10", text: "#4a2a0c", brand: "#9a5c28" };
      case "Piña":
        // Lima-amarillo refrescante
        return { bg: "linear-gradient(135deg, #c8e024 0%, #90a80e 100%)", accent: "#a8c010", accentDark: "#788a08", text: "#4e5c05", brand: "#a8c010" };
      case "Coco":
        // Crema tropical suave
        return { bg: "linear-gradient(135deg, #d4a96a 0%, #a07030 100%)", accent: "#b88840", accentDark: "#7a5820", text: "#5a3c10", brand: "#b88840" };
      case "Acaí":
        // Violeta profundo
        return { bg: "linear-gradient(135deg, #6b2fa0 0%, #3d1070 100%)", accent: "#5a2090", accentDark: "#380c60", text: "#280840", brand: "#5a2090" };
      case "Maracuyá":
        // Amarillo-naranja tropical
        return { bg: "linear-gradient(135deg, #f5a820 0%, #c06800 100%)", accent: "#d88010", accentDark: "#9c5000", text: "#6a3800", brand: "#d88010" };
      case "Sandía":
        // Rojo-rosa sandía con toque verde
        return { bg: "linear-gradient(135deg, #e83458 0%, #a0082a 100%)", accent: "#cc1840", accentDark: "#8c0418", text: "#640010", brand: "#cc1840" };
      case "Papaya":
        // Durazno-naranja suave
        return { bg: "linear-gradient(135deg, #f4904a 0%, #c45820 100%)", accent: "#d47030", accentDark: "#9c4810", text: "#6a3008", brand: "#d47030" };
      case "Cacao":
        // Chocolate oscuro intenso
        return { bg: "linear-gradient(135deg, #5c2e08 0%, #3a1800 100%)", accent: "#7a4010", accentDark: "#4a2005", text: "#3a1800", brand: "#7a4010" };
      default:
        return null;
    }
  };

  const isLamina = hasActiveFilters && product.tipo?.includes("L\u00e1minas") && !!getLaminaTheme();
  const laminaTheme = isLamina ? getLaminaTheme() : null;

  const ritualTheme = isRitual ? getRitualTheme() : null;

  // Custom color overrides from the database (admin-configurable)
  const hasCustomBg = hasActiveFilters && !!product.bg_color;
  const hasCustomText = hasActiveFilters && !!product.text_color;
  const customBg = hasCustomBg ? product.bg_color : null;
  const customText = hasCustomText ? product.text_color : null;

  // Derive the active theme background for the image area
  const getCardBg = () => {
    if (customBg) return customBg;
    if (isRitual) return ritualTheme.bg;
    if (isFruta) return frutaTheme.bg;
    if (isLamina) return laminaTheme.bg;
    return 'linear-gradient(135deg, #f6fde8 0%, #eef8d0 100%)';
  };
  // Derive text color for name/brand
  const getNameColor = () => {
    if (customText) return customText;
    if (isRitual) return ritualTheme.text;
    if (isFruta) return frutaTheme.text;
    if (isLamina) return laminaTheme.text;
    return '#1f2937';
  };
  const getBrandColor = () => {
    if (customText) return customText + 'aa'; // slightly transparent
    if (isRitual) return ritualTheme.brand;
    if (isFruta) return frutaTheme.brand;
    if (isLamina) return laminaTheme.brand;
    return 'rgba(149,183,33,0.7)';
  };
  const getButtonBg = () => {
    if (customBg) return customBg;
    if (isRitual) return `linear-gradient(to right, ${ritualTheme.accent}, ${ritualTheme.accentDark})`;
    if (isFruta) return `linear-gradient(to right, ${frutaTheme.accent}, ${frutaTheme.accentDark})`;
    if (isLamina) return `linear-gradient(to right, ${laminaTheme.accent}, ${laminaTheme.accentDark})`;
    return 'linear-gradient(to right, #9ec425, #8ca91f)';
  };
  const getPriceBadgeStyle = () => {
    if (customBg) return { background: 'rgba(255,255,255,0.22)', color: customText || '#fff', borderColor: 'rgba(255,255,255,0.45)' };
    if (isRitual) return { background: 'rgba(255,255,255,0.18)', color: '#fff', borderColor: 'rgba(255,255,255,0.4)' };
    if (isFruta) return { background: 'rgba(255,255,255,0.22)', color: '#fff', borderColor: 'rgba(255,255,255,0.45)' };
    if (isLamina) return { background: 'rgba(255,255,255,0.20)', color: '#fff', borderColor: 'rgba(255,255,255,0.42)' };
    return { background: 'rgba(255,255,255,0.92)', color: '#7a9a18', borderColor: 'rgba(149,183,33,0.2)' };
  };

  const getPrice = () => {
    if (isRitual) return 10;
    const nameLow = product.name?.toLowerCase() || "";
    // Manzana con Canela y Naranja: precio fijo
    if (nameLow.includes("canela") || product.fruta === "Naranja") return product.precio || 10;
    
    // Obtener mapa de precios desde la base de datos (Neon Postgres) si existe
    let preciosMap = product.precios;
    if (typeof preciosMap === 'string') {
      try {
        preciosMap = JSON.parse(preciosMap);
      } catch (e) {}
    }
    
    if (preciosMap && typeof preciosMap === 'object' && preciosMap[selectedWeight] !== undefined) {
      return preciosMap[selectedWeight];
    }
    
    if ((product.tipo === "Fruta" || product.tipo === "Mix") && product.fruta && PRECIOS[product.fruta]) {
      return PRECIOS[product.fruta][selectedWeight] || product.precio;
    }
    if (product.tipo.includes("Láminas")) return 10;
    return product.precio;
  };

  const displayPrice = getPrice();
  const cartItem = cart.find(
    (item) => item.id === product.id && item.selectedWeight === selectedWeight
  );

  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.error("Debes iniciar sesión para agregar productos al carrito.", {
        action: {
          label: "Ingresar",
          onClick: () => navigate("/profile")
        }
      });
      return;
    }
    addToCart({ id: product.id, name: product.name, image: product.image, price: displayPrice, brand: product.brand }, 1, selectedWeight);
  };
  const handleIncrease = (e) => { 
    e.stopPropagation(); 
    if (!user) {
      toast.error("Debes iniciar sesión para agregar productos al carrito.", {
        action: {
          label: "Ingresar",
          onClick: () => navigate("/profile")
        }
      });
      return;
    }
    updateQuantity(product.id, selectedWeight, cartItem.quantity + 1); 
  };
  const handleDecrease = (e) => {
    e.stopPropagation();
    if (cartItem.quantity > 1) updateQuantity(product.id, selectedWeight, cartItem.quantity - 1);
    else removeFromCart(product.id, selectedWeight);
  };

  /* ── Subtle 3D tilt ── */
  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const rx = ((y - rect.height / 2) / (rect.height / 2)) * -6;
    const ry = ((x - rect.width  / 2) / (rect.width  / 2)) *  6;
    const gx = (x / rect.width)  * 100;
    const gy = (y / rect.height) * 100;

    card.style.transform = `perspective(1000px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-4px)`;
    card.style.boxShadow = `0 20px 40px -12px rgba(149,183,33,0.25), 0 8px 16px -8px rgba(0,0,0,0.12)`;

    const glare = card.querySelector(".card-glare");
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.18) 0%, transparent 65%)`;
      glare.style.opacity = "1";
    }
  };

  const handleMouseLeave = (e) => {
    const card = e.currentTarget;
    card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)";
    card.style.boxShadow = "0 4px 20px -4px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)";
    const glare = card.querySelector(".card-glare");
    if (glare) glare.style.opacity = "0";
  };

  const nameLow2 = product.name?.toLowerCase() || "";
  const isFixedPrice = nameLow2.includes("canela") || product.fruta === "Naranja";
  const hasWeights = (product.tipo === "Fruta" || product.tipo === "Mix") && !isFixedPrice;

  return (
    <>
      <div
        onClick={() => navigate(`/catalogo/${slugify(product.name)}`)}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          transition: "transform 0.2s ease, box-shadow 0.2s ease",
          transform: "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)",
          boxShadow: "0 4px 20px -4px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)",
          willChange: "transform",
        }}
        className="cursor-pointer relative rounded-2xl overflow-hidden bg-white border border-gray-100 flex flex-col"
      >
        {/* Glare */}
        <div
          className="card-glare pointer-events-none absolute inset-0 rounded-2xl z-10"
          style={{ opacity: 0, transition: "opacity 0.25s ease" }}
        />

        {/* Image area */}
        <div
          className="relative flex items-center justify-center overflow-hidden h-44 md:h-52 lg:h-60"
          style={{ background: getCardBg() }}
        >
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain p-3 md:p-5 transition-transform duration-300"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          {/* Price badge */}
          <div
            className="absolute top-3 right-3 backdrop-blur-sm font-black text-sm px-3 py-1 rounded-full shadow-sm border"
            style={getPriceBadgeStyle()}
          >
            S/ {displayPrice}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Brand + Name */}
          <div>
            <p
              className="text-[9px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: getBrandColor() }}
            >{product.brand}</p>
            <h3
              className="font-bold text-sm md:text-base leading-snug line-clamp-2"
              style={{ color: getNameColor() }}
            >{product.name}</h3>
          </div>

          {/* Weight selector */}
          {hasWeights && (
            <div className={`grid ${product.tipo === "Mix" ? "grid-cols-3" : "grid-cols-4"} gap-1`}>
              {(product.tipo === "Mix"
                ? ["50gr", "100gr", "250gr", "350gr", "500gr", "1kg"]
                : ["50gr", "100gr", "500gr", "1kg"]
              ).map((w) => (
                <button
                  key={w}
                  onClick={(e) => { e.stopPropagation(); setSelectedWeight(w); }}
                  className={cn(
                    "py-1 text-[10px] font-semibold rounded-lg border transition-all",
                    selectedWeight === w
                      ? "bg-[#95b721] border-[#95b721] text-white shadow-sm"
                      : "border-gray-200 text-gray-400 hover:border-[#95b721] hover:text-[#95b721] bg-white"
                  )}
                >
                  {w}
                </button>
              ))}
            </div>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          {showActions && user && (
            cartItem ? (
              <div
                className="flex items-center justify-between bg-gray-50 rounded-xl p-1 border border-gray-100"
                onClick={(e) => e.stopPropagation()}
              >
                <button onClick={handleDecrease} className="h-8 w-8 flex items-center justify-center bg-white rounded-lg shadow-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors border border-gray-100">−</button>
                <span className="font-bold text-base text-gray-800">{cartItem.quantity}</span>
                <button onClick={handleIncrease} className="h-8 w-8 flex items-center justify-center bg-[#95b721] rounded-lg shadow-sm font-bold text-white hover:bg-[#7a9a18] transition-colors">+</button>
              </div>
            ) : (
              <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
                style={{ background: getButtonBg() }}
              >
                <span>＋</span>
                <span>Añadir</span>
              </button>
            )
          )}
        </div>
      </div>

      <ProductModal product={product} isOpen={isModalOpen} onClose={setIsModalOpen} />
    </>
  );
}

export default ProductCard;
