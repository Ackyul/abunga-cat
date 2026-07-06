import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, ShoppingBag, Percent, Smile, Calendar, ShoppingCart, Info, CheckCircle } from "lucide-react";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useCartStore from "../../stores/useCartStore";
import useAuthStore from "../../stores/useAuthStore";
import { toast } from "sonner";
import { slugify } from "../../lib/slugify";

// Definición de los 5 productos especiales de CyberDays
export const CYBER_PRODUCTS = [
  {
    id: "cyber-1",
    name: "Combo 1",
    brand: "Abunga Especial",
    originalPrice: 78.00,
    price: 65.00,
    discount: "17%",
    unlockDay: 6, // 6 de Julio
    image: "/cyberdays-combo1.jpg",
    weight: "Combo",
    description: "1 Mix de 250 grs. S/ 36.00\n1 sobre de Macanela s/ 10.00\n1 sobre de naranjas deshidratadas s/ 10.00\n1 sobre de infusion (ritual a escoger) s/ 12.00\n1 sobre de láminas de frutas sabor a escoger s/ 10.00\nPrecio normal s/ 78.00\nPrecio cyber. S/ 65.00 soles"
  },
  {
    id: "cyber-2",
    name: "Láminas Exóticas Tamarindo-Mango Cyber",
    brand: "Abunga Especial",
    originalPrice: 18.00,
    price: 9.90,
    discount: "45%",
    unlockDay: 7, // 7 de Julio
    image: null,
    weight: "100gr",
    description: "Sabor agridulce intenso. Una combinación tropical totalmente deshidratada y sin azúcar añadida."
  },
  {
    id: "cyber-3",
    name: "Ritual Defensa Antioxidante Cyber",
    brand: "Abunga Especial",
    originalPrice: 12.00,
    price: 7.90,
    discount: "34%",
    unlockDay: 8, // 8 de Julio
    image: null,
    weight: "100gr",
    description: "Infusión premium a base de fresa, arándanos deshidratados y hojas seleccionadas para tu inmunidad."
  },
  {
    id: "cyber-4",
    name: "Piña Deshidratada Premium Cyber",
    brand: "Abunga Especial",
    originalPrice: 16.00,
    price: 8.90,
    discount: "44%",
    unlockDay: 9, // 9 de Julio
    image: null,
    weight: "100gr",
    description: "Rodajas de piña seleccionadas de la mejor calidad, dulces y con textura ideal."
  },
  {
    id: "cyber-5",
    name: "Mega Pack Familiar Snacks Cyber",
    brand: "Abunga Especial",
    originalPrice: 35.00,
    price: 19.90,
    discount: "43%",
    unlockDay: 10, // 10 de Julio
    image: null,
    weight: "Cyber-Pack",
    description: "El combo definitivo con todos nuestros snacks más solicitados para compartir en casa."
  }
];

