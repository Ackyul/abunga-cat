import { useState, useEffect, useRef } from "react";
import Footer from "../../components/footer";
import useCartStore from "../../stores/useCartStore";
import useAuthStore from "../../stores/useAuthStore";
import { Link, useNavigate } from "react-router-dom";
import { Trash2, Loader2, MapPin, CreditCard, CheckCircle, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Navbar } from "../../components/navbar";

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuthStore();

    // Estados de checkout multi-pasos
    const [step, setStep] = useState(1); // 1: Cart, 2: Shipping, 3: Yape Payment, 4: Success
    const [nombre, setNombre] = useState("");
    const [telefono, setTelefono] = useState("");
    const [ciudad, setCiudad] = useState("Arequipa");
    const [distrito, setDistrito] = useState("Cayma");
    const [direccion, setDireccion] = useState("");
    const [referencia, setReferencia] = useState("");
    
    // Coordenadas iniciales (Av. Dolores con Calle Los Pinos, Arequipa)
    const [lat, setLat] = useState(-16.4253);
    const [lng, setLng] = useState(-71.5303);
    const [costoEnvio, setCostoEnvio] = useState(0);
    const [estimating, setEstimating] = useState(false);
    const [createdOrder, setCreatedOrder] = useState(null);
    const [polling, setPolling] = useState(false);
    const [tipoEnvio, setTipoEnvio] = useState("delivery"); // "delivery" o "pickup"

    const mapRef = useRef(null);
    const markerRef = useRef(null);

    // Prellenar datos de usuario al cargar
    useEffect(() => {
        if (user) {
            setNombre(user.name || "");
            setTelefono(user.phone || "");
            if (user.ciudad) setCiudad(user.ciudad);
            if (user.distrito) setDistrito(user.distrito);
            if (user.direccion) setDireccion(user.direccion);
            if (user.referencia) setReferencia(user.referencia);
            if (user.latitud) setLat(Number(user.latitud));
            if (user.longitud) setLng(Number(user.longitud));
        }
    }, [user]);

    // Redirección si no está logueado
    useEffect(() => {
        if (!authLoading && !user) {
            navigate("/profile");
        }
    }, [user, authLoading, navigate]);

    // Carga dinámica de Leaflet en el Paso 2 (Solo si se selecciona Arequipa)
    useEffect(() => {
        if (step !== 2 || ciudad !== "Arequipa") return;

        // Cargar CSS de Leaflet
        if (!document.getElementById("leaflet-css")) {
            const link = document.createElement("link");
            link.id = "leaflet-css";
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            document.head.appendChild(link);
        }

        // Inicializar Mapa
        const initLeafletMap = () => {
            if (!window.L) return;
            const container = document.getElementById("map-picker");
            if (!container) return;

            if (container._leaflet_id) return; // Evitar reinicializar

            const map = window.L.map("map-picker").setView([lat, lng], 14);
            mapRef.current = map;

            window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                attribution: '&copy; OpenStreetMap'
            }).addTo(map);

            // Marcador personalizado para producción
            const defaultIcon = window.L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            const marker = window.L.marker([lat, lng], { draggable: true, icon: defaultIcon }).addTo(map);
            markerRef.current = marker;

            const handleLocationUpdate = (latitude, longitude) => {
                setLat(latitude);
                setLng(longitude);
                estimateShipping(latitude, longitude);
            };

            // Estimar la primera vez
            handleLocationUpdate(lat, lng);

            marker.on("dragend", () => {
                const pos = marker.getLatLng();
                handleLocationUpdate(pos.lat, pos.lng);
            });

            map.on("click", (e) => {
                marker.setLatLng(e.latlng);
                handleLocationUpdate(e.latlng.lat, e.latlng.lng);
            });
        };

        if (!window.L) {
            const script = document.createElement("script");
            script.id = "leaflet-js";
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.onload = initLeafletMap;
            document.body.appendChild(script);
        } else {
            const t = setTimeout(initLeafletMap, 150);
            return () => clearTimeout(t);
        }
    }, [step, ciudad, tipoEnvio]);

    // Polling para chequear validación de Yape automática
    useEffect(() => {
        if (!polling || !createdOrder) return;

        let intervalId;
        const checkPaymentStatus = async () => {
            try {
                const res = await fetch("/api/orders/my-orders");
                if (res.ok) {
                    const orders = await res.json();
                    const currentOrder = orders.find(o => o.codigo === createdOrder.codigo);
                    if (currentOrder && currentOrder.estado === "Preparando") {
                        setPolling(false);
                        setStep(4);
                        clearCart();
                        try {
                            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2019/2019-84.wav");
                            audio.play();
                        } catch (e) {
                            // Silenciar error si el navegador bloquea reproducción espontánea
                        }
                    }
                }
            } catch (e) {
                console.error("Error al consultar estado de pago:", e);
            }
        };

        checkPaymentStatus();
        intervalId = setInterval(checkPaymentStatus, 3000);

        return () => clearInterval(intervalId);
    }, [polling, createdOrder, clearCart]);

    // Función para estimar envío
    const estimateShipping = async (latitude, longitude) => {
        setEstimating(true);
        try {
            const res = await fetch("/api/shipping/estimate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ lat: latitude, lng: longitude })
            });
            const data = await res.json();
            if (res.ok) {
                setCostoEnvio(data.cost);
            } else {
                setCostoEnvio(7.00); // Fallback tarifa plana
            }
        } catch (e) {
            console.error("Error estimando envío:", e);
            setCostoEnvio(7.00);
        } finally {
            setEstimating(false);
        }
    };

    // Crear pedido en la base de datos (Step 2 -> Step 3)
    const handleCreateOrder = async (e) => {
        e.preventDefault();
        if (!nombre || !telefono || (tipoEnvio === "delivery" && !direccion)) {
            alert("Por favor llena todos los campos obligatorios.");
            return;
        }

        if (ciudad !== "Arequipa") {
            handleRusticOrder();
            return;
        }

        setEstimating(true);
        try {
            const orderPayload = {
                nombre_cliente: nombre,
                telefono_cliente: telefono,
                ciudad: ciudad,
                direccion: tipoEnvio === "pickup" ? "RECOJO EN TALLER (Av. Dolores con Calle Los Pinos, JLByR)" : `${direccion} (${distrito})`,
                latitud: tipoEnvio === "pickup" ? -16.4253 : lat,
                longitud: tipoEnvio === "pickup" ? -71.5303 : lng,
                referencia: tipoEnvio === "pickup" ? "Recojo en taller físico (portón de garage entre 2 tiendas)" : (referencia || ""),
                items: cart,
                subtotal: parseFloat(getTotalPrice()),
                costo_envio: tipoEnvio === "pickup" ? 0 : parseFloat(costoEnvio),
                total: parseFloat(getTotalPrice()) + (tipoEnvio === "pickup" ? 0 : parseFloat(costoEnvio))
            };

            const res = await fetch("/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderPayload)
            });
            const data = await res.json();
            if (res.ok) {
                setCreatedOrder(data);
                setStep(3);
                setPolling(false); // Desactivar polling automático según preferencia manual del negocio
            } else {
                alert("Error al registrar pedido: " + (data.error || "Intente nuevamente."));
            }
        } catch (err) {
            console.error("Error:", err);
            alert("Error de conexión al registrar pedido.");
        } finally {
            setEstimating(false);
        }
    };

    // Enviar a WhatsApp en caso de ser de otra provincia (Flujo Rústico manual)
    const handleRusticOrder = () => {
        let message = `¡Hola Abunga! 🌟 Soy ${nombre} (Celular: ${telefono}). Me gustaría coordinar un envío nacional:\n\n`;
        cart.forEach((item) => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            message += `*• ${item.name} (${item.selectedWeight})*\n`;
            message += `  Cantidad: ${item.quantity} x S/ ${item.price.toFixed(2)} = S/ ${itemTotal}\n\n`;
        });
        message += `*Subtotal:* S/ ${getTotalPrice().toFixed(2)}\n\n`;
        message += `*Ciudad de destino:* ${ciudad}\n`;
        message += `*Dirección:* ${direccion}\n`;
        message += `Quedo atento a la cotización del envío por Shalom/Olva. ¡Gracias!`;
        
        window.location.href = `https://wa.me/51949237217?text=${encodeURIComponent(message)}`;
    };

    // Estado para mostrar ayuda de soporte si el yape de WhatsApp se demora
    const [showSupportAlert, setShowSupportAlert] = useState(false);

    // Timer de alerta de soporte en Paso 3
    useEffect(() => {
        if (step !== 3) {
            setShowSupportAlert(false);
            return;
        }
        const timer = setTimeout(() => {
            setShowSupportAlert(true);
        }, 15000); // Mostrar ayuda de soporte rápido
        return () => clearTimeout(timer);
    }, [step]);

    // URL de WhatsApp de soporte técnico
    const getWhatsAppSupportUrl = (order) => {
        if (!order) return "";
        let message = `¡Hola Abunga! 🌟 Tengo una consulta sobre mi Pedido *#${order.codigo}*.\n\n`;
        message += `Ya yapeé un monto de S/ ${order.total} y quisiera coordinar su entrega directamente.`;
        return `https://wa.me/51949237217?text=${encodeURIComponent(message)}`;
    };

    // URL de WhatsApp de confirmación manual/éxito
    const getWhatsAppMessageUrl = (order) => {
        if (!order) return "";
        let message = `¡Hola Abunga! 🌟 Acabo de yapear para mi pedido *#${order.codigo}*:\n\n`;
        
        // Agregar productos
        if (order.items && Array.isArray(order.items)) {
            order.items.forEach(item => {
                message += `• *${item.name} (${item.selectedWeight})* x${item.quantity}\n`;
            });
            message += `\n`;
        }
        
        message += `👤 *Cliente:* ${order.nombre_cliente} (${order.telefono_cliente})\n`;
        message += `📍 *Ubicación:* ${order.direccion}\n`;
        if (order.referencia) message += `🔍 *Referencia:* ${order.referencia}\n`;
        
        message += `\n💰 *Total a pagar por Yape (Snacks):* S/ ${parseFloat(order.subtotal || 0).toFixed(2)}\n`;
        if (order.costo_envio > 0) {
            message += `🛵 *Envío inDrive (Pagar en destino):* S/ ${parseFloat(order.costo_envio).toFixed(2)}\n`;
        }
        
        message += `\nAdjunto aquí mi comprobante de Yape para la validación manual. ¡Gracias!`;
        return `https://wa.me/51949237217?text=${encodeURIComponent(message)}`;
    };

    if (authLoading || !user) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-[#95b721]" />
            </div>
        );
    }

    if (cart.length === 0 && step < 4) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-[#95b721] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
                    <div className="flex items-center gap-4 z-10">
                        <Link to="/" className="shrink-0 relative">
                            <img 
                                src="/logo-abunga.png" 
                                alt="Abunga Logo" 
                                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg border-[3px] border-white/20 hover:scale-105 transition-transform"
                            />
                        </Link>
                        <div className="bg-white px-8 py-3 rounded-2xl shadow-md hidden xl:block border-2 border-black/10">
                            <h1 className="text-xl md:text-2xl font-bold tracking-wider text-black uppercase text-center">Tu Pedido</h1>
                        </div>
                    </div>
                    <Navbar />
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col">
                        <div className="h-1.5 bg-[#e24052]"></div>
                        <div className="h-1.5 bg-[#d08635]"></div>
                        <div className="h-1.5 bg-[#e3c561]"></div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-dashed border-gray-300 text-center max-w-md w-full">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Tu pedido está vacío</h2>
                        <p className="text-gray-500 mb-8 text-lg">Parece que aún no has añadido ninguna delicia natural.</p>
                        <Link to="/catalogo">
                            <Button className="w-full bg-[#95b721] hover:bg-[#84a31d] text-white font-bold py-4 text-xl rounded-full shadow-md">
                                Volver al Catálogo
                            </Button>
                        </Link>
                    </div>
                </div>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-[#95b721] py-4 flex flex-row justify-between items-center px-4 md:px-8 relative shadow-sm shrink-0">
                <div className="flex items-center gap-4 z-10">
                    <Link to="/" className="shrink-0 relative">
                        <img 
                            src="/logo-abunga.png" 
                            alt="Abunga Logo" 
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover shadow-lg border-[3px] border-white/20 hover:scale-105 transition-transform"
                        />
                    </Link>
                    <div className="bg-white px-8 py-3 rounded-2xl shadow-md hidden xl:block border-2 border-black/10">
                        <h1 className="text-xl md:text-2xl font-bold tracking-wider text-black uppercase text-center">Tu Pedido</h1>
                    </div>
                </div>
                
                <Navbar />
                
                <div className="absolute bottom-0 left-0 right-0 flex flex-col">
                    <div className="h-1.5 bg-[#e24052]"></div>
                    <div className="h-1.5 bg-[#d08635]"></div>
                    <div className="h-1.5 bg-[#e3c561]"></div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl grow flex flex-col justify-center">
                
                {/* INDICADOR DE PASOS */}
                {step < 4 && (
                    <div className="flex justify-center items-center gap-4 md:gap-8 mb-8 text-sm md:text-base">
                        <div className={`flex items-center gap-2 font-bold ${step >= 1 ? 'text-[#95b721]' : 'text-gray-450'}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-[#95b721] bg-[#95b721]/10' : 'border-gray-300'}`}>1</span>
                            <span>Carrito</span>
                        </div>
                        <div className="w-8 md:w-16 h-0.5 bg-gray-200" />
                        <div className={`flex items-center gap-2 font-bold ${step >= 2 ? 'text-[#95b721]' : 'text-gray-400'}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-[#95b721] bg-[#95b721]/10' : 'border-gray-200'}`}>2</span>
                            <span>Envío</span>
                        </div>
                        <div className="w-8 md:w-16 h-0.5 bg-gray-200" />
                        <div className={`flex items-center gap-2 font-bold ${step >= 3 ? 'text-[#95b721]' : 'text-gray-400'}`}>
                            <span className={`w-7 h-7 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-[#95b721] bg-[#95b721]/10' : 'border-gray-200'}`}>3</span>
                            <span>Pago</span>
                        </div>
                    </div>
                )}

                {/* PASO 1: RESUMEN DE CARRITO */}
                {step === 1 && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-6">
                            {cart.map((item) => (
                                <div key={`${item.id}-${item.selectedWeight}`} className="bg-white p-5 rounded-3xl border-2 border-gray-150/50 shadow-sm flex flex-col md:flex-row gap-4 relative group">
                                    <div className="flex flex-row items-start gap-4 flex-1">
                                        <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 bg-gray-50 rounded-xl p-2 flex items-center justify-center">
                                             <img src={item.image} alt={item.name} className="h-full w-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                        </div>
                                        <div className="flex-1 text-left min-w-0 pr-8">
                                            <h3 className="font-bold text-lg md:text-xl text-gray-900 leading-snug break-words">{item.name}</h3>
                                            <p className="text-gray-500 text-xs md:text-sm uppercase tracking-wide font-semibold mt-0.5">{item.brand}</p>
                                            {item.fruits && item.fruits.length > 0 && (
                                                <div className="mt-1 text-xs md:text-sm text-gray-500 truncate">
                                                    <span className="font-semibold">Contiene:</span> {item.fruits.join(", ")}
                                                </div>
                                            )}
                                            <span className="inline-block mt-2 bg-[#f0fdf4] text-[#95b721] text-xs font-bold px-2 py-0.5 rounded-md border border-[#95b721]/20">
                                                {item.selectedWeight}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 pt-3 md:pt-0 border-t border-gray-100 md:border-t-0 md:mr-12">
                                        <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity - 1)}
                                                className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center bg-white rounded-full shadow-sm font-bold hover:bg-gray-50 disabled:opacity-50 text-sm"
                                                disabled={item.quantity <= 1}
                                            >
                                                -
                                            </button>
                                            <span className="font-bold text-sm md:text-lg w-5 text-center">{item.quantity}</span>
                                            <button 
                                                onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity + 1)}
                                                className="h-7 w-7 md:h-8 md:w-8 flex items-center justify-center bg-white rounded-full shadow-sm font-bold hover:bg-gray-50 text-sm"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <p className="font-black text-xl md:text-2xl text-[#95b721] shrink-0">S/ {(item.price * item.quantity).toFixed(2)}</p>
                                    </div>

                                    <button 
                                        onClick={() => removeFromCart(item.id, item.selectedWeight)}
                                        className="absolute top-4 right-4 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <Trash2 className="h-5 w-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-150 sticky top-4">
                                <h3 className="text-2xl font-extrabold text-gray-900 mb-6">Resumen</h3>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="flex justify-between items-center text-gray-600 text-lg">
                                        <span>Subtotal</span>
                                        <span className="font-bold">S/ {getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    <div className="h-px border-t-2 border-dashed border-gray-200 my-4" />
                                    <div className="flex justify-between items-center text-2xl font-black text-gray-900">
                                        <span>Total</span>
                                        <span>S/ {getTotalPrice().toFixed(2)}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setStep(2)}
                                    className="w-full mb-4 flex items-center justify-center gap-2 bg-[#95b721] hover:bg-[#e24052] text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all duration-300 text-lg cursor-pointer"
                                >
                                    Continuar con Envío <ArrowRight size={18} />
                                </button>

                                 <button
                                    onClick={clearCart}
                                    className="w-full text-red-500 font-bold py-2 text-sm hover:underline cursor-pointer"
                                >
                                    Vaciar Pedido
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 2: DIRECCIÓN Y ENVÍO */}
                {step === 2 && (
                    <form onSubmit={handleCreateOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 bg-white p-6 md:p-8 rounded-3xl border border-gray-150 shadow-sm space-y-6">
                            <h2 className="text-2xl font-black text-gray-800 flex items-center gap-2 mb-4">
                                <MapPin className="text-[#95b721]" /> Datos de Entrega
                            </h2>

                            {/* Selector de Tipo de Envío (Solo si es Arequipa) */}
                            {ciudad === "Arequipa" && (
                                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTipoEnvio("delivery");
                                            estimateShipping(lat, lng);
                                        }}
                                        className={`py-3 px-4 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                                            tipoEnvio === "delivery"
                                                ? "bg-[#95b721] text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        🛵 Envío a Domicilio
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTipoEnvio("pickup");
                                            setCostoEnvio(0);
                                        }}
                                        className={`py-3 px-4 rounded-xl font-extrabold text-sm transition-all cursor-pointer ${
                                            tipoEnvio === "pickup"
                                                ? "bg-[#95b721] text-white shadow-sm"
                                                : "text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        🏪 Recoger en Taller (Gratis)
                                    </button>
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex flex-col text-left">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1">Nombre de quien Recibe *</label>
                                    <input 
                                        type="text" 
                                        required
                                        value={nombre}
                                        onChange={(e) => setNombre(e.target.value)}
                                        className="border border-gray-250 rounded-2xl px-4 py-3 text-sm focus:outline-[#95b721]" 
                                        placeholder="Ej. Juan Pérez"
                                    />
                                </div>
                                <div className="flex flex-col text-left">
                                    <label className="text-xs font-bold text-gray-400 uppercase mb-1">Número de Celular *</label>
                                    <input 
                                        type="tel" 
                                        required
                                        value={telefono}
                                        onChange={(e) => setTelefono(e.target.value)}
                                        className="border border-gray-250 rounded-2xl px-4 py-3 text-sm focus:outline-[#95b721]" 
                                        placeholder="Ej. 987654321"
                                    />
                                </div>
                            </div>

                            {/* Mostrar campos de dirección y mapa si es para envío */}
                            {tipoEnvio === "delivery" || ciudad !== "Arequipa" ? (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="flex flex-col text-left">
                                            <label className="text-xs font-bold text-gray-400 uppercase mb-1">Ciudad *</label>
                                            <select 
                                                value={ciudad}
                                                onChange={(e) => setCiudad(e.target.value)}
                                                className="border border-gray-250 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-[#95b721]"
                                            >
                                                <option value="Arequipa">Arequipa (Entrega Local)</option>
                                                <option value="Otras Ciudades">Otras Ciudades (Envío Nacional)</option>
                                            </select>
                                        </div>
                                        {ciudad === "Arequipa" && (
                                            <div className="flex flex-col text-left">
                                                <label className="text-xs font-bold text-gray-400 uppercase mb-1">Distrito *</label>
                                                <select 
                                                    value={distrito}
                                                    onChange={(e) => setDistrito(e.target.value)}
                                                    className="border border-gray-250 rounded-2xl px-4 py-3 text-sm bg-white focus:outline-[#95b721]"
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
                                    </div>

                                    <div className="flex flex-col text-left">
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-1">Dirección de Entrega (Calle, Av., Nro) *</label>
                                        <input 
                                            type="text" 
                                            required={tipoEnvio === "delivery"}
                                            value={direccion}
                                            onChange={(e) => setDireccion(e.target.value)}
                                            className="border border-gray-250 rounded-2xl px-4 py-3 text-sm focus:outline-[#95b721]" 
                                            placeholder="Ej. Calle Principal 123"
                                        />
                                    </div>

                                    <div className="flex flex-col text-left">
                                        <label className="text-xs font-bold text-gray-400 uppercase mb-1">Referencia adicional (Opcional)</label>
                                        <input 
                                            type="text" 
                                            value={referencia}
                                            onChange={(e) => setReferencia(e.target.value)}
                                            className="border border-gray-250 rounded-2xl px-4 py-3 text-sm focus:outline-[#95b721]" 
                                            placeholder="Ej. Casa frente al parque, timbre de metal"
                                        />
                                    </div>

                                    {ciudad === "Arequipa" ? (
                                        <div className="space-y-2 text-left">
                                            <label className="text-xs font-bold text-gray-400 uppercase">Ubica tu casa en el mapa para el Courier *</label>
                                            <p className="text-xs text-gray-400">Arrastra el marcador rojo o haz clic en tu ubicación exacta.</p>
                                            <div 
                                                id="map-picker" 
                                                className="h-64 md:h-80 w-full rounded-2xl border-2 border-gray-250 shadow-inner z-10"
                                            />
                                        </div>
                                    ) : (
                                        <div className="bg-[#95b721]/5 border border-[#95b721]/20 p-6 rounded-2xl text-left space-y-2">
                                            <h4 className="font-bold text-[#8ca91f] text-base">✈️ Envíos Nacionales</h4>
                                            <p className="text-sm text-gray-600 leading-relaxed">
                                                Realizamos envíos a otras ciudades del Perú mediante **Shalom u Olva Courier** con cobro en destino. 
                                                Al dar clic en continuar, te derivaremos con un mensaje pre-configurado de tu pedido a nuestro WhatsApp para coordinar el costo de envío.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* Mostrar detalles del taller si seleccionan Recoger en Tienda */
                                <div className="bg-[#95b721]/5 border border-[#95b721]/20 p-6 rounded-2xl text-left space-y-4">
                                    <h4 className="font-bold text-[#8ca91f] text-base flex items-center gap-1.5">
                                        🏪 Datos de Recojo en Taller (José Luis Bustamante y Rivero)
                                    </h4>
                                    <div className="text-sm text-gray-600 space-y-3">
                                        <p>📍 <strong>Dirección:</strong> Av. Dolores con Calle Los Pinos (Esquina entre 2 tiendas, portón de garage).</p>
                                        <p>🕒 <strong>Horario de atención:</strong> Lunes a Sábado de 10:00 AM a 8:00 PM.</p>
                                        <div className="h-px bg-[#95b721]/20 my-2" />
                                        <p className="text-xs text-gray-500 italic">Te enviaremos un mensaje automático por WhatsApp cuando tu pedido esté empacado y listo para que pases a recogerlo.</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="lg:col-span-1">
                            <div className="bg-white p-8 rounded-3xl shadow-lg border border-gray-150 sticky top-4 space-y-6">
                                <h3 className="text-2xl font-extrabold text-gray-900 mb-2">Total del Pedido</h3>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-gray-600">
                                        <span>Productos</span>
                                        <span className="font-bold">S/ {getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    {ciudad === "Arequipa" && (
                                        <div className="flex justify-between items-center text-gray-600">
                                            <span>Envío Estimado (inDrive)</span>
                                            {estimating ? (
                                                <Loader2 size={16} className="animate-spin text-[#95b721]" />
                                            ) : (
                                                <span className="font-bold text-gray-500">
                                                    {tipoEnvio === "pickup" ? "Gratis" : `S/ ${costoEnvio.toFixed(2)}`}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                    <div className="h-px border-t-2 border-dashed border-gray-200 my-4" />
                                    <div className="flex justify-between items-center text-2xl font-black text-gray-900">
                                        <span>Total a Yapear</span>
                                        <span>S/ {getTotalPrice().toFixed(2)}</span>
                                    </div>
                                    {tipoEnvio === "delivery" && ciudad === "Arequipa" && (
                                        <p className="text-[11px] text-gray-500 bg-yellow-50 border border-yellow-250/50 p-3 rounded-xl leading-relaxed text-left">
                                            ⚠️ <strong>Nota de Envío:</strong> Los <strong>S/ {costoEnvio.toFixed(2)}</strong> de delivery se pagan directamente al motorizado de inDrive al recibir el pedido. Por Yape solo estás pagando tus productos.
                                        </p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={estimating}
                                    className="w-full flex items-center justify-center gap-2 bg-[#95b721] hover:bg-[#e24052] disabled:opacity-50 text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all duration-300 text-lg cursor-pointer"
                                >
                                    {estimating ? 'Calculando...' : ciudad === 'Arequipa' ? 'Proceder al Pago' : 'Coordinar Envío'} <ArrowRight size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="w-full flex items-center justify-center gap-2 text-gray-500 font-bold py-2 text-sm hover:underline cursor-pointer"
                                >
                                    <ArrowLeft size={14} /> Volver al Carrito
                                </button>
                            </div>
                        </div>
                    </form>
                )}

                {/* PASO 3: PAGO POR YAPE */}
                {step === 3 && createdOrder && (
                    <div className="max-w-2xl mx-auto bg-white p-6 md:p-10 rounded-3xl border border-gray-150 shadow-lg text-center space-y-6">
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-[#95b721]/15 text-[#95b721] mb-2 animate-bounce">
                            <CreditCard size={28} />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">Paga tu Pedido con Yape</h2>
                        
                        {/* Indicador de Próximamente / Manual */}
                        <div className="bg-[#95b721]/5 border border-[#95b721]/20 p-4 rounded-2xl flex items-center justify-between text-left text-sm gap-4">
                            <div>
                                <p className="font-extrabold text-[#8ca91f] flex items-center gap-1.5">
                                    ⚡ Verificación Automática (Yape Pay)
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Estamos finalizando las pruebas del sistema de cobros automatizados. Por ahora, confirma tu compra enviando la captura de tu Yape por WhatsApp.
                                </p>
                            </div>
                            <span className="shrink-0 bg-[#95b721] text-white font-black text-[9px] uppercase tracking-wider px-2 py-1 rounded-md">
                                Próximamente
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                            Escanea el código QR de Yape de Abunga desde tu celular o yapea directamente al número indicado a continuación.
                        </p>

                        <div className="flex flex-col items-center justify-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                            {/* QR Dinámico del API */}
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=yape://pay?phone=973391928`}
                                alt="Yape QR Abunga" 
                                className="w-48 h-48 rounded-xl shadow-md border-2 border-white"
                            />
                            
                            <div className="text-center space-y-1">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide">Titular de Cuenta</p>
                                <p className="font-extrabold text-gray-800 text-lg">Yoshua Josafat Núñez Huaccoto</p>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-wide mt-2">Número de Celular Yape</p>
                                <p className="font-black text-2xl text-[#95b721]">973 391 928</p>
                            </div>
                        </div>

                        <div className="bg-[#e24052]/5 border border-[#e24052]/20 p-5 rounded-2xl space-y-3">
                            <h4 className="font-black text-[#e24052] text-lg">⚠️ ¡MUY IMPORTANTE!</h4>
                            <p className="text-sm text-gray-700 leading-relaxed max-w-lg mx-auto">
                                En la nota/mensaje de tu Yape, debes escribir exactamente el siguiente código de orden para que tu pago sea verificado:
                            </p>
                            <div className="inline-block bg-white border border-[#e24052]/30 px-6 py-3 rounded-xl shadow-xs">
                                <span className="font-mono font-black text-2xl tracking-widest text-[#e24052] select-all">{createdOrder.codigo}</span>
                            </div>
                            <p className="text-xs text-gray-400">Puedes seleccionarlo para copiarlo e ingresarlo en la nota de Yape.</p>
                        </div>

                        <div className="space-y-4">
                            {showSupportAlert && (
                                <div className="bg-yellow-50 border border-yellow-250 p-4 rounded-2xl text-left text-sm text-yellow-800 animate-fade-in space-y-1">
                                    <p className="font-bold">¿Tienes dudas con tu pago?</p>
                                    <p className="text-xs text-yellow-700 leading-relaxed">
                                        Si deseas coordinar detalles adicionales del pedido o soporte directo, puedes contactarnos al chat en un clic.
                                    </p>
                                </div>
                            )}

                            <div className="flex flex-col items-center justify-center gap-3 py-4 w-full">
                                <button
                                    type="button"
                                    onClick={() => {
                                        window.open(getWhatsAppMessageUrl(createdOrder), '_blank');
                                        setStep(4);
                                        clearCart();
                                    }}
                                    className="w-full bg-[#95b721] hover:bg-[#84a31d] text-white font-black py-4 rounded-2xl shadow-lg transition-all text-lg flex items-center justify-center gap-2 cursor-pointer border-none"
                                >
                                    Enviar Comprobante a WhatsApp
                                </button>
                                <p className="text-xs text-gray-400">
                                    Al dar clic se abrirá tu WhatsApp con el mensaje listo. Envíanos la captura de tu Yape para empezar a preparar tu pedido.
                                </p>
                            </div>

                            <div className="h-px bg-gray-200" />

                            <div className="flex flex-col md:flex-row justify-center items-center gap-4">
                                {showSupportAlert && (
                                    <a 
                                        href={getWhatsAppSupportUrl(createdOrder)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full md:w-auto px-6 py-3.5 text-sm font-black text-white bg-[#e24052] hover:bg-[#d03546] rounded-xl transition shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                                    >
                                        Contactar a Soporte por WhatsApp
                                    </a>
                                )}
                                <button
                                    onClick={() => {
                                        if (confirm("¿Estás seguro de cancelar esta orden pendiente?")) {
                                            setStep(1);
                                        }
                                    }}
                                    className="text-red-500 font-bold hover:underline text-sm cursor-pointer"
                                >
                                    Cancelar y volver al carrito
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* PASO 4: ÉXITO */}
                {step === 4 && createdOrder && (
                    <div className="max-w-xl mx-auto bg-white p-6 md:p-10 rounded-3xl border border-gray-150 shadow-xl text-center space-y-6 animate-fade-in">
                        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-green-50 text-green-500 mb-2">
                            <CheckCircle size={48} className="animate-bounce" />
                        </div>
                        <h2 className="text-3xl font-black text-gray-900 leading-tight">¡Pedido Registrado con Éxito! 🎉</h2>
                        <p className="text-sm text-gray-500 max-w-sm mx-auto leading-relaxed">
                            Tu orden ha sido registrada. Por favor, asegúrate de habernos enviado el comprobante por WhatsApp para validar tu transferencia y comenzar la preparación.
                        </p>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-150 text-left space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-wide">Código de Orden</span>
                                <span className="font-mono font-black text-gray-800 text-lg">{createdOrder.codigo}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-400 font-bold uppercase tracking-wide">Estado</span>
                                <span className="inline-block bg-yellow-50 text-yellow-600 border border-yellow-200 text-xs font-black px-2.5 py-0.5 rounded-full">Pendiente de Confirmación</span>
                            </div>
                            <div className="h-px bg-gray-200" />
                            <div className="flex justify-between items-center font-black text-gray-900">
                                <span>Total Pedido (Snacks)</span>
                                <span className="text-xl text-[#95b721]">S/ {parseFloat(createdOrder.subtotal || createdOrder.total).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <a 
                                href={getWhatsAppMessageUrl(createdOrder)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full bg-[#95b721] hover:bg-[#e24052] text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all duration-300 text-lg flex items-center justify-center gap-2 cursor-pointer"
                            >
                                Notificar por WhatsApp (Opcional)
                            </a>
                            
                            <button
                                onClick={() => navigate("/profile")}
                                className="w-full text-gray-600 font-extrabold py-2 text-sm hover:underline cursor-pointer"
                            >
                                Ir a mi Historial de Pedidos
                            </button>
                        </div>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
};

export default Cart;
