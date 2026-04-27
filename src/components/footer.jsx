const Footer = () => {
  return (
    <footer className="bg-linear-to-b from-[#8ba91f] to-[#95b721] text-white py-12 mt-auto border-t border-[#8ba91f]/50">
      <div className="container mx-auto px-6 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-['Capriola'] mb-2 text-white">abunga</h3>
            <p className="text-sm text-white/80">Snacks naturales de Arequipa</p>
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
            <p className="text-xs text-white/60 mt-1">
              Todos los derechos reservados a
            </p>
            <p className="text-xs text-white/70 mt-0.5 font-medium">
              Yoshua Josafat Núñez Huaccoto
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
