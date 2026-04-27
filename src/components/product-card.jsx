import { useState } from "react";
import { cn } from "../lib/utils";
import { PRECIOS } from "../lib/constants";
import { ProductModal } from "./product-modal";
import useCartStore from "../stores/useCartStore";

function ProductCard({ product, showActions = false }) {
  const [selectedWeight, setSelectedWeight] = useState("50gr");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { addToCart, cart, updateQuantity, removeFromCart } = useCartStore();

  if (!product) return null;

  const getPrice = () => {
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
    addToCart({ id: product.id, name: product.name, image: product.image, price: displayPrice, brand: product.brand }, 1, selectedWeight);
  };
  const handleIncrease = (e) => { e.stopPropagation(); updateQuantity(product.id, selectedWeight, cartItem.quantity + 1); };
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

  const hasWeights = product.tipo === "Fruta" || product.tipo === "Mix";

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
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
        <div className="relative bg-gradient-to-br from-[#f6fde8] to-[#eef8d0] flex items-center justify-center overflow-hidden"
          style={{ height: "11rem" }}>
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            onError={(e) => { e.target.style.display = "none"; }}
          />
          {/* Price badge */}
          <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-[#7a9a18] font-black text-sm px-3 py-1 rounded-full shadow-sm border border-[#95b721]/20">
            S/ {displayPrice}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col flex-1 p-4 gap-3">
          {/* Brand + Name */}
          <div>
            <p className="text-[9px] font-bold text-[#95b721]/70 uppercase tracking-widest mb-0.5">{product.brand}</p>
            <h3 className="font-bold text-sm md:text-base leading-snug line-clamp-2 text-gray-800">{product.name}</h3>
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
          {showActions && (
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
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#9ec425] to-[#8ca91f] hover:from-[#8ca91f] hover:to-[#7a9a18] text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm hover:shadow-md"
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
