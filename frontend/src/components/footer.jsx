import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-linear-to-b from-[#8ba91f] to-[#95b721] text-white py-12 mt-auto border-t border-[#8ba91f]/50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
          <div className="text-center md:text-left flex flex-col items-center md:items-start">
            <h3 className="text-2xl font-['Capriola'] mb-2 text-white">abunga</h3>
            <p className="text-sm text-white/80 mb-4">Snacks naturales de Arequipa</p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/abungasaborqueretumba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 text-white shadow-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@abungasaborqueretumba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all duration-300 hover:scale-110 text-white shadow-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                </svg>
              </a>
            </div>
          </div>

          <div className="text-center">
            <p className="font-semibold mb-2">Contáctanos</p>
            <a
              href="tel:973391928"
              className="text-white hover:text-[#e3c561] transition-colors text-lg"
            >
              📞 973391928
            </a>
          </div>

          <div className="text-center md:text-right">
            <p className="text-sm text-white/80">
              © {new Date().getFullYear()} Abunga
            </p>
            <p className="text-xs text-white/50 mt-1">
              <Link to="/admin" className="hover:text-white transition-colors font-medium">Panel de Control</Link>
            </p>
            <p className="text-xs text-white/60 mt-1">
              Todos los derechos reservados a
            </p>
            <p className="text-xs text-white/70 mt-0.5 font-medium">
              <a 
                href="https://ackyul.github.io/yoshuanunez.github.io/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-white hover:underline transition-colors"
              >
                Yoshua Josafat Núñez Huaccoto
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
