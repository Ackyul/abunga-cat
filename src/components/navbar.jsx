import { Link, useLocation } from "react-router-dom";
// import { ShoppingCart } from "lucide-react";
// import useCartStore from "../stores/useCartStore";
import { cn } from "../lib/utils";

export function Navbar() {
  const location = useLocation();
  // const itemsCount = useCartStore((state) => state.getItemsCount());

  const navLinks = [
    { path: "/", label: "Home" },
    { path: "/catalogo", label: "Catálogo" },
    { path: "/profile", label: "Cuenta" },
  ];

  return (
    <div className="relative md:absolute md:right-8 md:top-1/2 md:transform md:-translate-y-1/2 flex items-center gap-2 md:gap-4">
      {navLinks.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={cn(
            "px-4 py-2 md:px-6 md:py-2.5 rounded-full font-bold text-xs md:text-sm transition-all duration-300 uppercase tracking-wider",
            location.pathname === link.path
              ? "bg-white/95 text-[#95b721] shadow-lg shadow-black/10 backdrop-blur-sm"
              : "text-white/90 hover:text-white hover:bg-white/20 hover:shadow-sm"
          )}
        >
          {link.label}
        </Link>
      ))}
      
      {/* Cart button removed as per request */}
    </div>
  );
}
