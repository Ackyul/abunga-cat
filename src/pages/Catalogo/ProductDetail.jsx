import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Loader2, Sparkles } from "lucide-react";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useProductStore from "../../stores/useProductStore";
import useCartStore from "../../stores/useCartStore";
import useAuthStore from "../../stores/useAuthStore";
import { PRECIOS } from "../../lib/constants";
import { slugify } from "../../lib/slugify";
import { cn } from "../../lib/utils";
import { toast } from "sonner";

export default function ProductDetail() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { products, loading, error, validateProducts } = useProductStore();
  const { addToCart, cart, updateQuantity, removeFromCart } = useCartStore();
  const { user } = useAuthStore();
  const [selectedWeight, setSelectedWeight] = useState("50gr");

  useEffect(() => {
    validateProducts();
  }, []);

  // Find the product by checking slug
  const getProduct = () => {
    if (!products || products.length === 0) return null;
    
    // Mix de Frutas Deshidratadas (Special inline product from Catalog page)
    if (productSlug === "mix-de-frutas-deshidratadas" || productSlug === "mix-de-frutas") {
      return {
        id: "mixtos-especial",
        name: "Mix de Frutas Deshidratadas",
        tipo: "Mix",
        fruta: "Mix",
        image: "/mixtos.png",
        precio: 25,
        brand: "Abunga",
        visible: true,
        bg_color: null,
        text_color: null,
        precios: PRECIOS["Mix"]
      };
    }

    return products.find(p => slugify(p.name) === productSlug);
  };

  const product = getProduct();

  // If loading and no product is resolved yet
  if (loading && !product) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <header className="bg-[#95b721] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
          <Link to="/" className="shrink-0">
            <img src="/logo-abunga.png" alt="Abunga" className="w-16 h-16 rounded-full object-cover shadow-lg border-[3px] border-white/20" />
          </Link>
          <Navbar />
        </header>
        <div className="flex flex-col items-center justify-center p-24 grow">
          <Loader2 className="h-12 w-12 animate-spin text-[#95b721] mb-4" />
          <p className="text-gray-500 font-medium">Cargando detalles del producto...</p>
        </div>
        <Footer />
      </div>
    );
  }

  // If product not found
  if (!product && !loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <header className="bg-[#95b721] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
          <Link to="/" className="shrink-0">
            <img src="/logo-abunga.png" alt="Abunga" className="w-16 h-16 rounded-full object-cover shadow-lg border-[3px] border-white/20" />
          </Link>
          <Navbar />
        </header>
        <div className="flex flex-col items-center justify-center p-24 grow text-center">
          <p className="text-red-500 font-bold text-2xl mb-4">Producto no encontrado</p>
          <p className="text-gray-500 mb-8 max-w-md">Lo sentimos, no pudimos encontrar el producto que buscas en nuestro catálogo.</p>
          <Link to="/catalogo" className="bg-[#95b721] hover:bg-[#84a31d] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Volver al Catálogo
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Theme styling (Copied logic from ProductCard)
  const isRitual =
    product.tipo === "Infusión" ||
    product.tipo === "Infusiones" ||
    product.tipo?.toLowerCase().includes("infusion") ||
    product.name?.toLowerCase().includes("ritual");

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
    return {
      bg: "linear-gradient(135deg, #f5c842 0%, #c4870a 100%)",
      accent: "#c4870a", accentDark: "#8b5e07", text: "#6b4a07", brand: "#c4870a",
    };
  };

  const getFrutaTheme = () => {
    const fruta = product.fruta || "";
    const nameLow = product.name?.toLowerCase() || "";
    switch (true) {
      case fruta === "Fresa":
        return { bg: "linear-gradient(135deg, #e8354a 0%, #b5192c 100%)", accent: "#c4202f", accentDark: "#8f1220", text: "#7a0f1c", brand: "#c4202f" };
      case fruta === "Manzana" && nameLow.includes("canela"):
        return { bg: "linear-gradient(135deg, #9b6a3a 0%, #6b3f1e 100%)", accent: "#8a5a2e", accentDark: "#5c3515", text: "#4a2910", brand: "#8a5a2e" };
      case fruta === "Manzana":
        return { bg: "linear-gradient(135deg, #7dc44a 0%, #4f9a28 100%)", accent: "#5aab2e", accentDark: "#3d7d1e", text: "#2e5e15", brand: "#4f9a28" };
      case fruta === "Plátano":
        return { bg: "linear-gradient(135deg, #f7d94c 0%, #d4a90d 100%)", accent: "#c49a0c", accentDark: "#8f6f08", text: "#6b5007", brand: "#c49a0c" };
      case fruta === "Papaya":
        return { bg: "linear-gradient(135deg, #f4623a 0%, #c43518 100%)", accent: "#d44820", accentDark: "#9c2f0e", text: "#7a2610", brand: "#d44820" };
      case fruta === "Piña":
        return { bg: "linear-gradient(135deg, #f5c33a 0%, #c8910e 100%)", accent: "#c48d0e", accentDark: "#8f6608", text: "#6b4d08", brand: "#c48d0e" };
      case fruta === "Mango":
        return { bg: "linear-gradient(135deg, #f47a10 0%, #b84d00 100%)", accent: "#d46010", accentDark: "#9c3e00", text: "#7a3200", brand: "#d46010" };
      case fruta === "Naranja":
        return { bg: "linear-gradient(135deg, #ff7300 0%, #d45000 100%)", accent: "#e05800", accentDark: "#a33800", text: "#7a2c00", brand: "#e05800" };
      default:
        return null;
    }
  };

  const getLaminaTheme = () => {
    const fruta = product.fruta || "";
    switch (fruta) {
      case "Fresa":
        return { bg: "linear-gradient(135deg, #e8354a 0%, #b5192c 100%)", accent: "#c4202f", accentDark: "#8f1220", text: "#7a0f1c", brand: "#c4202f" };
      case "Tamarindo":
        return { bg: "linear-gradient(135deg, #b5703a 0%, #7a4218 100%)", accent: "#9a5c28", accentDark: "#6b3c10", text: "#4a2a0c", brand: "#9a5c28" };
      case "Piña":
        return { bg: "linear-gradient(135deg, #c8e024 0%, #90a80e 100%)", accent: "#a8c010", accentDark: "#788a08", text: "#4e5c05", brand: "#a8c010" };
      case "Coco":
        return { bg: "linear-gradient(135deg, #d4a96a 0%, #a07030 100%)", accent: "#b88840", accentDark: "#7a5820", text: "#5a3c10", brand: "#b88840" };
      case "Acaí":
        return { bg: "linear-gradient(135deg, #6b2fa0 0%, #3d1070 100%)", accent: "#5a2090", accentDark: "#380c60", text: "#280840", brand: "#5a2090" };
      case "Maracuyá":
        return { bg: "linear-gradient(135deg, #f5a820 0%, #c06800 100%)", accent: "#d88010", accentDark: "#9c5000", text: "#6a3800", brand: "#d88010" };
      case "Sandía":
        return { bg: "linear-gradient(135deg, #e83458 0%, #a0082a 100%)", accent: "#cc1840", accentDark: "#8c0418", text: "#640010", brand: "#cc1840" };
      case "Papaya":
        return { bg: "linear-gradient(135deg, #f4904a 0%, #c45820 100%)", accent: "#d47030", accentDark: "#9c4810", text: "#6a3008", brand: "#d47030" };
      case "Cacao":
        return { bg: "linear-gradient(135deg, #5c2e08 0%, #3a1800 100%)", accent: "#7a4010", accentDark: "#4a2005", text: "#3a1800", brand: "#7a4010" };
      default:
        return null;
    }
  };

  const isFruta = product.tipo === "Fruta" && !!getFrutaTheme();
  const frutaTheme = isFruta ? getFrutaTheme() : null;
  const isLamina = product.tipo?.includes("Láminas") && !!getLaminaTheme();
  const laminaTheme = isLamina ? getLaminaTheme() : null;
  const ritualTheme = isRitual ? getRitualTheme() : null;

  const customBg = product.bg_color;
  const customText = product.text_color;

  const getDetailBg = () => {
    if (customBg) return customBg;
    if (isRitual) return ritualTheme.bg;
    if (isFruta) return frutaTheme.bg;
    if (isLamina) return laminaTheme.bg;
    return 'linear-gradient(135deg, #f6fde8 0%, #eef8d0 100%)';
  };

  const getBrandColor = () => {
    if (customText) return customText + 'aa';
    if (isRitual) return ritualTheme.brand;
    if (isFruta) return frutaTheme.brand;
    if (isLamina) return laminaTheme.brand;
    return 'rgba(149,183,33,0.7)';
  };

  const getNameColor = () => {
    if (customText) return customText;
    if (isRitual) return ritualTheme.text;
    if (isFruta) return frutaTheme.text;
    if (isLamina) return laminaTheme.text;
    return '#1f2937';
  };

  const getButtonBg = () => {
    if (customBg) return customBg;
    if (isRitual) return `linear-gradient(to right, ${ritualTheme.accent}, ${ritualTheme.accentDark})`;
    if (isFruta) return `linear-gradient(to right, ${frutaTheme.accent}, ${frutaTheme.accentDark})`;
    if (isLamina) return `linear-gradient(to right, ${laminaTheme.accent}, ${laminaTheme.accentDark})`;
    return 'linear-gradient(to right, #9ec425, #8ca91f)';
  };

  const getPrice = () => {
    if (isRitual) return 10;
    const nameLow = product.name?.toLowerCase() || "";
    if (nameLow.includes("canela") || product.fruta === "Naranja") return product.precio || 10;
    
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

  const displayPrice = Number(getPrice());

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
    toast.success(`${product.name} (${selectedWeight}) añadido al pedido.`);
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
      toast.info("Producto retirado del pedido.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ── HEADER ── */}
      <header className="bg-[#95b721] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
        <div className="flex items-center gap-4 z-10">
          <Link to="/" className="shrink-0 relative">
            <img 
              src="/logo-abunga.png" 
              alt="Abunga Logo" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg border-[3px] border-white/20 hover:scale-105 transition-transform"
            />
          </Link>
          <div className="bg-white px-8 py-3 rounded-2xl shadow-md hidden xl:block border-2 border-black/10">
            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-black uppercase">Catálogo</h1>
          </div>
        </div>
        
        <Navbar />

        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <div className="h-1.5 bg-[#e24052]"></div>
          <div className="h-1.5 bg-[#d08635]"></div>
          <div className="h-1.5 bg-[#e3c561]"></div>
        </div>
      </header>

      {/* ── CUERPO PRINCIPAL ── */}
      <main className="container mx-auto px-4 py-12 max-w-6xl grow flex flex-col gap-6">
        {/* Botón de retorno */}
        <div>
          <Link 
            to="/catalogo" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#95b721] font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver al Catálogo</span>
          </Link>
        </div>

        <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
          {/* Columna Izquierda: Imagen con Fondo del Tema */}
          <div 
            className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-12 relative shrink-0 animate-gradient-shift"
            style={{ background: getDetailBg() }}
          >
            <img 
              src={product.image} 
              alt={product.name} 
              className={cn(
                "max-h-[300px] md:max-h-[400px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500",
                !isRitual && !isFruta && !isLamina && "mix-blend-multiply"
              )}
              onError={(e) => { e.target.src = "/logo-abunga.png"; }}
            />
          </div>

          {/* Columna Derecha: Detalles de compra */}
          <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-6">
            <div>
              <span 
                className="text-xs font-black uppercase tracking-widest block text-left"
                style={{ color: getBrandColor() }}
              >
                {product.brand} • {product.tipo}
              </span>
              <h2 
                className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1 leading-tight text-left"
                style={{ color: getNameColor() }}
              >
                {product.name}
              </h2>
            </div>

            {/* Separador */}
            <div className="h-px bg-gray-100 w-full"></div>

            {/* Selector de pesos */}
            {hasWeights && (
              <div className="space-y-3 text-left">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
                  Selecciona la presentación:
                </span>
                <div className="flex flex-wrap gap-2">
                  {(product.tipo === "Mix"
                    ? ["50gr", "100gr", "250gr", "350gr", "500gr", "1kg"]
                    : ["50gr", "100gr", "500gr", "1kg"]
                  ).map((w) => (
                    <button
                      key={w}
                      onClick={() => setSelectedWeight(w)}
                      className={cn(
                        "px-4 py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer",
                        selectedWeight === w
                          ? "bg-[#95b721] border-[#95b721] text-white shadow-md hover:scale-[1.02]"
                          : "border-gray-200 text-gray-500 hover:border-[#95b721] hover:text-[#95b721] bg-white"
                      )}
                    >
                      {w}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Precio */}
            <div className="flex flex-col text-left gap-1">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Precio:</span>
              <span className="text-4xl font-black text-gray-900">
                S/ {displayPrice.toFixed(2)}
              </span>
            </div>

            {/* Botón de compra / Controles de carrito */}
            <div className="pt-2">
              {cartItem ? (
                <div className="flex items-center justify-between bg-gray-50 rounded-2xl p-2 border border-gray-100 max-w-xs shadow-inner">
                  <button 
                    onClick={handleDecrease}
                    className="h-11 w-11 flex items-center justify-center bg-white rounded-xl shadow-md font-black text-gray-600 hover:bg-gray-100 transition-all border border-gray-100 cursor-pointer active:scale-95 text-lg"
                  >
                    −
                  </button>
                  <span className="font-extrabold text-xl text-gray-800">{cartItem.quantity}</span>
                  <button 
                    onClick={handleIncrease}
                    className="h-11 w-11 flex items-center justify-center bg-[#95b721] rounded-xl shadow-md font-black text-white hover:bg-[#84a31d] transition-all cursor-pointer active:scale-95 text-lg"
                  >
                    +
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleAddToCart}
                  className="w-full md:max-w-xs flex items-center justify-center gap-2 text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer active:scale-95 text-base border-none outline-none"
                  style={{ background: getButtonBg() }}
                >
                  <ShoppingCart className="w-5 h-5" />
                  <span>Añadir al Pedido</span>
                </button>
              )}
            </div>

            {/* Separador */}
            <div className="h-px bg-gray-100 w-full"></div>

            {/* Descripción y propiedades */}
            <div className="space-y-4 text-left">
              <div>
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Descripción del Producto</h4>
                <p className="text-gray-600 leading-relaxed text-sm">
                  {product.description || "Snacks deliciosos y deshidratados de forma natural, perfectos para disfrutar a cualquier hora del día y llevar un estilo de vida saludable y lleno de energía."}
                </p>
              </div>

              {/* Badges de calidad */}
              <div className="flex flex-wrap gap-2 pt-2">
                <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-bold px-3 py-1 rounded-full border border-emerald-100">
                  🍓 100% Natural
                </span>
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-bold px-3 py-1 rounded-full border border-amber-100">
                  ⚡ Sin Azúcar Añadida
                </span>
                <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 text-xs font-bold px-3 py-1 rounded-full border border-sky-100">
                  ✓ Alto en Fibra
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
