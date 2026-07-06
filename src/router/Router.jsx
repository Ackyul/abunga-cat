import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Nosotros from "../pages/Nosotros/Nosotros";
import Catalogo from "../pages/Catalogo/Catalogo";
import ProductDetail from "../pages/Catalogo/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Admin from "../pages/Admin/Admin";
import Profile from "../pages/Profile/Profile";
import CyberDays from "../pages/CyberDays/CyberDays";
import CyberProductDetail from "../pages/CyberDays/CyberProductDetail";

function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/nosotros" element={<Nosotros />} />
        <Route path="/catalogo" element={<Catalogo />} />
        <Route path="/catalogo/:productSlug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/cyberdays" element={<CyberDays />} />
        <Route path="/cyberdays/:productSlug" element={<CyberProductDetail />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
