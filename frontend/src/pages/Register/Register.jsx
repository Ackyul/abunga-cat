import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Navbar } from "../../components/navbar";
import Footer from "../../components/footer";
import useAuthStore from "../../stores/useAuthStore";
import { toast } from "sonner";
import { User, Mail, Phone, Lock, UserPlus, Loader2 } from "lucide-react";

const Register = () => {
  const [nameInput, setNameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");

  const navigate = useNavigate();
  const { user, loading, register } = useAuthStore();

  // Redireccionar si ya está logueado
  useEffect(() => {
    if (user && !loading) {
      const returnTo = sessionStorage.getItem("last_visited_page") || "/profile";
      navigate(returnTo);
    }
  }, [user, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nameInput || !emailInput || !passwordInput) {
      toast.error("Por favor completa todos los campos requeridos.");
      return;
    }

    try {
      await register(nameInput, emailInput, passwordInput, phoneInput || null);
      toast.success("¡Cuenta creada con éxito! Bienvenido a Abunga.");
      const returnTo = sessionStorage.getItem("last_visited_page") || "/profile";
      navigate(returnTo);
    } catch (err) {
      toast.error(err.message || "Error al registrarse. Intenta de nuevo.");
    }
  };

  const handleGoogleLogin = () => {
    const returnTo = sessionStorage.getItem("last_visited_page") || "/profile";
    window.location.href = `/api/users/google?returnTo=${encodeURIComponent(returnTo)}`;
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

      <div className="flex-grow flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-md rounded-3xl shadow-xl border border-[#95b721]/15 overflow-hidden transition-all duration-300 hover:shadow-2xl">
          
          {/* Header del Formulario */}
          <div className="p-8 pb-4 text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight font-capriola">
              Crear Cuenta
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Únete a Abunga y empieza a coleccionar momentos saludables
            </p>
          </div>

          <div className="p-8 pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Nombre Completo <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <User size={18} />
                  </span>
                  <input
                    type="text"
                    required
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Tu nombre"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#95b721] focus:border-transparent transition-all text-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Correo Electrónico <span className="text-red-500">*</span>
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#95b721] focus:border-transparent transition-all text-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Número de Teléfono <span className="text-gray-400">(Opcional)</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Phone size={18} />
                  </span>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    placeholder="+52 123 456 7890"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#95b721] focus:border-transparent transition-all text-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                    <Lock size={18} />
                  </span>
                  <input
                    type="password"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#95b721] focus:border-transparent transition-all text-sm bg-gray-50/50"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center py-3.5 px-4 border border-transparent rounded-2xl shadow-md text-sm font-semibold text-white bg-[#95b721] hover:bg-[#84a31d] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95b721] transition-all cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" size={18} />
                ) : (
                  <>
                    Crear Cuenta
                    <UserPlus size={18} className="ml-2" />
                  </>
                )}
              </button>

              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <span className="relative px-3 bg-white text-xs text-gray-500 uppercase font-semibold">O registrarse con</span>
              </div>

              {/* Botón de Google */}
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-200 rounded-2xl shadow-sm bg-white hover:bg-gray-50 text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95b721] transition-all cursor-pointer"
              >
                <svg className="w-5 h-5 mr-3 shrink-0" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Registrarse con Google
              </button>

              <p className="mt-6 text-center text-sm text-gray-600">
                ¿Ya tienes una cuenta?{" "}
                <Link to="/login" className="font-semibold text-[#8ca91f] hover:text-[#95b721] transition">
                  Inicia sesión aquí
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