export default function CyberDays() {
  const { addToCart, cart, updateQuantity } = useCartStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();

  // Obtener fecha del sistema o simulada (?simDay=X)
  const getSimulatedDate = () => {
    const params = new URLSearchParams(window.location.search);
    const simDay = params.get("simDay");
    if (simDay) {
      const day = parseInt(simDay, 10);
      if (!isNaN(day) && day >= 1 && day <= 31) {
        return new Date(2026, 6, day); // Julio es el mes 6 (0-indexed)
      }
    }
    return new Date();
  };

  const [currentDate, setCurrentDate] = useState(getSimulatedDate());
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("simDay")) {
      setIsSimulated(true);
    }
    setCurrentDate(getSimulatedDate());
  }, [window.location.search]);

  // Determinar si un producto está desbloqueado
  const checkUnlocked = (unlockDay) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 6 = Julio
    const date = currentDate.getDate();

    if (year > 2026) return true;
    if (year === 2026) {
      if (month > 6) return true; // Agosto o posterior
      if (month === 6) {
        return date >= unlockDay;
      }
    }
    return false;
  };

  // Agregar al carrito
  const handleAddToCart = (product) => {
    if (!user) {
      toast.error("Debes iniciar sesión para agregar productos al carrito.", {
        action: {
          label: "Ingresar",
          onClick: () => navigate("/profile")
        }
      });
      return;
    }

    addToCart(
      {
        id: product.id,
        name: product.name,
        image: product.image || "/logo-abunga.png", // Fallback si no hay imagen aún
        price: product.price,
        brand: product.brand
      },
      1,
      product.weight
    );
    toast.success(`${product.name} agregado al pedido.`);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* ── HEADER ── */}
      <header className="bg-linear-to-r from-[#8ca91f] to-[#9ec425] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative gap-4 overflow-hidden shrink-0">
        {/* Decoraciones de fondo flotantes */}
        <div className="absolute top-10 left-10 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-5 right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="flex items-center gap-4 z-10">
          <Link to="/" className="shrink-0 relative">
            <img 
              src="/logo-abunga.png" 
              alt="Abunga Logo" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-2xl border-4 border-white/40 hover:scale-105 transition-transform"
            />
          </Link>

          {/* CyberDays Logo */}
          <div className="hidden xl:flex items-center justify-center bg-white/95 backdrop-blur-md px-8 py-4 rounded-2xl shadow-2xl border border-white/20">
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-gray-900 uppercase leading-none">
              Cyber<span className="text-[#e24052]">Days</span>
            </h1>
          </div>
        </div>

        <Navbar />

        {/* Rayas de separación estilo Abunga */}
        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <div className="h-1.5 bg-[#e24052]"></div>
          <div className="h-1.5 bg-[#d08635]"></div>
          <div className="h-1.5 bg-[#e3c561]"></div>
        </div>
      </header>

      {/* ── ALERTA DE SIMULADOR DE DESARROLLO ── */}
      {isSimulated && (
        <div className="bg-[#ff6b00]/10 border-b border-[#ff6b00]/20 text-[#ff6b00] font-bold text-center py-2 px-4 text-sm flex items-center justify-center gap-2">
          <Info className="w-4 h-4" />
          <span>Modo Simulación Activo: Estás viendo el catálogo como si fuera el <strong>{currentDate.getDate()} de Julio, 2026</strong>.</span>
          <button 
            onClick={() => navigate("/cyberdays")}
            className="underline ml-2 hover:text-[#e24052] transition-colors"
          >
            Restaurar fecha real
          </button>
        </div>
      )}

      {/* ── CUERPO PRINCIPAL ── */}
      <main className="container mx-auto px-4 py-12 max-w-6xl grow">
        {/* Banner descriptivo */}
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">
            Desbloquea un Sabor Diferente Cada Día 🍓
          </h2>
          <p className="text-gray-600 leading-relaxed text-lg">
            ¡Prepárate! Desde el <strong>6 de Julio hasta el 10 de Julio de 2026</strong> se liberará un producto especial exclusivo con descuentos increíbles. Una vez liberados, permanecerán listos para que los añadas a tu pedido.
          </p>
        </div>

        {/* Grid de Productos */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CYBER_PRODUCTS.map((product) => {
            const isUnlocked = checkUnlocked(product.unlockDay);
            const inCart = cart.find(item => item.id === product.id);

            return (
              <div 
                key={product.id}
                onClick={() => {
                  if (isUnlocked) {
                    navigate(`/cyberdays/${slugify(product.name)}`);
                  }
                }}
                className={`relative bg-white rounded-[2rem] border border-gray-100 shadow-xl overflow-hidden transition-all duration-300 group flex flex-col ${
                  isUnlocked 
                    ? "hover:-translate-y-2 hover:shadow-2xl cursor-pointer" 
                    : "opacity-85"
                }`}
              >
                {/* Badge superior indicando fecha / estado */}
                <div className="absolute top-4 left-4 z-20">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${
                    isUnlocked 
                      ? "bg-[#ffc700] text-gray-900" 
                      : "bg-[#d08635] text-white"
                  }`}>
                    {isUnlocked ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        Desbloqueado
                      </>
                    ) : (
                      <>
                        <Calendar className="w-3.5 h-3.5" />
                        {product.unlockDay} de Julio
                      </>
                    )}
                  </span>
                </div>

                {/* Imagen y overlay de bloqueo */}
                <div className="relative h-60 bg-gray-50 flex items-center justify-center p-6 overflow-hidden">
                  {/* Fondo degradado suave decorativo */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-white opacity-40"></div>

                  {product.image ? (
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className={`h-full object-contain transition-transform duration-500 ${
                        isUnlocked ? "group-hover:scale-110" : "blur-lg"
                      }`} 
                    />
                  ) : (
                    /* Vector placeholder con los colores del cyber */
                    <div className={`w-32 h-32 rounded-3xl flex items-center justify-center transition-all ${
                      isUnlocked 
                        ? "bg-gradient-to-tr from-[#e24052]/20 via-[#d08635]/20 to-[#e3c561]/20 text-[#d08635]" 
                        : "bg-gray-100 text-gray-300 blur-sm"
                    }`}>
                      <ShoppingBag className="w-16 h-16" />
                    </div>
                  )}

                  {/* Capa de Bloqueado (Overlay blur y candado) */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 bg-black/45 backdrop-blur-md flex flex-col items-center justify-center text-white p-4">
                      <div className="bg-[#e24052] p-4 rounded-full shadow-lg mb-3 animate-bounce">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                      <p className="font-extrabold uppercase tracking-widest text-sm">Próximo Lanzamiento</p>
                      <p className="text-xs text-white/80 mt-1 font-medium">Disponible el {product.unlockDay} de Julio</p>
                    </div>
                  )}

                  {/* Porcentaje de Descuento (Badge flotante) */}
                  {isUnlocked && (
                    <div className="absolute top-4 right-4 bg-[#e24052] text-white font-black text-sm px-3 py-1.5 rounded-2xl shadow-lg animate-pulse">
                      -{product.discount}
                    </div>
                  )}
                </div>

                {/* Detalles de producto */}
                <div className="p-6 flex-1 flex flex-col text-left">
                  <span className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">
                    {product.brand} • {product.weight}
                  </span>
                  <h3 className="font-extrabold text-xl text-gray-900 group-hover:text-[#95b721] transition-colors mb-6">
                    {product.name}
                  </h3>

                  {/* Precios */}
                  <div className="flex items-baseline gap-2 mb-6">
                    {isUnlocked ? (
                      <>
                        <span className="text-3xl font-black text-[#ff6b00]">
                          S/ {product.price.toFixed(2)}
                        </span>
                        <span className="text-gray-400 text-sm font-semibold line-through">
                          S/ {product.originalPrice.toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold text-gray-400 italic">
                        Revelando oferta...
                      </span>
                    )}
                  </div>

                  {/* Botón de acción */}
                  <button
                    disabled={!isUnlocked}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddToCart(product);
                    }}
                    className={`w-full flex items-center justify-center gap-2 font-black py-4 px-6 rounded-2xl shadow-lg transition-all duration-300 ${
                      isUnlocked 
                        ? "bg-[#95b721] hover:bg-[#e24052] text-white hover:scale-[1.02] active:scale-95 cursor-pointer" 
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                    }`}
                  >
                    <ShoppingCart className="w-5 h-5" />
                    <span>
                      {inCart ? `Agregar otro (${inCart.quantity})` : "Añadir al Pedido"}
                    </span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <Footer />
    </div>
  );
}
