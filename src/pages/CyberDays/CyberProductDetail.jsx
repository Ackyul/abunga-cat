import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, ShoppingCart, Lock, Calendar, CheckCircle, Clock } from "lucide-react";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import { CYBER_PRODUCTS } from "./CyberDays";
import useCartStore from "../../stores/useCartStore";
import useAuthStore from "../../stores/useAuthStore";
import { slugify } from "../../lib/slugify";
import { toast } from "sonner";

export default function CyberProductDetail() {
  const { productSlug } = useParams();
  const navigate = useNavigate();
  const { addToCart, cart, updateQuantity } = useCartStore();
  const { user } = useAuthStore();

  // Find the product by slug
  const product = CYBER_PRODUCTS.find(p => slugify(p.name) === productSlug);

  // Time simulation or real date logic
  const getSimulatedDate = () => {
    const params = new URLSearchParams(window.location.search);
    const simDay = params.get("simDay");
    if (simDay) {
      const day = parseInt(simDay, 10);
      if (!isNaN(day) && day >= 1 && day <= 31) {
        return new Date(2026, 6, day); // Julio es el mes 6
      }
    }
    return new Date();
  };

  const checkUnlocked = (unlockDay) => {
    if (!unlockDay) return false;
    const currentDate = getSimulatedDate();
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

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-between">
        <header className="bg-linear-to-r from-[#8ca91f] to-[#9ec425] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
          <Link to="/" className="shrink-0">
            <img src="/logo-abunga.png" alt="Abunga" className="w-16 h-16 rounded-full object-cover shadow-lg border-[3px] border-white/20" />
          </Link>
          <Navbar />
        </header>
        <div className="flex flex-col items-center justify-center p-24 grow text-center">
          <p className="text-red-500 font-bold text-2xl mb-4">Oferta Cyber no encontrada</p>
          <p className="text-gray-500 mb-8 max-w-md">Lo sentimos, la oferta que buscas no existe en nuestro catálogo de CyberDays.</p>
          <Link to="/cyberdays" className="bg-[#e24052] hover:bg-[#c83243] text-white font-bold py-3 px-8 rounded-full shadow-lg transition-all flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" /> Volver a CyberDays
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const isUnlocked = checkUnlocked(product.unlockDay);
  const inCart = cart.find(item => item.id === product.id);

  const handleAddToCart = () => {
    if (!isUnlocked) return;

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
        image: product.image || "/logo-abunga.png",
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
        <div>
          <Link 
            to="/cyberdays" 
            className="inline-flex items-center gap-2 text-gray-500 hover:text-[#e24052] font-bold transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Volver a CyberDays</span>
          </Link>
        </div>

        {/* Locked State Container */}
        {!isUnlocked ? (
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-8 md:p-16 flex flex-col items-center justify-center text-center max-w-2xl mx-auto my-8 relative overflow-hidden">
            {/* Background glowing circles */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#e24052]/10 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#d08635]/10 rounded-full blur-2xl"></div>
            
            <div className="bg-[#e24052] p-6 rounded-full shadow-xl mb-6 text-white animate-bounce">
              <Lock className="w-10 h-10" />
            </div>
            
            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-black uppercase tracking-wider bg-[#d08635]/15 text-[#d08635] mb-4">
              <Clock className="w-4 h-4" /> Oferta no disponible aún
            </span>
            
            <h2 className="text-3xl font-black text-gray-900 mb-4">Oferta Sorpresa 🎁</h2>
            <p className="text-gray-500 max-w-md mb-8">
              Esta es una oferta exclusiva de CyberDays y se desbloqueará el día <strong>{product.unlockDay} de Julio de 2026</strong>. ¡Vuelve pronto para no perdértela!
            </p>
            
            <Link 
              to="/cyberdays" 
              className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold py-3.5 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all"
            >
              Volver al Catálogo Cyber
            </Link>
          </div>
        ) : (
          /* Unlocked Detail Card */
          <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            {/* Left side: Product Image */}
            <div className="w-full md:w-1/2 bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center p-8 md:p-12 relative shrink-0">
              {/* Floating Discount Badge */}
              <div className="absolute top-6 left-6 bg-[#e24052] text-white font-black text-base px-4 py-2 rounded-2xl shadow-lg animate-pulse">
                -{product.discount} Cyber
              </div>
              
              {product.image ? (
                <img 
                  src={product.image} 
                  alt={product.name} 
                  className="max-h-[350px] md:max-h-[450px] object-contain drop-shadow-2xl hover:scale-105 transition-transform duration-500"
                  onError={(e) => { e.target.src = "/logo-abunga.png"; }}
                />
              ) : (
                <div className="w-48 h-48 bg-[#e24052]/10 rounded-[2rem] flex items-center justify-center text-[#e24052]">
                  <ShoppingCart className="w-24 h-24" />
                </div>
              )}
            </div>

            {/* Right side: Product purchasing and description */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center space-y-6 text-left">
              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-[#ffc700] text-gray-900 mb-2">
                  <CheckCircle className="w-3.5 h-3.5" /> Oferta Desbloqueada
                </span>
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider block">
                  {product.brand} • {product.weight}
                </span>
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-1 text-gray-900 leading-tight">
                  {product.name}
                </h2>
              </div>

              {/* Separador */}
              <div className="h-px bg-gray-100 w-full"></div>

              {/* Price section */}
              <div className="space-y-1">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Precio Oferta CyberDays:</span>
                <div className="flex items-baseline gap-3">
                  <span className="text-5xl font-black text-[#ff6b00]">
                    S/ {product.price.toFixed(2)}
                  </span>
                  <span className="text-gray-400 text-lg font-bold line-through">
                    S/ {product.originalPrice.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Add to cart / Action button */}
              <div className="pt-2">
                <button
                  onClick={handleAddToCart}
                  className="w-full md:max-w-xs flex items-center justify-center gap-3 bg-[#95b721] hover:bg-[#e24052] text-white font-extrabold py-4 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer border-none outline-none"
                >
                  <ShoppingCart className="w-6 h-6" />
                  <span>
                    {inCart ? `Añadir otro (${inCart.quantity})` : "Añadir al Pedido"}
                  </span>
                </button>
              </div>

              {/* Separador */}
              <div className="h-px bg-gray-100 w-full"></div>

              {/* Description detailing Combo 1 or others */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contenido de la oferta</h4>
                <p className="text-gray-600 leading-relaxed text-sm whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
