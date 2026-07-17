import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useAuthStore from "../../stores/useAuthStore";
import useCartStore from "../../stores/useCartStore";
import { toast } from "sonner";
import { 
  User, Mail, Phone, Calendar, LogOut, Loader2, Key, Check, 
  Settings, Link2, Link2Off, Eye, EyeOff, AlertCircle
} from "lucide-react";

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    user, loading, updateProfile, disconnectGoogle, logout, checkSession 
  } = useAuthStore();
  const { cart } = useCartStore();

  // Estados de Edición de Perfil
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editLoading, setEditLoading] = useState(false);

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
    }
  }, [user, loading, navigate]);

  // Manejar query strings de redirecciones de Google OAuth Connection
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    if (query.get("connect_success") === "true") {
      toast.success("¡Tu cuenta de Google se ha conectado correctamente!");
      // Limpiar query params sin recargar
      navigate("/profile", { replace: true });
      checkSession();
    } else if (query.get("connect_error")) {
      const err = query.get("connect_error");
      if (err === "email_already_linked") {
        toast.error("Este correo de Google ya está vinculado a otra cuenta.");
      } else {
        toast.error("Error al conectar tu cuenta de Google.");
      }
      navigate("/profile", { replace: true });
    }
  }, [location, navigate, checkSession]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName) {
      toast.error("El nombre es requerido.");
      return;
    }
    setEditLoading(true);
    try {
      await updateProfile(editName, editPhone || null);
      toast.success("Datos del perfil actualizados correctamente.");
      setIsEditing(false);
    } catch (err) {
      toast.error(err.message || "Error al actualizar perfil.");
    } finally {
      setEditLoading(false);
    }
  };

  const handleConnectGoogle = () => {
    // Redirigir al endpoint de conexión
    window.location.href = "/api/users/google?connect=true";
  };

  const handleDisconnectGoogle = async () => {
    if (!window.confirm("¿Seguro que deseas desvincular tu cuenta de Google?")) return;
    try {
      await disconnectGoogle();
      toast.success("Cuenta de Google desvinculada con éxito.");
    } catch (err) {
      toast.error(err.message || "Error al desvincular cuenta.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      toast.error("Por favor completa todos los campos.");
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
        <Loader2 className="animate-spin text-green-500" size={48} />
        <p className="mt-4 text-gray-600 font-semibold">Cargando tu cuenta...</p>
      </div>
    );
  }

  // Obtener fecha legible
  const formattedDate = user.created_at 
    ? new Date(user.created_at).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "No disponible";

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow max-w-5xl w-full mx-auto px-4 py-12">
        {/* Cabecera del Dashboard */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 font-capriola">Mi Perfil</h1>
            <p className="text-gray-600 text-sm">Gestiona tus datos personales, seguridad y conexiones</p>
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
            <div className="bg-white rounded-3xl p-6 shadow-md border border-green-100 text-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-2 bg-green-500"></div>
              
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto text-green-600 mb-4 shadow-inner">
                <User size={40} />
              </div>

              <h2 className="text-xl font-bold text-gray-900 font-capriola">{user.name}</h2>
              <p className="text-xs text-gray-500 mt-1 break-all">{user.email}</p>

              <div className="mt-6 pt-6 border-t border-gray-100 space-y-4 text-left text-sm text-gray-600">
                <div className="flex items-center gap-3">
                  <Calendar size={16} className="text-green-500" />
                  <span>Miembro desde: <strong>{formattedDate}</strong></span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone size={16} className="text-green-500" />
                  <span>Teléfono: <strong>{user.phone || "No registrado"}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Formularios e Integraciones */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Panel de Datos Personales */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-green-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Settings size={20} className="text-green-500" />
                  Datos Personales
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-sm font-semibold text-green-600 hover:text-green-700 transition cursor-pointer"
                  >
                    Editar Perfil
                  </button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>
              ) : (
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Nombre</label>
                      <input
                        type="text"
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">Teléfono</label>
                      <input
                        type="tel"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50"
                        placeholder="Ej: +52 123 456 7890"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setEditName(user.name || "");
                        setEditPhone(user.phone || "");
                      }}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl font-semibold text-sm transition cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={editLoading}
                      className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition cursor-pointer"
                    >
                      {editLoading ? <Loader2 size={16} className="animate-spin mr-2" /> : "Guardar Cambios"}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Panel de Conexiones OAuth (Google) */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-green-100">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-4">
                <Link2 size={20} className="text-green-500" />
                Cuentas Vinculadas
              </h3>
              <p className="text-xs text-gray-500 mb-6">
                Vincula tu cuenta de Google para iniciar sesión rápidamente sin escribir tu contraseña.
              </p>

              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-gray-50 border border-gray-150">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,15.76,14.77,17,12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5c1.44,0,2.69,0.59,3.61,1.5l2.1-2.1C16.14,4.9,14.22,4,12,4C7.58,4,4,7.58,4,12s3.58,8,8,8c4.6,0,7.62-3.23,7.62-7.8C19.62,11.75,19.49,11.41,19.35,11.1z" fill="#EA4335" />
                      <path d="M12,4c2.22,0,4.14,0.9,5.71,2.4l2.1-2.1C17.65,2.09,15.02,1,12,1C7.2,1,3.15,3.78,1.29,7.8l2.67,2.07C4.94,6.49,8.23,4,12,4z" fill="#FBBC05" />
                      <path d="M1.29,7.8C0.47,9.64,0,11.72,0,14s0.47,4.36,1.29,6.2l2.67-2.07C3.41,16.94,3,15.52,3,14s0.41-2.94,0.96-4.13L1.29,7.8z" fill="#34A853" />
                      <path d="M12,20c3.77,0,7.06-2.49,8.04-5.87l-2.67-2.07C16.82,14.51,14.58,16,12,16c-2.76,0-5-2.24-5-5c0-0.48,0.07-0.94,0.2-1.39l-2.67-2.07C3.15,9.45,2,11.6,2,14C2,18.42,5.58,22,12,20z" fill="#4285F4" />
                    </g>
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
                    className="flex items-center text-xs font-bold text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                  >
                    <Link2 size={14} className="mr-1.5" />
                    Vincular cuenta
                  </button>
                )}
              </div>
            </div>

            {/* Panel de Seguridad / Contraseña */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-green-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Key size={20} className="text-green-500" />
                  Seguridad
                </h3>
                <button
                  type="button"
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="text-sm font-semibold text-green-600 hover:text-green-700 transition cursor-pointer"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50"
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
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-400 bg-gray-50/50"
                      placeholder="••••••••"
                    />
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={changePasswordLoading}
                      className="flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition cursor-pointer"
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
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
