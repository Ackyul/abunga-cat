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
    { path: "/cyberdays", label: "CyberDays ⚡" },
  ];

  return (
    <>
      {/* ── DESKTOP nav (xl+) ── */}
      <div className="hidden xl:flex items-center gap-3 z-20 animate-fade-in">
        {navLinks.map((link) => {
          const isCyber = link.path === "/cyberdays";
          return (
            <Link
              key={link.path}
              to={link.path}
              className={cn(
                "px-5 py-2.5 rounded-full font-bold text-sm transition-all duration-300 uppercase tracking-wider flex items-center gap-1.5 relative",
                isCyber
                  ? (location.pathname === link.path
                      ? "bg-white/95 text-[#a20087] shadow-lg shadow-[#a20087]/20 backdrop-blur-sm border border-[#a20087]/20"
                      : "bg-[#a20087] text-white hover:bg-[#ff6b00] hover:shadow-md animate-pulse")
                  : (location.pathname === link.path
                      ? "bg-white/95 text-[#95b721] shadow-lg shadow-black/10 backdrop-blur-sm"
                      : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-sm")
              )}
            >
              {link.label}
            </Link>
          );
        })}

        {/* Desktop Cart */}
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
            {navLinks.map((link, i) => {
              const isCyber = link.path === "/cyberdays";
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMenuOpen(false)}
                  style={{ animationDelay: `${i * 60}ms` }}
                  className={cn(
                    "w-full text-center py-4 px-6 rounded-2xl font-black text-xl uppercase tracking-wider transition-all duration-200 animate-fade-in-up",
                    isCyber
                      ? (location.pathname === link.path
                          ? "bg-white text-[#a20087] shadow-xl shadow-[#a20087]/20 border border-[#a20087]/30"
                          : "bg-[#a20087] text-white hover:bg-[#ff6b00] border-0 shadow-lg shadow-[#a20087]/25 animate-pulse")
                      : (location.pathname === link.path
                          ? "bg-white text-[#95b721] shadow-xl shadow-black/15"
                          : "bg-white/15 text-white hover:bg-white/25 border border-white/20")
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

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
