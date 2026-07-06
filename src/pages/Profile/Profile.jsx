import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useAuthStore from "../../stores/useAuthStore";
import useCartStore from "../../stores/useCartStore";
import { toast } from "sonner";
import { User, Mail, Calendar, LogOut, ShoppingCart, ArrowRight, Loader2, Key, ArrowLeft, ShieldAlert, Check } from "lucide-react";

const Profile = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  
  // Estados para recuperación de contraseña (Resend Flow)
  const [forgotFlow, setForgotFlow] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: Code & New Password
  const [resetEmail, setResetEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [resetNewPassword, setResetNewPassword] = useState("");
  const [resetConfirmNewPassword, setResetConfirmNewPassword] = useState("");
  const [devCodeAlert, setDevCodeAlert] = useState("");
  const [resetLoading, setResetLoading] = useState(false);

  // Estados para cambiar contraseña (Usuario Logueado)
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmNewPasswordInput, setConfirmNewPasswordInput] = useState("");
  const [changePasswordLoading, setChangePasswordLoading] = useState(false);

  const navigate = useNavigate();
  const { user, loading, login, register, logout } = useAuthStore();
  const { cart, getTotalPrice, getItemsCount } = useCartStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput || (!isLogin && !nameInput)) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    try {
      if (isLogin) {
        await login(emailInput, passwordInput);
        toast.success("¡Sesión iniciada con éxito! Bienvenido de nuevo.");
      } else {
        await register(nameInput, emailInput, passwordInput);
        toast.success("¡Cuenta creada con éxito! Bienvenido a Abunga.");
      }
      // Resetear inputs
      setNameInput("");
      setEmailInput("");
      setPasswordInput("");
    } catch (err) {
      toast.error(err.message || "Ocurrió un error inesperado.");
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Has cerrado sesión correctamente.");
      navigate("/");
    } catch (err) {
      toast.error("Error al cerrar sesión.");
    }
  };

  // Solicitar recuperación de contraseña (Forgot Password)
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      toast.error("Por favor ingresa tu correo electrónico.");
      return;
    }
    setResetLoading(true);
    setDevCodeAlert("");
    try {
      const res = await fetch("/api/users/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: resetEmail })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al solicitar recuperación.");
      }
      toast.success("Código enviado. Revisa tu correo electrónico.");
      setForgotStep(2);
      if (data.devCode) {
        setDevCodeAlert(data.devCode);
      }
    } catch (err) {
      toast.error(err.message || "Error al solicitar recuperación.");
    } finally {
      setResetLoading(false);
    }
  };

  // Restablecer contraseña con código de verificación (Reset Password)
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode || !resetNewPassword || !resetConfirmNewPassword) {
      toast.error("Todos los campos son requeridos.");
      return;
    }
    if (resetNewPassword !== resetConfirmNewPassword) {
      toast.error("Las contraseñas nuevas no coinciden.");
      return;
    }
    setResetLoading(true);
    try {
      const res = await fetch("/api/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: resetEmail,
          code: resetCode,
          newPassword: resetNewPassword
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al restablecer contraseña.");
      }
      toast.success("¡Tu contraseña ha sido restablecida con éxito!");
      setForgotFlow(false);
      setForgotStep(1);
      setResetEmail("");
      setResetCode("");
      setResetNewPassword("");
      setResetConfirmNewPassword("");
      setDevCodeAlert("");
    } catch (err) {
      toast.error(err.message || "Error al restablecer contraseña.");
    } finally {
      setResetLoading(false);
    }
  };

  // Cambiar contraseña estando logueado (Change Password)
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!currentPasswordInput || !newPasswordInput || !confirmNewPasswordInput) {
      toast.error("Todos los campos son requeridos.");
      return;
    }
    if (newPasswordInput !== confirmNewPasswordInput) {
      toast.error("Las nuevas contraseñas no coinciden.");
      return;
    }
    setChangePasswordLoading(true);
    try {
      const res = await fetch("/api/users/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPasswordInput,
          newPassword: newPasswordInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Error al cambiar contraseña.");
      }
      toast.success("Contraseña actualizada con éxito.");
      setShowChangePassword(false);
      setCurrentPasswordInput("");
      setNewPasswordInput("");
      setConfirmNewPasswordInput("");
    } catch (err) {
      toast.error(err.message || "Error al cambiar contraseña.");
    } finally {
      setChangePasswordLoading(false);
    }
  };

  const formattedDate = (dateString) => {
    if (!dateString) return "";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
  };

  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col justify-between">
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
      
      <main className="flex-grow flex items-center justify-center p-4 py-12 animate-fade-in-up">
        {loading ? (
          <div className="bg-white max-w-md w-full rounded-[2.5rem] shadow-xl p-12 text-center flex flex-col items-center justify-center min-h-[300px]">
            <Loader2 className="h-12 w-12 text-[#95b721] animate-spin mb-4" />
            <p className="text-gray-500 font-bold text-lg">Cargando perfil...</p>
          </div>
        ) : user ? (
          /* ================= DASHBOARD DE USUARIO REGISTRADO ================= */
          <div className="bg-white max-w-5xl w-full rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(149,183,33,0.15)] overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            {/* Panel Izquierdo: Información de Perfil */}
            <div className="w-full md:w-1/2 bg-linear-to-br from-[#8ca91f] to-[#bcdb42] p-8 md:p-12 text-white flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img src="/mision.jpg" alt="Natural" className="w-full h-full object-cover opacity-15 mix-blend-overlay" />
              </div>
              
              <div className="relative z-10 space-y-6 text-left">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center shadow-inner">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <span className="text-sm font-black text-white/80 uppercase tracking-widest">Mi Cuenta</span>
                    <h2 className="text-2xl md:text-3xl font-extrabold leading-tight">{user.name}</h2>
                  </div>
                </div>

                <div className="h-px bg-white/20 my-4" />

                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-white/80 shrink-0" />
                    <div>
                      <p className="text-xs text-white/70 font-semibold uppercase">Correo Electrónico</p>
                      <p className="font-bold text-base">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-white/80 shrink-0" />
                    <div>
                      <p className="text-xs text-white/70 font-semibold uppercase">Miembro desde</p>
                      <p className="font-bold text-base">{formattedDate(user.created_at)}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative z-10 pt-8 flex flex-col gap-3">
                <button
                  onClick={() => setShowChangePassword(!showChangePassword)}
                  className="w-fit flex items-center gap-2 bg-white/10 hover:bg-white/20 border border-white/30 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer text-sm"
                >
                  <Key className="w-4 h-4" />
                  <span>{showChangePassword ? "Ver mi Carrito" : "Cambiar Contraseña"}</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-fit flex items-center gap-2 bg-black/10 hover:bg-black/20 border border-black/20 text-white font-bold px-6 py-3 rounded-2xl transition-all duration-300 transform active:scale-95 cursor-pointer text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            </div>

            {/* Panel Derecho: Carrito o Cambiar Contraseña */}
            <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-between text-left">
              {showChangePassword ? (
                /* ================= CAMBIAR CONTRASEÑA (LOGGED IN) ================= */
                <div className="space-y-6">
                  <div className="flex items-center gap-2">
                    <Key className="w-6 h-6 text-[#95b721]" />
                    <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">Cambiar Contraseña</h3>
                  </div>

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Contraseña Actual</label>
                      <input 
                        type="password" 
                        required
                        value={currentPasswordInput}
                        onChange={(e) => setCurrentPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-gray-800 font-medium placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nueva Contraseña</label>
                      <input 
                        type="password" 
                        required
                        value={newPasswordInput}
                        onChange={(e) => setNewPasswordInput(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-gray-800 font-medium placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Confirmar Nueva Contraseña</label>
                      <input 
                        type="password" 
                        required
                        value={confirmNewPasswordInput}
                        onChange={(e) => setConfirmNewPasswordInput(e.target.value)}
                        placeholder="Repite tu nueva contraseña"
                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-gray-800 font-medium placeholder:text-gray-400"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="submit"
                        disabled={changePasswordLoading}
                        className="flex-1 bg-[#95b721] hover:bg-[#e24052] text-white font-bold py-4 rounded-2xl transition-all duration-300 text-center shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                      >
                        {changePasswordLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                        <span>Actualizar Contraseña</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowChangePassword(false)}
                        className="px-6 bg-gray-100 hover:bg-gray-200 text-gray-600 font-bold py-4 rounded-2xl transition-all text-center cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                /* ================= RESUMEN DEL CARRITO (LOGGED IN) ================= */
                <div className="space-y-6 flex flex-col justify-between h-full">
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-6 h-6 text-[#95b721]" />
                      <h3 className="text-2xl font-extrabold text-gray-800 tracking-tight">Mi Carrito Guardado</h3>
                    </div>

                    {cart.length === 0 ? (
                      <div className="bg-gray-50 border border-gray-100 rounded-3xl p-8 text-center space-y-4">
                        <p className="text-gray-500 font-semibold">Tu carrito está vacío ahora mismo.</p>
                        <p className="text-gray-400 text-sm">Agrega productos deliciosos y saludables directamente desde nuestro catálogo en línea.</p>
                        <Link
                          to="/catalogo"
                          className="inline-flex items-center gap-2 bg-[#95b721] hover:bg-[#84a31d] text-white font-extrabold px-6 py-3 rounded-2xl transition-all duration-300 shadow-md"
                        >
                          <span>Ir al Catálogo</span>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <p className="text-gray-600 font-medium">Tienes <span className="font-extrabold text-[#95b721]">{getItemsCount()}</span> producto(s) guardado(s) en tu carrito de compras:</p>
                        
                        {/* Lista corta de ítems en el carrito */}
                        <div className="max-h-48 overflow-y-auto space-y-3 pr-2 scrollbar-thin">
                          {cart.map((item) => (
                            <div key={`${item.id}-${item.selectedWeight}`} className="flex items-center justify-between bg-gray-50 border border-gray-100 p-3 rounded-2xl">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg p-1 shrink-0 flex items-center justify-center">
                                  <img src={item.image} alt={item.name} className="max-h-full max-w-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                <div className="text-left">
                                  <h4 className="font-bold text-sm text-gray-800 truncate max-w-[150px] md:max-w-[200px]">{item.name}</h4>
                                  <p className="text-gray-400 text-[10px] font-semibold">{item.selectedWeight} · Cantidad: {item.quantity}</p>
                                </div>
                              </div>
                              <span className="font-extrabold text-sm text-[#95b721]">S/ {(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                          <span className="text-gray-500 font-bold">Total del Carrito:</span>
                          <span className="text-2xl font-black text-[#95b721]">S/ {getTotalPrice().toFixed(2)}</span>
                        </div>

                        <Link
                          to="/cart"
                          className="w-full flex items-center justify-center gap-2 bg-[#95b721] hover:bg-[#e24052] text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all duration-300 group"
                        >
                          <span>Hacer Pedido</span>
                          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Pie informativo */}
                  <div className="pt-6 text-center text-xs text-gray-400 font-semibold border-t border-gray-50 mt-6 w-full">
                    Tu sesión expira en 30 días de inactividad. Los snacks de Abunga se procesan higiénicamente y con ingredientes locales frescos.
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : forgotFlow ? (
          /* ================= RECUPERACIÓN DE CONTRASEÑA (OUTFIT DE RESEND) ================= */
          <div className="bg-white max-w-lg w-full rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(149,183,33,0.15)] p-8 md:p-12 text-left">
            <button 
              onClick={() => { setForgotFlow(false); setForgotStep(1); setDevCodeAlert(""); }}
              className="flex items-center gap-2 text-gray-500 hover:text-[#8ca91f] font-bold text-sm mb-6 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver a Iniciar Sesión</span>
            </button>

            {forgotStep === 1 ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-extrabold text-[#8ca91f] tracking-tight">Recuperar Contraseña</h3>
                  <p className="text-gray-500 mt-2 font-medium">Ingresa tu correo y te enviaremos un código de seguridad de un solo uso por email.</p>
                </div>

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="email" 
                        required
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-gray-800 font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-[#95b721] hover:bg-[#e24052] text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    <span>Enviar Código de Seguridad</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h3 className="text-3xl font-extrabold text-[#8ca91f] tracking-tight">Ingresa el Código</h3>
                  <p className="text-gray-500 mt-2 font-medium">Hemos enviado el código de verificación de 6 dígitos a <strong className="text-gray-700">{resetEmail}</strong>.</p>
                </div>

                {devCodeAlert && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex gap-3 text-amber-800 text-sm font-semibold animate-pulse">
                    <ShieldAlert className="w-5 h-5 shrink-0 text-amber-500" />
                    <div>
                      <p>Modo de Prueba Local:</p>
                      <p className="font-black text-lg tracking-wider text-[#a20087] mt-1">{devCodeAlert}</p>
                      <p className="font-normal text-xs text-gray-500 mt-0.5">(Copiado aquí porque el envío de correo de Resend está pendiente de verificar el dominio).</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Código de 6 dígitos</label>
                    <input 
                      type="text" 
                      required
                      maxLength={6}
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="123456"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-center font-black tracking-widest text-2xl text-gray-800 placeholder:text-gray-400 placeholder:tracking-normal placeholder:text-base"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nueva Contraseña</label>
                    <input 
                      type="password" 
                      required
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-gray-800 font-medium placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Confirmar Nueva Contraseña</label>
                    <input 
                      type="password" 
                      required
                      value={resetConfirmNewPassword}
                      onChange={(e) => setResetConfirmNewPassword(e.target.value)}
                      placeholder="Repite tu nueva contraseña"
                      className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] text-gray-800 font-medium placeholder:text-gray-400"
                    />
                  </div>

                  <button 
                    type="submit"
                    disabled={resetLoading}
                    className="w-full bg-[#95b721] hover:bg-[#e24052] text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {resetLoading && <Loader2 className="w-5 h-5 animate-spin" />}
                    <span>Restablecer Contraseña</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        ) : (
          /* ================= FORMULARIO DE INICIO DE SESIÓN / REGISTRO ================= */
          <div className="bg-white max-w-5xl w-full rounded-[2.5rem] shadow-[0_20px_50px_-12px_rgba(149,183,33,0.15)] overflow-hidden flex flex-col md:flex-row min-h-[600px]">
            {/* Banner decorativo */}
            <div className="w-full md:w-1/2 bg-linear-to-br from-[#8ca91f] to-[#bcdb42] p-12 text-white hidden md:flex flex-col justify-between relative overflow-hidden">
              <div className="absolute inset-0 z-0">
                <img src="/mision.jpg" alt="Natural" className="w-full h-full object-cover opacity-20 mix-blend-overlay" />
              </div>
              <div className="relative z-10 animate-fade-in text-left" style={{ animationDelay: '100ms' }}>
                <h2 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                  Bienvenido a <br/> Abunga.
                </h2>
                <p className="text-lg text-white/90 font-medium leading-relaxed">
                  Súmate a la comunidad y disfruta de la mejor fruta local convertida en snacks maravillosamente saludables.
                </p>
              </div>
              <div className="relative z-10 space-y-4 animate-fade-in text-left" style={{ animationDelay: '200ms' }}>
                <p className="text-sm font-bold opacity-90 uppercase tracking-widest text-white/90">Natural • Sostenible</p>
                <div className="flex gap-2">
                  <div className="w-12 h-1.5 bg-white rounded-full"></div>
                  <div className="w-4 h-1.5 bg-white/40 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Formulario */}
            <div className="w-full md:w-1/2 p-8 md:p-16 flex flex-col justify-center relative text-left">
              <div className="max-w-md w-full mx-auto space-y-8 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                
                <div className="text-center md:text-left">
                  <h3 className="text-3xl font-extrabold text-[#8ca91f] tracking-tight">
                    {isLogin ? "Iniciar Sesión" : "Crea tu Cuenta"}
                  </h3>
                  <p className="text-gray-500 mt-2 font-medium">
                    {isLogin ? "¡Qué bueno verte de nuevo!" : "Únete a nuestro lado más natural 💚"}
                  </p>
                </div>

                <form className="space-y-5 flex flex-col" onSubmit={handleSubmit}>
                  {!isLogin && (
                    <div className="animate-fade-in">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Nombre Completo</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input 
                          type="text" 
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Juan Pérez"
                          className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] focus:border-transparent transition-all shadow-xs text-gray-800 font-medium placeholder:text-gray-400"
                        />
                      </div>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Correo Electrónico</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="email" 
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="tucorreo@ejemplo.com"
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] focus:border-transparent transition-all shadow-xs text-gray-800 font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5 ml-1">Contraseña</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input 
                        type="password" 
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-hidden focus:ring-2 focus:ring-[#8ca91f] focus:border-transparent transition-all shadow-xs text-gray-800 font-medium placeholder:text-gray-400"
                      />
                    </div>
                  </div>

                  {isLogin && (
                    <div className="flex justify-end animate-fade-in">
                      <button 
                        type="button"
                        onClick={() => { setForgotFlow(true); setForgotStep(1); }}
                        className="text-sm font-bold text-[#8ca91f] hover:text-[#768f18] transition-colors bg-transparent border-0 cursor-pointer"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  )}

                  <button 
                    type="submit"
                    className="w-full bg-linear-to-r mt-4 from-[#9ec425] to-[#8ca91f] text-white font-bold py-4 rounded-2xl hover:from-[#e24052] hover:to-[#cd384e] transition-all duration-300 shadow-[0_10px_20px_-10px_rgba(149,183,33,0.5)] transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>{isLogin ? "Ingresar a mi cuenta" : "Crear mi cuenta"}</span>
                  </button>
                </form>

                <div className="mt-8 text-center border-t border-gray-100 pt-8">
                  <p className="text-gray-600 font-medium">
                    {isLogin ? "¿No tienes una cuenta aún?" : "¿Ya tienes una cuenta?"}
                    <button 
                      onClick={() => {
                        setIsLogin(!isLogin);
                        setNameInput("");
                        setEmailInput("");
                        setPasswordInput("");
                      }}
                      className="ml-2 font-extrabold text-[#8ca91f] hover:text-[#768f18] transition-colors focus:outline-hidden cursor-pointer bg-transparent border-0"
                    >
                      {isLogin ? "Regístrate aquí" : "Inicia sesión"}
                    </button>
                  </p>
                </div>

              </div>
            </div>

          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
