import { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import useCartStore from "../stores/useCartStore";
import useAuthStore from "../stores/useAuthStore";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function ProductModal({ product, isOpen, onClose }) {
  const [selectedWeight, setSelectedWeight] = useState("50gr");
  const { addToCart, cart, updateQuantity, removeFromCart } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  if (!product) return null;

  // Detecta infusiones por tipo "Infusión" o por nombre "Ritual"
  const isRitual =
    product.tipo === "Infusión" ||
    product.tipo === "Infusiones" ||
    product.tipo?.toLowerCase().includes("infusion") ||
    product.name?.toLowerCase().includes("ritual");

  // Color específico por ritual
  const getRitualTheme = () => {
    const name = product.name?.toLowerCase() || "";
    if (name.includes("calma"))
      return { bg: "linear-gradient(135deg, #8B0B0B 0%, #5a0707 100%)", accent: "#8B0B0B", brand: "#8B0B0B" };
    if (name.includes("defensa"))
      return { bg: "linear-gradient(135deg, #8B0040 0%, #5a0028 100%)", accent: "#8B0040", brand: "#8B0040" };
    if (name.includes("digesti"))
      return { bg: "linear-gradient(135deg, #2D8C3A 0%, #1a5c25 100%)", accent: "#2D8C3A", brand: "#2D8C3A" };
    // Energía Tropical y default → ámbar dorado
    return { bg: "linear-gradient(135deg, #f5c842 0%, #c4870a 100%)", accent: "#c4870a", brand: "#c4870a" };
  };

  const getFrutaTheme = () => {
    const fruta = product.fruta || "";
    const nameLow = product.name?.toLowerCase() || "";
    switch (true) {
      case fruta === "Fresa":
        return { bg: "linear-gradient(135deg, #e8354a 0%, #b5192c 100%)", accent: "#c4202f", brand: "#c4202f" };
      case fruta === "Manzana" && nameLow.includes("canela"):
        return { bg: "linear-gradient(135deg, #9b6a3a 0%, #6b3f1e 100%)", accent: "#8a5a2e", brand: "#8a5a2e" };
      case fruta === "Manzana":
        return { bg: "linear-gradient(135deg, #7dc44a 0%, #4f9a28 100%)", accent: "#4f9a28", brand: "#4f9a28" };
      case fruta === "Plátano":
        return { bg: "linear-gradient(135deg, #f7d94c 0%, #d4a90d 100%)", accent: "#c49a0c", brand: "#c49a0c" };
      case fruta === "Papaya":
        return { bg: "linear-gradient(135deg, #f4623a 0%, #c43518 100%)", accent: "#d44820", brand: "#d44820" };
      case fruta === "Piña":
        return { bg: "linear-gradient(135deg, #f5c33a 0%, #c8910e 100%)", accent: "#c48d0e", brand: "#c48d0e" };
      case fruta === "Mango":
        return { bg: "linear-gradient(135deg, #f47a10 0%, #b84d00 100%)", accent: "#d46010", brand: "#d46010" };
      case fruta === "Naranja":
        return { bg: "linear-gradient(135deg, #ff7300 0%, #d45000 100%)", accent: "#e05800", brand: "#e05800" };
      default:
        return null;
    }
  };

  const getLaminaTheme = () => {
    const fruta = product.fruta || "";
    switch (fruta) {
      case "Fresa":
        return { bg: "linear-gradient(135deg, #e8354a 0%, #b5192c 100%)", accent: "#c4202f", brand: "#c4202f" };
      case "Tamarindo":
        return { bg: "linear-gradient(135deg, #b5703a 0%, #7a4218 100%)", accent: "#9a5c28", brand: "#9a5c28" };
      case "Piña":
        return { bg: "linear-gradient(135deg, #c8e024 0%, #90a80e 100%)", accent: "#a8c010", brand: "#a8c010" };
      case "Coco":
        return { bg: "linear-gradient(135deg, #d4a96a 0%, #a07030 100%)", accent: "#b88840", brand: "#b88840" };
      case "Acaí":
        return { bg: "linear-gradient(135deg, #6b2fa0 0%, #3d1070 100%)", accent: "#5a2090", brand: "#5a2090" };
      case "Maracuyá":
        return { bg: "linear-gradient(135deg, #f5a820 0%, #c06800 100%)", accent: "#d88010", brand: "#d88010" };
      case "Sandía":
        return { bg: "linear-gradient(135deg, #e83458 0%, #a0082a 100%)", accent: "#cc1840", brand: "#cc1840" };
      case "Papaya":
        return { bg: "linear-gradient(135deg, #f4904a 0%, #c45820 100%)", accent: "#d47030", brand: "#d47030" };
      case "Cacao":
        return { bg: "linear-gradient(135deg, #5c2e08 0%, #3a1800 100%)", accent: "#7a4010", brand: "#7a4010" };
      default:
        return null;
    }
  };

  const isFruta = product.tipo === "Fruta" && !!getFrutaTheme();
  const frutaTheme = isFruta ? getFrutaTheme() : null;

  const isLamina = product.tipo?.includes("L\u00e1minas") && !!getLaminaTheme();
  const laminaTheme = isLamina ? getLaminaTheme() : null;

  const ritualTheme = isRitual ? getRitualTheme() : null;

  const getPrice = () => {
    // 1. Intentar obtener el precio específico por peso desde los precios de la DB
    let preciosMap = product.precios;
    if (typeof preciosMap === 'string') {
      try {
        preciosMap = JSON.parse(preciosMap);
      } catch {
        // ignore
      }
    }
    
    if (preciosMap && typeof preciosMap === 'object' && preciosMap[selectedWeight] !== undefined && preciosMap[selectedWeight] !== null && preciosMap[selectedWeight] !== '') {
      return Number(preciosMap[selectedWeight]);
    }
    
    // 2. Si no hay mapa de precios por peso o no está definido el peso actual, usar el precio base de la DB
    if (product.precio !== undefined && product.precio !== null && product.precio !== '') {
      return Number(product.precio);
    }

    // 3. Fallback final
    return 10;
  };

  const displayPrice = getPrice();

  const nameLow2 = product.name?.toLowerCase() || "";
  const isFixedPrice = nameLow2.includes("canela") || product.fruta === "Naranja";
  const hasWeights = (product.tipo === "Fruta" || product.tipo === "Mix") && !isFixedPrice;

  const cartItem = cart.find(
    (item) => item.id === product.id && item.selectedWeight === selectedWeight
  );

  const handleAddToCart = () => {
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
  
  const handleIncrease = () => {
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
  
  const handleDecrease = () => {
    if (cartItem.quantity > 1) {
      updateQuantity(product.id, selectedWeight, cartItem.quantity - 1);
    } else {
      removeFromCart(product.id, selectedWeight);
    }
  };

  const getButtonBg = () => {
    if (isRitual) return ritualTheme.accent;
    if (isFruta) return frutaTheme.accent;
    if (isLamina) return laminaTheme.accent;
    return '#95b721';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-white rounded-3xl h-[90vh] md:h-[600px] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
        <div
          className="w-full md:w-1/2 h-64 md:h-full flex items-center justify-center p-8 shrink-0 animate-gradient-shift"
          style={
            isRitual ? { background: ritualTheme.bg }
            : isFruta ? { background: frutaTheme.bg }
            : isLamina ? { background: laminaTheme.bg }
            : { background: "#f9fafb" }
          }
        >
             <img 
               src={product.image} 
               alt={product.name} 
               className={cn(
                 "max-h-full max-w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-105",
                 !isRitual && !isFruta && !isLamina && "mix-blend-multiply"
               )}
               onError={(e) => { e.target.style.display = 'none'; }} 
             />
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-4 md:space-y-8 relative">
            <div>
                <p 
                  className="text-xs md:text-sm font-bold uppercase tracking-widest"
                  style={{
                    color: isRitual ? ritualTheme.brand
                    : isFruta ? frutaTheme.brand
                    : isLamina ? laminaTheme.brand
                    : "rgba(149,183,33,0.7)"
                  }}
                >{product.brand}</p>
                <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 leading-tight">{product.name}</h2>
                <p className="text-gray-500 mt-2 md:mt-4 text-xs md:text-base leading-relaxed">
                    {isRitual
                        ? "Infusión herbal 100% natural, elaborada con ingredientes seleccionados para relajar tu mente y despertar tu energía. Sin colorantes ni conservantes."
                        : product.tipo.includes("Láminas") 
                            ? "Deliciosas láminas de fruta deshidratada 100% natural, sin azúcares añadidos ni conservantes. Perfecta para un snack saludable en cualquier momento del día."
                            : "Deliciosa fruta deshidratada 100% natural, sin azúcares añadidos ni conservantes. Perfecta para un snack saludable en cualquier momento del día."
                    }
                </p>
            </div>

            {hasWeights && (
                <div className="space-y-2 md:space-y-4">
                    <p className="text-xs md:text-sm font-bold text-gray-900 uppercase">Selecciona el peso:</p>
                    <div className="flex gap-2 md:gap-4 overflow-x-auto pb-2">
                        {(product.tipo === "Mix" 
                            ? ["50gr", "100gr", "250gr", "350gr", "500gr", "1kg"] 
                            : ["50gr", "100gr", "500gr", "1kg"]
                        ).map((weight) => (
                            <button 
                                key={weight}
                                onClick={() => setSelectedWeight(weight)}
                                className={cn(
                                    "flex-1 py-2 md:py-4 text-sm md:text-xl font-bold rounded-xl md:rounded-2xl border-2 transition-all whitespace-nowrap min-w-[80px]",
                                    selectedWeight === weight
                                    ? "border-[#95b721] bg-[#95b721] text-white shadow-lg scale-105" 
                                    : "border-gray-200 text-gray-500 hover:border-[#95b721] hover:text-[#95b721]"
                                )}
                            >
                                {weight}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto gap-4">
                <div>
                     <p className="text-xs md:text-sm font-bold text-gray-500 uppercase mb-1">Precio</p>
                     <p
                       className="text-3xl md:text-5xl font-black"
                       style={{
                         color: isRitual ? ritualTheme.accent
                         : isFruta ? frutaTheme.accent
                         : isLamina ? laminaTheme.accent
                         : "#95b721"
                       }}
                     >S/ {displayPrice}</p>
                </div>

                {user && (
                  <div className="w-1/2 min-w-[150px]">
                    {cartItem ? (
                      <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-1.5 border border-gray-100">
                        <button 
                          onClick={handleDecrease} 
                          className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors border border-gray-100"
                        >−</button>
                        <span className="font-extrabold text-lg text-gray-800">{cartItem.quantity}</span>
                        <button 
                          onClick={handleIncrease} 
                          className="h-10 w-10 flex items-center justify-center text-white rounded-xl shadow-sm font-bold hover:opacity-90 transition-opacity"
                          style={{ background: getButtonBg() }}
                        >+</button>
                      </div>
                    ) : (
                      <button
                        onClick={handleAddToCart}
                        className="w-full flex items-center justify-center gap-2 text-white font-extrabold py-3.5 rounded-2xl text-base transition-all shadow-md hover:shadow-lg transform active:scale-95 animate-fade-in"
                        style={{ background: getButtonBg() }}
                      >
                        <span>＋</span>
                        <span>Añadir al Carrito</span>
                      </button>
                    )}
                  </div>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
