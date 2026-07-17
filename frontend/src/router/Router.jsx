import { useEffect } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "../pages/Home/Home";
import Nosotros from "../pages/Nosotros/Nosotros";
import Catalogo from "../pages/Catalogo/Catalogo";
import ProductDetail from "../pages/Catalogo/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Admin from "../pages/Admin/Admin";
import Profile from "../pages/Profile/Profile";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

function LocationTracker() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname;
    // Evitamos guardar las rutas de auth o admin como última página visitada
    if (path !== "/login" && path !== "/register" && path !== "/admin") {
      sessionStorage.setItem("last_visited_page", path + location.search);
    }
  }, [location]);

  return null;
}

function Router() {
  return (
    <BrowserRouter>
      <LocationTracker />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/catalogo/:productSlug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
