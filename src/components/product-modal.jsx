import { useState } from "react";
import { Dialog, DialogContent } from "./ui/dialog";
import { PRECIOS } from "../lib/constants";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
// import useCartStore from "../stores/useCartStore";

export function ProductModal({ product, isOpen, onClose }) {
  const [selectedWeight, setSelectedWeight] = useState("50gr");
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
      return { bg: "linear-gradient(135deg, #8B0B0B 0%, #5a0707 100%)", accent: "#8B0B0B" };
    if (name.includes("defensa"))
      return { bg: "linear-gradient(135deg, #1a6b3c 0%, #0d4025 100%)", accent: "#1a6b3c" };
    if (name.includes("digesti"))
      return { bg: "linear-gradient(135deg, #b36200 0%, #7a4200 100%)", accent: "#b36200" };
    // Energía Tropical y default → ámbar dorado
    return { bg: "linear-gradient(135deg, #f5c842 0%, #c4870a 100%)", accent: "#c4870a" };
  };

  const ritualTheme = isRitual ? getRitualTheme() : null;

  const getPrice = () => {
    if (isRitual) return 10;
    if ((product.tipo === "Fruta" || product.tipo === "Mix") && product.fruta && PRECIOS[product.fruta]) {
       return PRECIOS[product.fruta][selectedWeight] || product.precio;
    }
    if (product.tipo.includes("Láminas")) {
        return 10;
    }
    return product.precio;
  };

  const displayPrice = getPrice();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 bg-white rounded-3xl h-[90vh] md:h-[600px] overflow-y-auto md:overflow-hidden flex flex-col md:flex-row">
        <div
          className="w-full md:w-1/2 h-64 md:h-full flex items-center justify-center p-8 shrink-0"
          style={isRitual ? { background: ritualTheme.bg } : { background: "#f9fafb" }}
        >
             <img 
               src={product.image} 
               alt={product.name} 
               className={cn(
                 "max-h-full max-w-full object-contain",
                 !isRitual && "mix-blend-multiply"
               )}
               onError={(e) => { e.target.style.display = 'none'; }} 
             />
        </div>

        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center space-y-4 md:space-y-8 relative">
            <div>
                <p className="text-xs md:text-sm font-bold text-gray-500 uppercase tracking-widest">{product.brand}</p>
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

            {(product.tipo === "Fruta" || product.tipo === "Mix") && (
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

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                <div>
                     <p className="text-xs md:text-sm font-bold text-gray-500 uppercase mb-1">Precio</p>
                     <p
                       className="text-3xl md:text-5xl font-black"
                       style={{ color: isRitual ? ritualTheme.accent : "#95b721" }}
                     >S/ {displayPrice}</p>
                </div>
            </div>
            
             {/* Button removed */}

        </div>
      </DialogContent>
    </Dialog>
  );
}
