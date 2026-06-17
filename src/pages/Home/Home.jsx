import { Navbar } from "../../components/navbar";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";
import Products from "../../components/products";

const Home = () => {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="bg-linear-to-r from-[#8ca91f] to-[#9ec425] pt-8 pb-12 flex flex-row justify-between px-4 md:justify-center items-center relative md:gap-0 shadow-sm">
        <div className="relative md:absolute md:left-8 md:top-1/2 md:transform md:-translate-y-1/2 z-10 shrink-0">
          <img 
            src="/logo-abunga.png" 
            alt="Abunga Logo" 
            className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover shadow-xl border-[3px] border-white/20"
          />
        </div>

        <div className="z-10">
          <div className="bg-white px-12 py-5 rounded-3xl shadow-md hidden md:block">
            <img 
              src="/abunga-text.png" 
              alt="Abunga" 
              className="h-16 object-contain hidden md:block"
            />
          </div>
        </div>
        
        <Navbar />
        
        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <div className="h-2 bg-[#e24052]"></div>
          <div className="h-2 bg-[#d08635]"></div>
          <div className="h-2 bg-[#e3c561]"></div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-16 max-w-6xl space-y-16">

        {/* ===== BANNER CATÁLOGO ===== */}
        <div className="relative overflow-hidden rounded-[2.5rem] animate-fade-in-up">
          {/* Fondo degradado */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8ca91f] via-[#9ec425] to-[#b8d832]" />
          {/* Círculos decorativos */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-sm" />
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />

          {/* Contenido */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center py-16 px-8 gap-6">
            <span className="inline-block bg-white/20 text-white text-sm font-bold uppercase tracking-widest px-4 py-1.5 rounded-full border border-white/30 backdrop-blur-sm">
              🍓 Snacks Naturales Arequipeños
            </span>
            <h2 className="text-4xl md:text-6xl font-black text-white drop-shadow-md leading-tight">
              ¡Mira nuestro <br/>
              <span className="relative inline-block">
                catálogo
                <span className="absolute -bottom-1 left-0 right-0 h-1.5 bg-white/50 rounded-full" />
              </span>
              {" "}aquí! 🛒
            </h2>
            <p className="text-white/90 text-lg md:text-xl font-medium max-w-lg">
              Frutas deshidratadas, rollitos saludables y mucho más. ¡Elige tus favoritos!
            </p>
            <Link
              to="/catalogo"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center gap-3 bg-white text-[#8ca91f] font-extrabold py-4 px-10 rounded-full text-xl shadow-[0_8px_30px_rgba(0,0,0,0.2)] hover:bg-[#e24052] hover:text-white transition-all duration-400 transform hover:-translate-y-1 hover:scale-105 group"
            >
              <span>Ver Catálogo</span>
              <span className="text-2xl group-hover:translate-x-1.5 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>

        {/* ===== SECCIÓN DESCUBRE ===== */}
        <div className="pt-8 border-t border-gray-100">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#8ca91f] text-center mb-12 tracking-tight">
            Descubre nuestros Snacks 🍓
          </h2>
          <Products />
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Home;
