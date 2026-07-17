import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useAuthStore from "../../stores/useAuthStore";
import { toast } from "sonner";
import { Mail, Lock, LogIn, ArrowRight, Loader2, Key, ArrowLeft, AlertCircle } from "lucide-react";

const Login = () => {
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

  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login } = useAuthStore();

  // Redireccionar si ya está logueado
  useEffect(() => {
    if (user && !loading) {
      navigate("/profile");
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      toast.error("Por favor completa todos los campos.");
      return;
    }

    try {
      await login(emailInput, passwordInput);
      toast.success("¡Sesión iniciada con éxito! Bienvenido de nuevo.");
      navigate("/profile");
    } catch (err) {
      toast.error(err.message || "Credenciales incorrectas.");
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = "/api/users/google";
  };

  const handleForgotPasswordRequest = async (e) => {
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

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!resetCode || !resetNewPassword || !resetConfirmNewPassword) {
      toast.error("Por favor completa todos los campos.");
      return;
    }
    if (resetNewPassword !== resetConfirmNewPassword) {
      toast.error("Las contraseñas no coinciden.");
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
        throw new Error(data.error || "Error al reestablecer la contraseña.");
      }
      toast.success("Contraseña reestablecida con éxito. Ya puedes iniciar sesión.");
      setForgotFlow(false);
      setForgotStep(1);
      setEmailInput(resetEmail);
    } catch (err) {
      toast.error(err.message || "Error al reestablecer la contraseña.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex flex-col font-sans">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-green-100 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          
          {/* Header del Formulario */}
          <div className="p-8 pb-4 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-capriola">
              {forgotFlow ? "Recuperar Acceso" : "Iniciar Sesión"}
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              {forgotFlow 
                ? "Te ayudaremos a restablecer tu contraseña en segundos" 
                : "Accede a tu cuenta y disfruta del sabor que retumba"}
            </p>
          </div>

          <div className="p-8 pt-2">
            {!forgotFlow ? (
              /* FORMULARIO DE INICIO DE SESIÓN */
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                    Correo Electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Mail size={18} />
                    </span>
                    <input
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="correo@ejemplo.com"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Contraseña
                    </label>
                    <button
                      type="button"
                      onClick={() => setForgotFlow(true)}
                      className="text-xs font-semibold text-green-600 hover:text-green-700 transition"
                    >
                      ¿La olvidaste?
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                      <Lock size={18} />
                    </span>
                    <input
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-sm bg-gray-50/50"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-semibold text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <Loader2 className="animate-spin mr-2" size={18} />
                  ) : (
                    <>
                      Ingresar
                      <LogIn size={18} className="ml-2" />
                    </>
                  )}
                </button>

                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center" aria-hidden="true">
                    <div className="w-full border-t border-gray-200"></div>
                  </div>
                  <span className="relative px-3 bg-white text-xs text-gray-500 uppercase font-semibold">O continuar con</span>
                </div>

                {/* Botón de Google */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-2xl shadow-sm bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all cursor-pointer"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                    <g transform="matrix(1, 0, 0, 1, 0, 0)">
                      <path d="M21.35,11.1H12v2.7h5.38C16.88,15.76,14.77,17,12,17c-2.76,0-5-2.24-5-5s2.24-5,5-5c1.44,0,2.69,0.59,3.61,1.5l2.1-2.1C16.14,4.9,14.22,4,12,4C7.58,4,4,7.58,4,12s3.58,8,8,8c4.6,0,7.62-3.23,7.62-7.8C19.62,11.75,19.49,11.41,19.35,11.1z" fill="#EA4335" />
                      <path d="M12,4c2.22,0,4.14,0.9,5.71,2.4l2.1-2.1C17.65,2.09,15.02,1,12,1C7.2,1,3.15,3.78,1.29,7.8l2.67,2.07C4.94,6.49,8.23,4,12,4z" fill="#FBBC05" />
                      <path d="M1.29,7.8C0.47,9.64,0,11.72,0,14s0.47,4.36,1.29,6.2l2.67-2.07C3.41,16.94,3,15.52,3,14s0.41-2.94,0.96-4.13L1.29,7.8z" fill="#34A853" />
                      <path d="M12,20c3.77,0,7.06-2.49,8.04-5.87l-2.67-2.07C16.82,14.51,14.58,16,12,16c-2.76,0-5-2.24-5-5c0-0.48,0.07-0.94,0.2-1.39l-2.67-2.07C3.15,9.45,2,11.6,2,14C2,18.42,5.58,22,12,20z" fill="#4285F4" />
                    </g>
                  </svg>
                  Iniciar sesión con Google
                </button>

                <p className="mt-6 text-center text-sm text-gray-600">
                  ¿No tienes una cuenta?{" "}
                  <Link to="/register" className="font-semibold text-green-600 hover:text-green-700 transition">
                    Regístrate aquí
                  </Link>
                </p>
              </form>
            ) : (
              /* FORMULARIO DE RECUPERACIÓN DE CONTRASEÑA */
              <div className="space-y-5">
                {forgotStep === 1 ? (
                  /* PASO 1: Ingresar Email */
                  <form onSubmit={handleForgotPasswordRequest} className="space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Correo de tu cuenta
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <Mail size={18} />
                        </span>
                        <input
                          type="email"
                          required
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="correo@ejemplo.com"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-sm bg-gray-50/50"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-semibold text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      ) : (
                        <>
                          Enviar Código de Recuperación
                          <ArrowRight size={18} className="ml-2" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  /* PASO 2: Ingresar Código y nueva contraseña */
                  <form onSubmit={handleResetPassword} className="space-y-5">
                    {devCodeAlert && (
                      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl text-xs text-yellow-800 flex items-start">
                        <AlertCircle className="mr-2 flex-shrink-0 mt-0.5" size={16} />
                        <div>
                          <strong>Código Dev:</strong> {devCodeAlert} (Solo visible para pruebas en este ambiente).
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Código de 6 dígitos
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                          <Key size={18} />
                        </span>
                        <input
                          type="text"
                          maxLength={6}
                          required
                          value={resetCode}
                          onChange={(e) => setResetCode(e.target.value)}
                          placeholder="123456"
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-sm bg-gray-50/50 text-center tracking-widest font-mono text-lg font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Mínimo 6 caracteres"
                        className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-sm bg-gray-50/50"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                        Confirmar Nueva Contraseña
                      </label>
                      <input
                        type="password"
                        required
                        value={resetConfirmNewPassword}
                        onChange={(e) => setResetConfirmNewPassword(e.target.value)}
                        placeholder="Repite la contraseña"
                        className="block w-full px-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all text-sm bg-gray-50/50"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={resetLoading}
                      className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-semibold text-white bg-green-500 hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-400 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {resetLoading ? (
                        <Loader2 className="animate-spin mr-2" size={18} />
                      ) : (
                        "Restablecer Contraseña"
                      )}
                    </button>
                  </form>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setForgotFlow(false);
                    setForgotStep(1);
                  }}
                  className="w-full mt-4 flex items-center justify-center text-xs font-semibold text-gray-500 hover:text-gray-700 transition"
                >
                  <ArrowLeft size={14} className="mr-1.5" />
                  Volver al inicio de sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
