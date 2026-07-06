import Footer from "../../components/footer";
import useCartStore from "../../stores/useCartStore";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Navbar } from "../../components/navbar";

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore();

    const handleMakeOrder = () => {
        let message = "¡Hola Abunga! 🌟 Me gustaría realizar el siguiente pedido:\n\n";
        cart.forEach((item) => {
            const itemTotal = (item.price * item.quantity).toFixed(2);
            message += `*• ${item.name} (${item.selectedWeight})*\n`;
            if (item.brand) message += `  Marca: ${item.brand}\n`;
            if (item.fruits && item.fruits.length > 0) {
                message += `  Contiene: ${item.fruits.join(", ")}\n`;
            }
            message += `  Cantidad: ${item.quantity} x S/ ${item.price.toFixed(2)} = S/ ${itemTotal}\n\n`;
        });
        message += `*Total a pagar:* S/ ${getTotalPrice().toFixed(2)}\n\n`;
        message += "Quedo atento a la confirmación de mi pedido. ¡Gracias!";

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/51973391928?text=${encodedMessage}`;
        window.open(whatsappUrl, "_blank");
    };

    if (cart.length === 0) {
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
        <div className="min-h-screen bg-white flex flex-col">
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

            <main className="container mx-auto px-4 py-8 max-w-6xl grow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {cart.map((item) => (
                            <div key={`${item.id}-${item.selectedWeight}`} className="bg-white p-5 rounded-3xl border-2 border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 relative group">
                                {/* Info del producto (imagen + textos) */}
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
                                
                                {/* Controles (cantidad + precio) */}
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

                                {/* Botón de eliminar */}
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
                        <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-gray-100 sticky top-4">
                            <h3 className="text-2xl font-extrabold text-gray-900 mb-6">Resumen</h3>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex justify-between items-center text-gray-600 text-lg">
                                    <span>Subtotal</span>
                                    <span className="font-bold">S/ {getTotalPrice().toFixed(2)}</span>
                                </div>
                                <div className="h-px bg-dashed bg-gray-300 my-4" />
                                <div className="flex justify-between items-center text-2xl font-black text-gray-900">
                                    <span>Total</span>
                                    <span>S/ {getTotalPrice().toFixed(2)}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleMakeOrder}
                                className="w-full mb-4 flex items-center justify-center gap-2 bg-[#95b721] hover:bg-[#e24052] text-white font-extrabold py-4 rounded-2xl shadow-lg transition-all duration-300 text-lg"
                            >
                                Hacer Pedido
                            </button>

                             <button
                                onClick={clearCart}
                                className="w-full text-red-500 font-bold py-2 text-sm hover:underline"
                            >
                                Vaciar Pedido
                            </button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Cart;
