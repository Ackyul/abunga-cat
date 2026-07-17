import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "../pages/Home/Home";
import Nosotros from "../pages/Nosotros/Nosotros";
import Catalogo from "../pages/Catalogo/Catalogo";
import ProductDetail from "../pages/Catalogo/ProductDetail";
import Cart from "../pages/Cart/Cart";
import Admin from "../pages/Admin/Admin";
import Profile from "../pages/Profile/Profile";
import Login from "../pages/Login/Login";
import Register from "../pages/Register/Register";

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
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
