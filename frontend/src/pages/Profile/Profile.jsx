import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useAuthStore from "../../stores/useAuthStore";
import useCartStore from "../../stores/useCartStore";
import { toast } from "sonner";
import { 
  User, Mail, Phone, Calendar, LogOut, Loader2, Key, Check, 
  Settings, Link2, Link2Off, Eye, EyeOff, AlertCircle, Package, ClipboardList, Clock, Truck, CheckCircle2
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, loading, updateProfile, disconnectGoogle, logout, checkSession 
  } = useAuthStore();
  const { cart } = useCartStore();

  // Estados de navegación
  const [activeTab, setActiveTab] = useState("orders"); // "orders" o "settings"
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Estados de Edición de Perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRegion, setEditRegion] = useState("Arequipa");
  const [editCiudad, setEditCiudad] = useState("Arequipa");
  const [editDistrito, setEditDistrito] = useState("Cayma");
  const [editDireccion, setEditDireccion] = useState("");
  const [editReferencia, setEditReferencia] = useState("");
  const [editLat, setEditLat] = useState(-16.4253);
  const [editLng, setEditLng] = useState(-71.5303);
  const [editLoading, setEditLoading] = useState(false);

  const editMapRef = useRef(null);
  const editMarkerRef = useRef(null);

  // Estados de Cambio de Contraseña
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  // Redireccionar si no está autenticado
  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
    } else if (user) {
      setEditName(user.name || "");
      setEditPhone(user.phone || "");
      setEditRegion(user.region || "Arequipa");
      setEditCiudad(user.ciudad || "Arequipa");
      setEditDistrito(user.distrito || "Cayma");
      setEditDireccion(user.direccion || "");
      setEditReferencia(user.referencia || "");
      setEditLat(Number(user.latitud) || -16.4253);
      setEditLng(Number(user.longitud) || -71.5303);
    }
  }, [user, loading, navigate]);

  // Carga de Leaflet en el perfil si está editando y selecciona Arequipa
  useEffect(() => {
    if (!isEditing || editCiudad !== "Arequipa") return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const initEditMap = () => {
      if (!window.L) return;
      const container = document.getElementById("profile-map-picker");
      if (!container) return;
      if (container._leaflet_id) return;

      const map = window.L.map("profile-map-picker").setView([editLat, editLng], 14);
      editMapRef.current = map;

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      const defaultIcon = window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });

      const marker = window.L.marker([editLat, editLng], { draggable: true, icon: defaultIcon }).addTo(map);
      editMarkerRef.current = marker;

      marker.on("dragend", () => {
        const pos = marker.getLatLng();
        setEditLat(pos.lat);
        setEditLng(pos.lng);
      });

      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setEditLat(e.latlng.lat);
        setEditLng(e.latlng.lng);
      });
    };

    if (!window.L) {
      const script = document.createElement("script");
      script.id = "leaflet-js";
      script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
      script.onload = initEditMap;
      document.body.appendChild(script);
    } else {
      const t = setTimeout(initEditMap, 150);
      return () => clearTimeout(t);
    }
  }, [isEditing, editCiudad]);

  // Obtener pedidos del cliente
  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      setOrdersLoading(true);
      try {
        const res = await fetch("/api/orders/my-orders");
        if (res.ok) {
          const data = await res.json();
          setOrders(data);
        }
      } catch (e) {
        console.error("Error fetching orders:", e);
      } finally {
        setOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user, activeTab]);

  // Manejar query strings de redirecciones de Google OAuth Connection
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("connect_success") === "true") {
      toast.success("¡Tu cuenta de Google se ha conectado correctamente!");
      navigate("/profile", { replace: true });
    } else if (query.get("connect_error") === "already_linked") {
      toast.error("Este correo de Google ya está vinculado a otra cuenta.");
      navigate("/profile", { replace: true });
    } else if (query.get("connect_error") === "true") {
      toast.error("Error al conectar tu cuenta de Google.");
      navigate("/profile", { replace: true });
    }
  }, [location, navigate]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.error("El nombre no puede estar vacío.");
      return;
    }

    setEditLoading(true);
    try {
      await updateProfile(
        editName,
        editPhone || null,
        editCiudad || null,
        editRegion || null,
        editDistrito || null,
        editDireccion || null,
        editReferencia || null,
        editLat,
        editLng
      );
      toast.success("Perfil actualizado correctamente.");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Error al actualizar perfil.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Las nuevas contraseñas no coinciden.");
      return;
    }

    setChangePasswordLoading(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar contraseña.");
      }
      toast.success("Contraseña cambiada con éxito.");
      setShowChangePassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      toast.error(err.message || "Error al cambiar contraseña.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    window.location.href = "/api/users/google?connect=true";
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("¿Seguro que deseas desvincular tu cuenta de Google?")) return;
    try {
      await disconnectGoogle();
      toast.success("Cuenta de Google desvinculada con éxito.");
    } catch (err) {
      toast.error("Error al desvincular cuenta.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Sesión cerrada con éxito.");
      navigate("/");
    } catch (err) {
      toast.error("Error al cerrar sesión.");
    }
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center font-sans">
        <Loader2 className="animate-spin text-[#95b721]" size={48} />
        <p className="mt-4 text-gray-600 font-semibold">Cargando tu cuenta...</p>
      </div>
    );
  }

  const formattedDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "No disponible";

  // Retorna las clases del paso en el stepper
  const getStepClass = (orderStatus, stepName) => {
    const statusOrder = ["Pendiente de Pago", "Preparando", "Enviado", "Entregado"];
    const currentIndex = statusOrder.indexOf(orderStatus);
    const targetIndex = statusOrder.indexOf(stepName);

    if (orderStatus === "Cancelado") return "text-red-500 border-red-200 bg-red-50";
    if (currentIndex >= targetIndex) {
      return "text-[#95b721] border-[#95b721] bg-[#95b721]/10";
    }
    return "text-gray-300 border-gray-200 bg-gray-50";
  };

  // URL para re-yapear / confirmar whatsapp
  const getWhatsAppConfirmUrl = (order) => {
    let message = `¡Hola Abunga! 🌟 Consulto sobre mi pedido *#${order.codigo}*.\n`;
    message += `Estado actual: *${order.estado}*\n`;
    message += `Total: *S/ ${order.total}*`;
    return `https://wa.me/51949237217?text=${encodeURIComponent(message)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 flex flex-col font-sans">
      <header className="bg-linear-to-r from-[#8ca91f] to-[#9ec425] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
        <div className="flex items-center gap-4 z-10">
          <Link to="/" className="shrink-0 relative">
            <img 
              src="/logo-abunga.png" 
              alt="Abunga Logo" 
              className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-xl border-[3px] border-white/20 hover:scale-105 transition-transform"
            />
          </Link>
          <div className="bg-white px-8 py-3 rounded-2xl shadow-md hidden xl:block">
            <img 
              src="/abunga-text.png" 
              alt="Abunga" 
              className="h-10 object-contain"
            />
          </div>
        </div>
        
        <Navbar />
        
        <div className="absolute bottom-0 left-0 right-0 flex flex-col">
          <div className="h-1.5 bg-[#e24052]"></div>
          <div className="h-1.5 bg-[#d08635]"></div>
          <div className="h-1.5 bg-[#e3c561]"></div>
        </div>
      </header>

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-12">
        {/* Cabecera del Dashboard */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 font-capriola">Mi Perfil</h1>
            <p className="text-gray-600 text-sm">Gestiona tus pedidos en curso, datos personales y seguridad</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-semibold text-sm transition border border-red-200 cursor-pointer text-center"
          >
            <LogOut size={16} className="mr-2" />
            Cerrar Sesión
          </button>
        </div>

        {/* Grid de Secciones */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Tarjeta de Resumen del Usuario */}
          <div className="md:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 shadow-md border border-[#95b721]/15 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-[#95b721]"></div>
              
              <div className="w-20 h-20 bg-[#95b721]/10 rounded-full flex items-center justify-center mx-auto text-[#8ca91f] mb-4 shadow-inner">
                <User size={40} />
              </div>

              <h2 className="text-xl font-bold text-gray-900 font-capriola">{user.name}</h2>
              <p className="text-xs text-gray-500 mt-1 break-all">{user.email}</p>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 text-left text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-[#95b721]" />
                  <span>Miembro desde: <strong>{formattedDate}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-[#95b721]" />
                  <span>Teléfono: <strong>{user.phone || "No registrado"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Contenido Tabulado */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Headers de las Tabs */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab("orders")}
                className={`pb-4 px-6 font-black text-sm uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "orders"
                    ? "border-[#95b721] text-[#95b721]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Mis Pedidos
              </button>
              <button
                onClick={() => setActiveTab("settings")}
                className={`pb-4 px-6 font-black text-sm uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === "settings"
                    ? "border-[#95b721] text-[#95b721]"
                    : "border-transparent text-gray-400 hover:text-gray-600"
                }`}
              >
                Configuración
              </button>
            </div>

            {/* CONTENIDO TAB: MIS PEDIDOS */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                {ordersLoading ? (
                  <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                    <Loader2 size={36} className="animate-spin text-[#95b721] mb-2" />
                    <p className="text-gray-500 font-semibold">Cargando tus pedidos...</p>
                  </div>
                ) : orders.length === 0 ? (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200 shadow-xs">
                    <Package size={48} className="text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-gray-900 mb-1">Aún no tienes pedidos</h3>
                    <p className="text-gray-500 text-sm mb-6">Realiza tu primer pedido y recíbelo en la puerta de tu casa en Arequipa.</p>
                    <Link to="/catalogo">
                      <button className="px-6 py-2.5 bg-[#95b721] hover:bg-[#84a31d] text-white rounded-full font-bold text-sm shadow-md transition cursor-pointer">
                        Ver Catálogo
                      </button>
                    </Link>
                  </div>
                ) : (
                  orders.map((order) => (
                    <div key={order.id} className="bg-white rounded-3xl border border-gray-150 shadow-md p-6 space-y-6 text-left">
                      {/* Cabecera del pedido */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-gray-100 pb-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-xl text-gray-900">{order.codigo}</span>
                            {order.estado === "Cancelado" && (
                              <span className="bg-red-50 text-red-600 border border-red-200 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">Cancelado</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 mt-1">Realizado el {new Date(order.created_at).toLocaleDateString("es-PE", { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Total pagado</p>
                          <p className="text-2xl font-black text-[#95b721]">S/ {order.total}</p>
                        </div>
                      </div>

                      {/* Stepper del Estado (Solo si no está cancelado) */}
                      {order.estado !== "Cancelado" ? (
                        <div className="space-y-4">
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Progreso del Envío</p>
                          
                          {/* Línea de Stepper Horizontal */}
                          <div className="relative flex justify-between items-center max-w-xl mx-auto py-2">
                            {/* Barra de progreso de fondo */}
                            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-gray-100 z-0" />
                            
                            <div className="flex flex-col items-center gap-1.5 z-10">
                              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${getStepClass(order.estado, "Pendiente de Pago")}`}>
                                <ClipboardList size={16} />
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-gray-600">Yapeado</span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5 z-10">
                              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${getStepClass(order.estado, "Preparando")}`}>
                                <Clock size={16} />
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-gray-600">Preparando</span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5 z-10">
                              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${getStepClass(order.estado, "Enviado")}`}>
                                <Truck size={16} />
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-gray-600">En Camino</span>
                            </div>

                            <div className="flex flex-col items-center gap-1.5 z-10">
                              <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-bold transition-all ${getStepClass(order.estado, "Entregado")}`}>
                                <CheckCircle2 size={16} />
                              </span>
                              <span className="text-[10px] md:text-xs font-bold text-gray-600">Entregado</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-red-50 border border-red-200 p-4 rounded-2xl flex items-center gap-3 text-red-700">
                          <AlertCircle size={20} className="shrink-0" />
                          <p className="text-sm font-medium">Este pedido ha sido cancelado. Si crees que es un error, por favor contáctanos.</p>
                        </div>
                      )}

                      {/* Detalles del Pedido */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-gray-50/50 p-4 rounded-2xl border border-gray-150">
                        {/* Productos */}
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Productos</p>
                          <div className="space-y-2">
                            {order.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-sm">
                                <span className="font-semibold text-gray-800">{item.name} ({item.selectedWeight}) <span className="text-xs text-gray-400">x{item.quantity}</span></span>
                                <span className="font-bold text-gray-600">S/ {(item.price * item.quantity).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Logística */}
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Dirección de Envío</p>
                            <p className="text-sm text-gray-800 font-medium">{order.direccion}</p>
                            {order.referencia && (
                              <p className="text-xs text-gray-400 italic mt-0.5">Ref: {order.referencia}</p>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Destinatario</p>
                            <p className="text-sm text-gray-800 font-medium">{order.nombre_cliente} ({order.telefono_cliente})</p>
                          </div>
                        </div>
                      </div>

                      {/* Footer de la tarjeta de pedido */}
                      <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-2">
                        <span className="text-xs text-gray-400">Entrega gestionada vía **PedidosYa Envíos Arequipa**</span>
                        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                          {order.tracking_url && (
                            <a 
                              href={order.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-[#95b721] hover:bg-[#84a31d] text-white rounded-xl font-bold text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5 w-full md:w-auto text-center"
                            >
                              <Truck size={14} /> Seguir Pedido en Vivo
                            </a>
                          )}
                          <a 
                            href={getWhatsAppConfirmUrl(order)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2 border border-gray-250 text-gray-600 hover:bg-gray-100 rounded-xl font-bold text-xs transition cursor-pointer w-full md:w-auto text-center"
                          >
                            Preguntar por WhatsApp
                          </a>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* CONTENIDO TAB: CONFIGURACIÓN DE CUENTA */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                {/* Panel de Datos Personales */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-[#95b721]/15">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Settings size={20} className="text-[#95b721]" />
                      Datos Personales
                    </h3>
                    {!isEditing && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="text-sm font-semibold text-[#8ca91f] hover:text-[#95b721] transition cursor-pointer"
                      >
                        Editar Perfil
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Nombre Completo</span>
                        <span className="text-gray-900 text-sm font-medium">{user.name}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Teléfono Móvil</span>
                        <span className="text-gray-900 text-sm font-medium">{user.phone || "No registrado"}</span>
                      </div>
                      <div className="md:col-span-2">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Correo Electrónico</span>
                        <span className="text-gray-900 text-sm font-medium">{user.email}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Región</span>
                        <span className="text-gray-900 text-sm font-medium">{user.region || "No registrada"}</span>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Ciudad</span>
                        <span className="text-gray-900 text-sm font-medium">{user.ciudad || "No registrada"}</span>
                      </div>
                      {user.ciudad === "Arequipa" && (
                        <div>
                          <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Distrito (Solo Arequipa)</span>
                          <span className="text-gray-900 text-sm font-medium">{user.distrito || "No registrado"}</span>
                        </div>
                      )}
                      <div className="md:col-span-2">
                        <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Dirección Predeterminada</span>
                        <span className="text-gray-900 text-sm font-medium">{user.direccion || "No registrada"}</span>
                      </div>
                      {user.referencia && (
                        <div className="md:col-span-2">
                          <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Referencia</span>
                          <span className="text-gray-900 text-sm font-medium">{user.referencia}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form onSubmit={handleUpdateProfile} className="space-y-4 text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Nombre *</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Teléfono</label>
                          <input
                            type="tel"
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                            placeholder="Ej: +51 987 654 321"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Región</label>
                          <input
                            type="text"
                            value={editRegion}
                            onChange={(e) => setEditRegion(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                            placeholder="Ej: Arequipa"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Ciudad</label>
                          <select 
                            value={editCiudad}
                            onChange={(e) => setEditCiudad(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                          >
                            <option value="Arequipa">Arequipa (Entrega Local)</option>
                            <option value="Otras Ciudades">Otras Ciudades (Envío Nacional)</option>
                          </select>
                        </div>
                      </div>

                      {editCiudad === "Arequipa" && (
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Distrito</label>
                          <select 
                            value={editDistrito}
                            onChange={(e) => setEditDistrito(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#95b721]"
                          >
                            <option value="Cayma">Cayma</option>
                            <option value="Yanahuara">Yanahuara</option>
                            <option value="Cercado">Cercado</option>
                            <option value="Jose Luis Bustamante y Rivero">José Luis Bustamante y Rivero</option>
                            <option value="Cerro Colorado">Cerro Colorado</option>
                            <option value="Paucarpata">Paucarpata</option>
                            <option value="Socabaya">Socabaya</option>
                            <option value="Miraflores">Miraflores</option>
                            <option value="Selva Alegre">Selva Alegre</option>
                            <option value="Jacobo Hunter">Jacobo Hunter</option>
                            <option value="Sachaca">Sachaca</option>
                            <option value="Tiabaya">Tiabaya</option>
                            <option value="Characato">Characato</option>
                            <option value="Sabandía">Sabandía</option>
                            <option value="Uchumayo">Uchumayo</option>
                          </select>
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Dirección de Entrega</label>
                        <input
                          type="text"
                          value={editDireccion}
                          onChange={(e) => setEditDireccion(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                          placeholder="Ej: Calle Principal 123"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Referencia de Entrega</label>
                        <input
                          type="text"
                          value={editReferencia}
                          onChange={(e) => setEditReferencia(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                          placeholder="Ej: Portón verde, timbre metálico"
                        />
                      </div>

                      {editCiudad === "Arequipa" && (
                        <div className="space-y-1">
                          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">Ubica tu casa predeterminada en el mapa</label>
                          <p className="text-[10px] text-gray-400">Esto guardará tu ubicación para que no tengas que buscarla en el mapa cada vez que compres.</p>
                          <div 
                            id="profile-map-picker" 
                            className="h-48 w-full rounded-2xl border border-gray-250 shadow-inner z-10"
                          />
                        </div>
                      )}

                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false);
                            setEditName(user.name || "");
                            setEditPhone(user.phone || "");
                            setEditRegion(user.region || "Arequipa");
                            setEditCiudad(user.ciudad || "Arequipa");
                            setEditDistrito(user.distrito || "Cayma");
                            setEditDireccion(user.direccion || "");
                            setEditReferencia(user.referencia || "");
                            setEditLat(Number(user.latitud) || -16.4253);
                            setEditLng(Number(user.longitud) || -71.5303);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          disabled={editLoading}
                          className="flex items-center px-4 py-2 bg-[#95b721] hover:bg-[#84a31d] text-white rounded-xl font-semibold text-sm transition cursor-pointer"
                        >
                          {editLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : "Guardar Cambios"}
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Panel de Conexiones OAuth (Google) */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-[#95b721]/15 text-left">
                  <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                    <Link2 size={20} className="text-[#95b721]" />
                    Cuentas Vinculadas
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">
                    Vincula tu cuenta de Google para iniciar sesión rápidamente sin escribir tu contraseña.
                  </p>

                  <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-150">
                    <div className="flex items-center gap-3">
                      <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">Google OAuth</h4>
                        <p className="text-xs text-gray-600">
                          {user.google_email 
                            ? `Conectado como ${user.google_email}` 
                            : "No conectado"}
                        </p>
                      </div>
                    </div>

                    {user.google_email ? (
                      <button
                        onClick={handleDisconnectGoogle}
                        className="flex items-center text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        <Link2Off size={14} className="mr-1.5" />
                        Desvincular
                      </button>
                    ) : (
                      <button
                        onClick={handleConnectGoogle}
                        className="flex items-center text-xs font-bold text-[#8ca91f] hover:text-[#95b721] bg-[#95b721]/5 hover:bg-[#95b721]/10 border border-[#95b721]/20 px-3 py-1.5 rounded-xl transition cursor-pointer"
                      >
                        <Link2 size={14} className="mr-1.5" />
                        Vincular cuenta
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel de Seguridad / Contraseña */}
                <div className="bg-white rounded-3xl p-6 shadow-md border border-[#95b721]/15 text-left">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Key size={20} className="text-[#95b721]" />
                      Seguridad
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowChangePassword(!showChangePassword)}
                      className="text-sm font-semibold text-[#8ca91f] hover:text-[#95b721] transition cursor-pointer"
                    >
                      {showChangePassword ? "Cancelar" : "Cambiar Contraseña"}
                    </button>
                  </div>

                  {showChangePassword ? (
                    <form onSubmit={handleChangePassword} className="space-y-4 pt-2">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Contraseña Actual</label>
                        <input
                          type="password"
                          required
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                          placeholder="••••••••"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Nueva Contraseña</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                          placeholder="Mínimo 6 caracteres"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Confirmar Nueva Contraseña</label>
                        <input
                          type="password"
                          required
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#95b721] bg-gray-50/50"
                          placeholder="••••••••"
                        />
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="submit"
                          disabled={changePasswordLoading}
                          className="flex items-center px-4 py-2 bg-[#95b721] hover:bg-[#84a31d] text-white rounded-xl font-semibold text-sm transition cursor-pointer"
                        >
                          {changePasswordLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : "Actualizar Contraseña"}
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm text-gray-600">
                      La contraseña está configurada. Puedes actualizarla de forma segura en cualquier momento.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
