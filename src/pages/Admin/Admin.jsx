import { useState, useEffect } from 'react';
import { Navbar } from '../../components/navbar';
import Footer from '../../components/footer';
import { toast } from 'sonner';
import { Loader2, Lock, LogOut, CheckCircle, Eye, EyeOff, Plus, Trash2, Save, FileText, ShoppingBag, Globe, Camera, Search } from 'lucide-react';
import BannerGenerator from '../../components/banner-generator';

export default function Admin() {
  const [authLoading, setAuthLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  
  // Dashboard states
  const [activeTab, setActiveTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [news, setNews] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadingId, setUploadingId] = useState(null);

  // New product form state
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    tipo: 'Fruta',
    fruta: '',
    image: '',
    precio: '',
    precios: { '50gr': '', '100gr': '', '500gr': '', '1kg': '' },
    brand: 'Abunga',
    visible: true
  });

  // New news form state
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    image: ''
  });

  // Check auth session
  const checkSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      if (data.authenticated) {
        setAuthenticated(true);
        setAdminEmail(data.email);
        fetchDashboardData();
      } else {
        setAuthenticated(false);
      }
    } catch (err) {
      console.error(err);
      toast.error('Error al verificar sesión.');
    } finally {
      setAuthLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  const fetchDashboardData = async () => {
    setDataLoading(true);
    try {
      const [prodRes, newsRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/news')
      ]);
      const prodData = await prodRes.json();
      const newsData = await newsRes.json();
      
      setProducts(Array.isArray(prodData) ? prodData : []);
      setNews(Array.isArray(newsData) ? newsData : []);
    } catch (err) {
      toast.error('Error al cargar datos del catálogo.');
    } finally {
      setDataLoading(false);
    }
  };

  // Passcode login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setLoginLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setAuthenticated(true);
        setAdminEmail(data.email);
        toast.success('Sesión iniciada con éxito.');
        fetchDashboardData();
      } else {
        toast.error(data.error || 'Contraseña incorrecta.');
      }
    } catch (err) {
      toast.error('Error al conectar con la API de autenticación.');
    } finally {
      setLoginLoading(false);
    }
  };

  // Google OAuth Login
  const handleGoogleLogin = () => {
    window.location.href = '/api/auth/google';
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setAuthenticated(false);
      setAdminEmail('');
      toast.success('Sesión cerrada.');
    } catch (err) {
      toast.error('Error al cerrar sesión.');
    }
  };

  // Upload image to Cloudinary via /api/upload
  const handleImageUpload = async (productId, idx, file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten archivos de imagen.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar 5 MB.');
      return;
    }
    setUploadingId(productId);
    try {
      // Convert to base64
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ file: base64, folder: 'abunga-products' }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Error al subir imagen.');
        return;
      }

      // Update local state with new URL
      const updated = [...products];
      updated[idx].image = data.url;
      setProducts(updated);

      // Auto-save to DB
      await saveProduct(updated[idx]);
      toast.success('Imagen actualizada correctamente.');
    } catch (err) {
      toast.error('Error al subir imagen. Intenta de nuevo.');
    } finally {
      setUploadingId(null);
    }
  };

  // Handle product edit change
  const handleProductFieldChange = (index, field, value) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const handleProductPreciosChange = (index, size, value) => {
    const updated = [...products];
    let precios = updated[index].precios || {};
    if (typeof precios === 'string') {
      try { precios = JSON.parse(precios); } catch (e) { precios = {}; }
    }
    precios = { ...precios, [size]: value ? Number(value) : undefined };
    updated[index].precios = precios;
    setProducts(updated);
  };

  // Save modified product
  const saveProduct = async (product) => {
    try {
      // Formatear precios correctamente (limpiar nulos o vacíos)
      let preciosClean = product.precios;
      if (typeof preciosClean === 'string') {
        try { preciosClean = JSON.parse(preciosClean); } catch (e) { preciosClean = null; }
      }
      
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          precio: product.precio ? Number(product.precio) : null,
          precios: preciosClean
        })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Producto "${product.name}" actualizado.`);
        fetchDashboardData();
      } else {
        toast.error(data.error || 'Error al actualizar producto.');
      }
    } catch (err) {
      toast.error('Error de red al actualizar producto.');
    }
  };

  // Delete product
  const deleteProduct = async (id, name) => {
    if (!confirm(`¿Estás seguro de eliminar el producto "${name}"?`)) return;
    try {
      const res = await fetch(`/api/products?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success(`Producto "${name}" eliminado.`);
        fetchDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar producto.');
      }
    } catch (err) {
      toast.error('Error de red al eliminar producto.');
    }
  };

  // Add new product
  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.fruta) {
      toast.error('Nombre y fruta son requeridos.');
      return;
    }
    try {
      // Limpiar precios vacíos
      const activePrecios = {};
      Object.entries(newProduct.precios).forEach(([size, price]) => {
        if (price !== '') activePrecios[size] = Number(price);
      });

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProduct,
          precio: newProduct.precio ? Number(newProduct.precio) : null,
          precios: Object.keys(activePrecios).length > 0 ? activePrecios : null
        })
      });
      if (res.ok) {
        toast.success('Producto creado con éxito.');
        setShowAddProduct(false);
        setNewProduct({
          name: '',
          tipo: 'Fruta',
          fruta: '',
          image: '',
          precio: '',
          precios: { '50gr': '', '100gr': '', '500gr': '', '1kg': '' },
          brand: 'Abunga',
          visible: true
        });
        fetchDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al crear producto.');
      }
    } catch (err) {
      toast.error('Error de red al crear producto.');
    }
  };

  // Add news article
  const handleAddNews = async (e) => {
    e.preventDefault();
    if (!newArticle.title || !newArticle.content) {
      toast.error('Título y contenido son requeridos.');
      return;
    }
    try {
      const res = await fetch('/api/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle)
      });
      if (res.ok) {
        toast.success('Noticia publicada con éxito.');
        setNewArticle({ title: '', content: '', image: '' });
        fetchDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al publicar noticia.');
      }
    } catch (err) {
      toast.error('Error de red al publicar noticia.');
    }
  };

  // Delete news article
  const deleteNews = async (id, title) => {
    if (!confirm(`¿Estás seguro de eliminar la noticia "${title}"?`)) return;
    try {
      const res = await fetch(`/api/news?id=${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        toast.success('Noticia eliminada con éxito.');
        fetchDashboardData();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Error al eliminar noticia.');
      }
    } catch (err) {
      toast.error('Error de red al eliminar noticia.');
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="h-12 w-12 animate-spin text-[#95b721]" />
      </div>
    );
  }

  // LOGIN INTERFACE
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col">
        <header className="bg-[#95b721] pt-8 pb-10 flex flex-row justify-center items-center relative shadow-sm">
          <div className="bg-white px-8 py-3.5 rounded-full shadow-md">
            <img src="/abunga-text.png" alt="Abunga" className="h-10 object-contain" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex flex-col">
            <div className="h-1.5 bg-[#e24052]"></div>
            <div className="h-1.5 bg-[#d08635]"></div>
          </div>
        </header>

        <main className="flex-1 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-gray-100 p-8 space-y-8 animate-fade-in-up">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-linear-to-tr from-[#9ec425]/10 to-[#8ca91f]/20 text-[#8ca91f]">
                <Lock className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-gray-900">Consola de Control</h2>
              <p className="text-gray-500 text-sm">Inicia sesión de forma segura para gestionar el catálogo</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-600 uppercase tracking-wider">Contraseña de acceso</label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-4 pr-12 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#95b721] font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPass ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full bg-[#95b721] hover:bg-[#85a31d] disabled:bg-[#95b721]/50 text-white font-bold py-3.5 rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
              >
                {loginLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span>Entrar con Contraseña</span>
                )}
              </button>
            </form>

            <div className="relative flex items-center justify-center py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <span className="relative bg-white px-4 text-xs font-bold text-gray-400 uppercase">O también</span>
            </div>

            <button
              onClick={handleGoogleLogin}
              className="w-full border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700 font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-3"
            >
              <img src="https://www.google.com/favicon.ico" alt="Google" className="h-5 w-5" />
              <span>Acceder con tu cuenta Google</span>
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ADMIN DASHBOARD
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-[#95b721] pt-6 pb-8 flex flex-col md:flex-row justify-between items-center px-6 md:px-12 relative shadow-sm gap-4">
        <div className="flex items-center gap-4">
          <img src="/logo-abunga.png" alt="Logo" className="w-12 h-12 rounded-full border-2 border-white/20" />
          <div className="bg-white px-6 py-2 rounded-2xl shadow-sm">
            <h1 className="text-lg font-black text-gray-800 uppercase tracking-wider">Consola Admin</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-white/95 hidden md:block">
            <p className="text-xs font-medium uppercase tracking-wider">Sesión activa como:</p>
            <p className="text-sm font-bold">{adminEmail}</p>
          </div>
          <button
            onClick={handleLogout}
            className="bg-[#e24052] hover:bg-[#d03546] text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Salir</span>
          </button>
        </div>

        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <div className="h-1.5 bg-[#e24052]"></div>
          <div className="h-1.5 bg-[#d08635]"></div>
        </div>
      </header>

      {/* Navigation tabs */}
      <div className="bg-white border-b border-gray-200 shadow-xs">
        <div className="container mx-auto px-4 max-w-6xl flex">
          <button
            onClick={() => setActiveTab('products')}
            className={`py-4 px-6 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-all ${
              activeTab === 'products'
                ? 'border-[#95b721] text-[#95b721]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Productos</span>
          </button>
          <button
            onClick={() => setActiveTab('news')}
            className={`py-4 px-6 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-all ${
              activeTab === 'news'
                ? 'border-[#95b721] text-[#95b721]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Noticias y Novedades</span>
          </button>
          <button
            onClick={() => setActiveTab('banners')}
            className={`py-4 px-6 font-extrabold text-sm uppercase tracking-wider flex items-center gap-2 border-b-4 transition-all ${
              activeTab === 'banners'
                ? 'border-[#95b721] text-[#95b721]'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            <Camera className="h-4 w-4" />
            <span>Generador de Fondos</span>
          </button>
        </div>
      </div>

      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {dataLoading ? (
          <div className="flex flex-col items-center justify-center p-24 gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-[#95b721]" />
            <p className="text-gray-500 font-bold">Cargando base de datos...</p>
          </div>
        ) : activeTab === 'products' ? (
          // TAB: PRODUCTS
          <div className="space-y-6 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2 shrink-0">
                <span>Catálogo de Productos</span>
                <span className="text-xs bg-gray-100 text-[#95b721] font-black px-2.5 py-1 rounded-full border border-gray-200">
                  {products.filter(p => {
                    const q = searchQuery.toLowerCase();
                    return !q || p.name?.toLowerCase().includes(q) || p.tipo?.toLowerCase().includes(q) || p.fruta?.toLowerCase().includes(q);
                  }).length} Items
                </span>
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Search bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Buscar por nombre, tipo o fruta..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >✕</button>
                  )}
                </div>
                <button
                  onClick={() => setShowAddProduct(!showAddProduct)}
                  className="bg-[#95b721] hover:bg-[#85a31d] text-white font-extrabold px-5 py-2.5 rounded-full text-sm shadow-md transition-all flex items-center gap-2 shrink-0"
                >
                  <Plus className="h-4 w-4" />
                  <span>Agregar</span>
                </button>
              </div>
            </div>

            {/* ADD PRODUCT FORM */}
            {showAddProduct && (
              <form onSubmit={handleAddProduct} className="bg-white rounded-3xl p-6 border-2 border-[#95b721] shadow-lg space-y-6">
                <h3 className="text-lg font-black text-gray-800 border-b border-gray-100 pb-3">Nuevo Producto</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Nombre</label>
                    <input
                      type="text"
                      placeholder="Ej. Plátano Deshidratado"
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Tipo</label>
                    <select
                      value={newProduct.tipo}
                      onChange={(e) => setNewProduct({ ...newProduct, tipo: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                    >
                      <option value="Fruta">Fruta</option>
                      <option value="Láminas">Láminas</option>
                      <option value="Infusión">Infusión</option>
                      <option value="Mix">Mix</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Fruta / Ingrediente Principal</label>
                    <input
                      type="text"
                      placeholder="Ej. Plátano o Acaí"
                      value={newProduct.fruta}
                      onChange={(e) => setNewProduct({ ...newProduct, fruta: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">URL de Imagen (Cloudinary)</label>
                    <input
                      type="text"
                      placeholder="Ej. https://res.cloudinary.com/... (Dejar vacío para local fallback)"
                      value={newProduct.image}
                      onChange={(e) => setNewProduct({ ...newProduct, image: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Precio Base / Fijo (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej. 10.00"
                      value={newProduct.precio}
                      onChange={(e) => setNewProduct({ ...newProduct, precio: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-gray-600 uppercase">Marca</label>
                    <input
                      type="text"
                      placeholder="Abunga"
                      value={newProduct.brand}
                      onChange={(e) => setNewProduct({ ...newProduct, brand: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                    />
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <h4 className="text-xs font-bold text-gray-600 uppercase mb-3">Precios por Peso (Opcional, sobrescribe el precio base):</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {['50gr', '100gr', '500gr', '1kg'].map((size) => (
                      <div key={size} className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-500 uppercase">Tamaño {size} (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="Ninguno"
                          value={newProduct.precios[size]}
                          onChange={(e) => setNewProduct({
                            ...newProduct,
                            precios: { ...newProduct.precios, [size]: e.target.value }
                          })}
                          className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-gray-100 pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="newProductVisible"
                      checked={newProduct.visible}
                      onChange={(e) => setNewProduct({ ...newProduct, visible: e.target.checked })}
                      className="h-4 w-4 text-[#95b721] border-gray-200 rounded-sm focus:ring-[#95b721]"
                    />
                    <label htmlFor="newProductVisible" className="text-sm font-bold text-gray-700 cursor-pointer">Visible en la web</label>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setShowAddProduct(false)}
                      className="border-2 border-gray-200 hover:bg-gray-50 text-gray-600 font-bold px-6 py-2.5 rounded-xl text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="bg-[#95b721] hover:bg-[#85a31d] text-white font-bold px-6 py-2.5 rounded-xl text-sm shadow-md"
                    >
                      Crear Producto
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* PRODUCT LIST */}
            <div className="space-y-4">
              {products
                .filter(p => {
                  const q = searchQuery.toLowerCase();
                  return !q || p.name?.toLowerCase().includes(q) || p.tipo?.toLowerCase().includes(q) || p.fruta?.toLowerCase().includes(q);
                })
                .map((product) => {
                const idx = products.findIndex(p => p.id === product.id);
                // Asegurarse de que el campo precios esté formateado como objeto para los inputs
                let preciosObj = product.precios || {};
                if (typeof preciosObj === 'string') {
                  try { preciosObj = JSON.parse(preciosObj); } catch (e) { preciosObj = {}; }
                }

                const isUploading = uploadingId === product.id;

                return (
                  <div key={product.id} className={`bg-white rounded-3xl p-6 border shadow-xs transition-all flex flex-col md:flex-row gap-6 items-center ${
                    !product.visible ? 'border-dashed border-red-200 bg-red-50/10' : 'border-gray-100'
                  }`}>
                    {/* Clickable image upload zone */}
                    <label
                      htmlFor={`img-upload-${product.id}`}
                      className="relative shrink-0 w-24 h-24 bg-slate-50 border-2 border-dashed border-gray-200 rounded-2xl flex items-center justify-center overflow-hidden cursor-pointer group hover:border-[#95b721] transition-all"
                      title="Haz clic para subir imagen"
                    >
                      {isUploading ? (
                        <Loader2 className="h-8 w-8 text-[#95b721] animate-spin" />
                      ) : product.image ? (
                        <img src={product.image} alt={product.name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Globe className="h-10 w-10 text-gray-300 group-hover:text-[#95b721] transition-colors" />
                      )}
                      {/* Hover overlay */}
                      {!isUploading && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 rounded-2xl">
                          <Camera className="h-6 w-6 text-white" />
                          <span className="text-white text-[9px] font-bold uppercase">Subir</span>
                        </div>
                      )}
                      {!product.visible && !isUploading && (
                        <div className="absolute bottom-0 left-0 right-0 bg-red-600/85 flex items-center justify-center text-white text-[9px] font-black uppercase py-0.5">
                          Oculto
                        </div>
                      )}
                      <input
                        id={`img-upload-${product.id}`}
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => handleImageUpload(product.id, idx, e.target.files[0])}
                      />
                    </label>

                    {/* Metadata edit */}
                    <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Nombre</label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => handleProductFieldChange(idx, 'name', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Tipo</label>
                        <select
                          value={product.tipo}
                          onChange={(e) => handleProductFieldChange(idx, 'tipo', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                        >
                          <option value="Fruta">Fruta</option>
                          <option value="Láminas">Láminas</option>
                          <option value="Infusión">Infusión</option>
                          <option value="Mix">Mix</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Fruta</label>
                        <input
                          type="text"
                          value={product.fruta}
                          onChange={(e) => handleProductFieldChange(idx, 'fruta', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Precio Base (S/)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={product.precio || ''}
                          onChange={(e) => handleProductFieldChange(idx, 'precio', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                        />
                      </div>

                      <div className="md:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/50 p-3 rounded-2xl border border-gray-100">
                        {['50gr', '100gr', '500gr', '1kg'].map((size) => (
                          <div key={size} className="space-y-1">
                            <label className="text-[9px] font-bold text-gray-500 uppercase">{size} (S/)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={preciosObj[size] || ''}
                              placeholder="Sin definir"
                              onChange={(e) => handleProductPreciosChange(idx, size, e.target.value)}
                              className="w-full px-3 py-1 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#95b721] bg-white"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="md:col-span-4">
                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">URL de Imagen</label>
                        <input
                          type="text"
                          placeholder="Image URL"
                          value={product.image || ''}
                          onChange={(e) => handleProductFieldChange(idx, 'image', e.target.value)}
                          className="w-full px-3 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#95b721]"
                        />
                      </div>
                    </div>

                    {/* Actions and toggle */}
                    <div className="flex flex-row md:flex-col items-center gap-4 w-full md:w-auto shrink-0 md:border-l md:border-gray-100 md:pl-6">
                      <div className="flex items-center gap-2 w-full md:w-auto justify-start md:justify-center">
                        <input
                          type="checkbox"
                          id={`visible-${product.id}`}
                          checked={product.visible}
                          onChange={(e) => handleProductFieldChange(idx, 'visible', e.target.checked)}
                          className="h-4 w-4 text-[#95b721] border-gray-200 rounded-sm focus:ring-[#95b721]"
                        />
                        <label htmlFor={`visible-${product.id}`} className="text-xs font-bold text-gray-700 cursor-pointer">Visible</label>
                      </div>

                      <button
                        onClick={() => saveProduct(product)}
                        className="flex-1 md:w-full bg-[#95b721] hover:bg-[#85a31d] text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
                      >
                        <Save className="h-3.5 w-3.5" />
                        <span>Guardar</span>
                      </button>

                      <button
                        onClick={() => deleteProduct(product.id, product.name)}
                        className="border-2 border-red-100 hover:border-red-200 text-red-500 hover:bg-red-50/50 font-bold py-1.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeTab === 'banners' ? (
          // TAB: BANNER GENERATOR
          <BannerGenerator products={products} />
        ) : (
          // TAB: NEWS
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up">
            {/* ADD NEWS FORM */}
            <div className="lg:col-span-1">
              <form onSubmit={handleAddNews} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-gray-800 border-b border-gray-100 pb-3 flex items-center gap-2">
                  <Plus className="h-5 w-5 text-[#95b721]" />
                  <span>Publicar Novedad</span>
                </h3>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Título de Noticia</label>
                  <input
                    type="text"
                    placeholder="Ej: ¡Nuevo snack de Acaí!"
                    value={newArticle.title}
                    onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721] font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">Contenido</label>
                  <textarea
                    rows="4"
                    placeholder="Describe los detalles de esta noticia o novedad..."
                    value={newArticle.content}
                    onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721] font-medium"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-600 uppercase">URL de Imagen (Cloudinary)</label>
                  <input
                    type="text"
                    placeholder="Ej. https://res.cloudinary.com/... (Opcional)"
                    value={newArticle.image}
                    onChange={(e) => setNewArticle({ ...newArticle, image: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#95b721] hover:bg-[#85a31d] text-white font-bold py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Publicar Novedad</span>
                </button>
              </form>
            </div>

            {/* LIST NEWS */}
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-black text-gray-800">Novedades Publicadas</h3>
              </div>

              {news.length === 0 ? (
                <div className="bg-white border border-gray-100 rounded-3xl p-12 text-center text-gray-500">
                  No hay novedades publicadas actualmente.
                </div>
              ) : (
                <div className="space-y-4">
                  {news.map((item) => (
                    <div key={item.id} className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex gap-6 items-start">
                      <div className="flex-1 space-y-3">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-extrabold text-lg text-gray-900 leading-snug">{item.title}</h4>
                          <span className="text-xs text-gray-400 font-bold whitespace-nowrap">
                            {new Date(item.created_at).toLocaleDateString('es-PE')}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">{item.content}</p>
                        
                        {item.image && (
                          <div className="w-full max-w-md bg-slate-50 border border-gray-100 rounded-2xl overflow-hidden mt-3 max-h-48 flex items-center justify-center">
                            <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => deleteNews(item.id, item.title)}
                        className="bg-red-50 hover:bg-red-100 text-red-500 p-2.5 rounded-xl border border-red-100 shrink-0 transition-all hover:scale-105"
                        title="Eliminar noticia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
