import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "../lib/utils";
import { Menu, X, ShoppingBag, User } from "lucide-react";
import useCartStore from "../stores/useCartStore";
import useAuthStore from "../stores/useAuthStore";

export function Navbar() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const itemsCount = useCartStore((state) => state.getItemsCount());
  const { user } = useAuthStore();

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
      {/* ── DESKTOP nav (xl+) ── */}
      <div className="hidden xl:flex items-center gap-3 z-20 animate-fade-in">
        {navLinks.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={cn(
              "px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 uppercase tracking-wider flex items-center gap-1.5 relative",
              location.pathname === link.path
                ? "bg-white/95 text-[#95b721] shadow-lg shadow-black/10 backdrop-blur-sm"
                : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-sm"
            )}
          >
            {link.label}
          </Link>
        ))}

        {/* Desktop Cart */}
        {user && (
          <Link
            to="/cart"
            aria-label="Ver carrito"
            className={cn(
              "relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
              location.pathname === "/cart"
                ? "bg-white/95 text-[#95b721] shadow-lg shadow-black/10 backdrop-blur-sm"
                : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-sm"
            )}
          >
            <ShoppingBag className="w-5 h-5" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e24052] text-white text-[10px] font-black rounded-full h-5 w-5 flex items-center justify-center border-2 border-[#95b721] animate-bounce">
                {itemsCount}
              </span>
            )}
          </Link>
        )}

        {/* Desktop User profile */}
        <Link
          to="/profile"
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 uppercase tracking-wider",
            location.pathname === "/profile"
              ? "bg-white/95 text-[#95b721] shadow-lg shadow-black/10 backdrop-blur-sm"
              : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-sm"
          )}
        >
          <User className="w-4 h-4" />
          <span className="max-w-[100px] truncate">
            {user ? user.name.split(" ")[0] : "Ingresar"}
          </span>
        </Link>
      </div>

      {/* ── MOBILE Header Actions (xl-) ── */}
      <div className="xl:hidden flex items-center gap-2 relative z-20 shrink-0">
        {/* Mobile Cart Button */}
        {user && (
          <Link
            to="/cart"
            aria-label="Ver carrito"
            className="relative flex items-center justify-center w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/35 transition-all shadow-sm"
          >
            <ShoppingBag className="w-5 h-5" />
            {itemsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#e24052] text-white text-[9px] font-black rounded-full h-5 w-5 flex items-center justify-center border border-[#95b721]">
                {itemsCount}
              </span>
            )}
          </Link>
        )}

        {/* Mobile menu toggle */}
        <button
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menú"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/20 hover:bg-white/35 text-white transition-all duration-200 shadow-sm"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── MOBILE fullscreen menu overlay ── */}
      {menuOpen && (
        <div
          className="xl:hidden fixed inset-0 z-50 flex flex-col"
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

            {/* Mobile Account link */}
            <Link
              to="/profile"
              onClick={() => setMenuOpen(false)}
              style={{ animationDelay: `${navLinks.length * 60}ms` }}
              className={cn(
                "w-full text-center py-4 px-6 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-200 animate-fade-in-up flex items-center justify-center gap-2",
                location.pathname === "/profile"
                  ? "bg-white text-[#95b721] shadow-xl shadow-black/15"
                  : "bg-white/15 text-white hover:bg-white/25 border border-white/20"
              )}
            >
              <User className="w-5 h-5 animate-pulse" />
              <span>{user ? `Hola, ${user.name.split(" ")[0]}` : "Mi Cuenta"}</span>
            </Link>
          </nav>

          {/* Bottom branding */}
          <div className="pb-10 flex flex-col items-center gap-4">
            <div className="flex gap-4">
              <a
                href="https://www.instagram.com/abungasaborqueretumba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 text-white shadow-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                </svg>
              </a>
              <a
                href="https://www.tiktok.com/@abungasaborqueretumba"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok"
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 text-white shadow-xs"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                </svg>
              </a>
            </div>
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
