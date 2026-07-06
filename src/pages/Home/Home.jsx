import { useState, useEffect } from "react";
import { Navbar } from "../../components/navbar";
import { Link } from "react-router-dom";
import Footer from "../../components/footer";
import { fetchNews } from "../../services/api";
import { Loader2, Calendar, Sparkles } from "lucide-react";

const Home = () => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadNews = async () => {
      try {
        const data = await fetchNews();
        setNews(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
        setError("Error al cargar novedades.");
      } finally {
        setLoading(false);
      }
    };
    loadNews();
  }, []);

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

        {/* ===== BANNER CATÁLOGO ===== */}
        <div className="relative overflow-hidden rounded-[2.5rem] animate-fade-in-up">
          {/* Fondo degradado */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#8ca91f] via-[#9ec425] to-[#b8d832]" />
          {/* Círculos decorativos */}
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-sm" />
          <div className="absolute top-1/2 right-8 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-full" />

          {/* Contenido */}
          <div className="relative z-10 flex flex-col items-center justify-center text-center py-8 px-6 gap-4">
            <span className="inline-block bg-white/20 text-white text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-white/30 backdrop-blur-sm">
              🍓 Snacks Naturales Arequipeños
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-white drop-shadow-md leading-tight">
              ¡Mira nuestro{" "}
              <span className="relative inline-block">
                catálogo
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-white/50 rounded-full" />
              </span>
              {" "}aquí! 🛒
            </h2>
            <p className="text-white/90 text-sm md:text-base font-medium max-w-lg">
              Frutas deshidratadas, rollitos saludables y mucho más. ¡Elige tus favoritos!
            </p>
            <Link
              to="/catalogo"
              onClick={() => window.scrollTo(0, 0)}
              className="inline-flex items-center gap-2 bg-white text-[#8ca91f] font-extrabold py-2.5 px-8 rounded-full text-base shadow-[0_8px_30px_rgba(0,0,0,0.15)] hover:bg-[#e24052] hover:text-white transition-all duration-300 transform hover:-translate-y-0.5 hover:scale-105 group"
            >
              <span>Ver Catálogo</span>
              <span className="text-xl group-hover:translate-x-1 transition-transform duration-300">→</span>
            </Link>
          </div>
        </div>

        {/* ===== SECCIÓN NOVEDADES Y NOTICIAS ===== */}
        <div className="pt-8 border-t border-gray-100 space-y-8">
          <div className="flex flex-col items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-[#95b721]/10 text-[#8ca91f] text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-[#95b721]/20">
              <Sparkles className="h-3.5 w-3.5" /> Novedades y Novedades
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-800 text-center tracking-tight">
              Lo último de Abunga 📣
            </h2>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-[#95b721]" />
            </div>
          ) : error ? (
            <div className="text-center py-12 text-red-500 font-semibold">{error}</div>
          ) : news.length === 0 ? (
            <div className="text-center py-12 text-gray-400 bg-white rounded-3xl border border-gray-100 p-8 shadow-xs">
              No hay noticias publicadas en este momento. ¡Vuelve pronto!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {news.map((item) => (
                <div key={item.id} className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_10px_30px_rgba(0,0,0,0.02)] overflow-hidden flex flex-col hover:shadow-[0_15px_40px_rgba(149,183,33,0.08)] transition-all duration-300">
                  {item.image && (
                    <div className="h-56 w-full overflow-hidden shrink-0 border-b border-gray-50">
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover hover:scale-102 transition-transform duration-500" />
                    </div>
                  )}
                  <div className="p-6 md:p-8 flex flex-col flex-1 justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <Calendar className="h-3.5 w-3.5 text-[#95b721]/70" />
                        <span>{new Date(item.created_at).toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <h3 className="text-xl md:text-2xl font-black text-gray-800 leading-snug">{item.title}</h3>
                      <p className="text-gray-500 text-sm md:text-base leading-relaxed whitespace-pre-wrap">{item.content}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      <Footer />
    </div>
  );
};

export default Home;
