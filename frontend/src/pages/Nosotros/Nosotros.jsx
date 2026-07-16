import { Navbar } from "../../components/navbar";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";

const Nosotros = () => {
  return (
    <div className="min-h-screen bg-slate-50/50">
      <header className="bg-linear-to-r from-[#8ca91f] to-[#9ec425] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
        <div className="flex items-center gap-4 z-10">
          <Link to="/" className="shrink-0 relative">
            <img 
              src="/logo-abunga.png" 
              alt="Abunga Logo" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-xl border-[3px] border-white/20 hover:scale-105 transition-transform"
            />
          </Link>
          <div className="bg-white px-8 py-3 rounded-2xl shadow-md hidden xl:block">
            <img 
              src="/abunga-text.png" 
              alt="Abunga" 
              className="h-10 object-contain"
            />
          </div>
        </div>
        
        <Navbar />
        
        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <div className="h-1.5 bg-[#e24052]"></div>
          <div className="h-1.5 bg-[#d08635]"></div>
          <div className="h-1.5 bg-[#e3c561]"></div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-16 max-w-6xl space-y-16">

        {/* ===== SOMOS ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center animate-fade-in-up">
          <div className="space-y-6 md:pr-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#8ca91f] mb-6 tracking-tight">Somos:</h2>
            <p className="text-xl text-gray-600 leading-relaxed font-medium">
              Una marca arequipeña que transforma fruta local en snacks deshidratados y láminas de frutas deshidratadas en rollitos saludables 💚
            </p>
            <p className="text-xl text-gray-600 leading-relaxed font-medium">
              Natural, sostenible y hecho con propósito.
            </p>
            <div className="pt-6">
              <p className="text-xl font-semibold text-gray-800 bg-white inline-block px-6 py-3 rounded-full shadow-sm border border-neutral-100">
                Contactos al 📞: <a href="tel:973391928" className="text-[#95b721] font-bold hover:text-[#7a951b] transition-colors ml-1">973391928</a>
              </p>
            </div>
          </div>

          <div className="group relative bg-white rounded-[2.5rem] aspect-square flex items-center justify-center p-3 shadow-[0_20px_50px_-12px_rgba(149,183,33,0.15)] transition-all duration-500 hover:scale-[1.02]">
            <img src="/frutas-home.jpg" alt="Fruta Deshidratada" className="w-full h-full object-cover rounded-[2rem]" />
          </div>
        </div>

        {/* ===== NUESTRA MISIÓN ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center animate-fade-in-up" style={{ animationDelay: '150ms' }}>
          <div className="space-y-6 md:order-2 md:pl-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#8ca91f] mb-6 tracking-tight text-right md:text-left">Nuestra Misión</h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium text-right md:text-left">
              Hacer "retumbar" a los paladares arequipeños con snacks saludables, prácticos y de alta calidad elaborados a base de frutas deshidratadas y sus derivados, en constante innovación, promoviendo hábitos de consumo natural con responsabilidad social y medioambiental, fomentando la economía circular.
            </p>
          </div>

          <div className="group relative bg-white rounded-[2.5rem] aspect-square flex items-center justify-center p-3 shadow-[0_20px_50px_-12px_rgba(149,183,33,0.15)] md:order-1 transition-all duration-500 hover:scale-[1.02]">
            <img src="/mision.jpg" alt="Misión Abunga" className="w-full h-full object-cover rounded-[2rem]" />
          </div>
        </div>

        {/* ===== NUESTRA VISIÓN ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center animate-fade-in-up" style={{ animationDelay: '300ms' }}>
          <div className="space-y-6 md:pr-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#8ca91f] mb-6 tracking-tight">Nuestra Visión</h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed font-medium">
              Ser la marca líder en snacks saludables a base de frutas deshidratadas a nivel nacional reconocida por su innovación, calidad y compromiso con la alimentación, la salud y el medioambiente.
            </p>
          </div>

          <div className="group relative bg-white rounded-[2.5rem] aspect-square flex items-center justify-center p-3 shadow-[0_20px_50px_-12px_rgba(149,183,33,0.15)] transition-all duration-500 hover:scale-[1.02]">
            <img src="/vision.jpg" alt="Visión Abunga" className="w-full h-full object-cover rounded-[2rem]" />
          </div>
        </div>

        {/* ===== ENLACE AL CATÁLOGO ===== */}
        <div className="pt-16 border-t border-gray-100 flex flex-col items-center gap-6">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[#8ca91f] text-center tracking-tight">
            ¿Listo para saborear? 🍓
          </h2>
          <p className="text-gray-500 text-lg md:text-xl text-center max-w-lg">
            Explora nuestra variedad completa de snacks saludables, rollitos deshidratados e infusiones de alta calidad.
          </p>
          <Link
            to="/catalogo"
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center gap-3 bg-[#95b721] hover:bg-[#84a31d] text-white font-extrabold py-4 px-10 rounded-full text-xl shadow-[0_8px_30px_rgba(149,183,33,0.3)] transition-all duration-300 transform hover:-translate-y-1 hover:scale-105 group"
          >
            <span>Ver Catálogo Completo 🛒</span>
            <span className="text-2xl group-hover:translate-x-1.5 transition-transform duration-300">→</span>
          </Link>
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Nosotros;
