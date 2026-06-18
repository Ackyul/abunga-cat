import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { Menu, X } from "lucide-react";

export function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Close menu when route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinks = [
    { path: "/", label: "Descubre" },
    { path: "/nosotros", label: "Nosotros" },
    { path: "/catalogo", label: "Catálogo" },
  ];

  return (
    <>
      {/* ── DESKTOP nav (md+) ── */}
      <div className="hidden md:flex absolute right-8 top-1/2 -translate-y-1/2 items-center gap-3 z-20">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 uppercase tracking-wider",
              location.pathname === link.path
                ? "bg-white/95 text-[#95b721] shadow-lg shadow-black/10 backdrop-blur-sm"
                : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-sm"
            )}
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* ── MOBILE hamburger button ── */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="Abrir menú"
        className="md:hidden relative z-20 flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all duration-200 shrink-0 shadow-sm"
      >
        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* ── MOBILE fullscreen menu overlay ── */}
      {menuOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex flex-col"
          style={{ background: "linear-gradient(160deg, #8ca91f 0%, #9ec425 55%, #b8d832 100%)" }}
        >
          {/* Top bar inside overlay */}
          <div className="flex items-center justify-between px-5 pt-6 pb-4">
            <img
              src="/logo-abunga.png"
              alt="Abunga"
              className="w-14 h-14 rounded-full object-cover shadow-lg border-2 border-white/30"
            />
            <button
              onClick={() => setMenuOpen(false)}
              aria-label="Cerrar menú"
              className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Divider stripes */}
          <div className="flex flex-col">
            <div className="h-1 bg-[#e24052]" />
            <div className="h-1 bg-[#d08635]" />
            <div className="h-1 bg-[#e3c561]" />
          </div>

          {/* Menu links */}
          <nav className="flex-1 flex flex-col justify-center items-center gap-4 px-8">
            {navLinks.map((link, i) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMenuOpen(false)}
                style={{ animationDelay: `${i * 60}ms` }}
                className={cn(
                  "w-full text-center py-4 px-6 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-200 animate-fade-in-up",
                  location.pathname === link.path
                    ? "bg-white text-[#95b721] shadow-xl shadow-black/15"
                    : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Bottom branding */}
          <div className="pb-10 flex justify-center">
            <div className="bg-white/20 px-6 py-2.5 rounded-full">
              <p className="text-white/80 text-xs font-bold uppercase tracking-widest">
                Abunga · Snacks Naturales
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
