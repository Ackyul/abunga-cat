import { Navbar } from "../../components/navbar";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";

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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 items-center animate-fade-in-up">
          <div className="space-y-6 md:pr-4">
            <h2 className="text-4xl md:text-5xl font-extrabold text-[#8ca91f] mb-6 tracking-tight">Somos:</h2>
            <p className="text-xl text-gray-600 leading-relaxed font-medium">
              Una marca arequipeña que transforma fruta local en snacks deshidratados y láminas de frutas dehidratadas en rollitos saludables 💚
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

        <div className="text-center py-12 animate-fade-in-up" style={{ animationDelay: '450ms' }}>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-800 mb-10 tracking-tight">Mira nuestro catálogo aquí</h2>
          <Link 
            to="/catalogo" 
            onClick={() => window.scrollTo(0, 0)}
            className="inline-flex items-center justify-center bg-linear-to-r from-[#9ec425] to-[#8ca91f] text-white font-bold py-4 px-12 rounded-full text-xl hover:from-[#e24052] hover:to-[#d03243] transition-all duration-500 shadow-[0_10px_30px_-10px_rgba(149,183,33,0.6)] hover:shadow-[0_15px_40px_-10px_rgba(226,64,82,0.6)] transform hover:-translate-y-1 group"
          >
            <span>Ver Catálogo</span>
            <span className="ml-2 group-hover:translate-x-1 transition-transform">→</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
