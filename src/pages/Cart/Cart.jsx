import Footer from "../../components/footer";
import useCartStore from "../../stores/useCartStore";
import { Link } from "react-router-dom";
import { Trash2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Navbar } from "../../components/navbar";

const Cart = () => {
    const { cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCartStore();

    if (cart.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <header className="bg-[#95b721] pt-8 pb-12 md:pt-14 md:pb-16 flex flex-row justify-between px-4 md:justify-center items-center relative md:gap-4">
                    <div className="relative md:absolute md:left-8 md:top-1/2 md:transform md:-translate-y-1/2 z-10 shrink-0">
                        <img 
                            src="/logo-abunga.png" 
                            alt="Abunga Logo" 
                            className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover shadow-lg"
                        />
                    </div>
                    <div className="bg-white px-8 py-3 md:px-12 rounded-2xl shadow-sm border-2 border-black/10 z-10 mx-4 hidden md:block">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-black uppercase text-center">Tu Cotización</h1>
                    </div>
                    <Navbar />
                    <div className="absolute bottom-0 left-0 right-0 flex flex-col">
                        <div className="h-2 bg-[#e24052]"></div>
                        <div className="h-2 bg-[#d08635]"></div>
                        <div className="h-2 bg-[#e3c561]"></div>
                    </div>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-3xl shadow-lg border-2 border-dashed border-gray-300 text-center max-w-md w-full">
                        <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Tu cotización está vacía</h2>
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
            <header className="bg-[#95b721] pt-8 pb-12 md:pt-16 md:pb-14 flex flex-row justify-between px-4 md:justify-center items-center relative md:gap-4">
                <div className="relative md:absolute md:left-8 md:top-1/2 md:transform md:-translate-y-1/2 z-10 shrink-0">
                    <img 
                        src="/logo-abunga.png" 
                        alt="Abunga Logo" 
                        className="w-20 h-20 md:w-28 md:h-28 rounded-full object-cover shadow-lg"
                    />
                </div>

                <div className="bg-white px-8 py-3 md:px-12 rounded-2xl shadow-sm border-2 border-black/10 z-10 mx-4 hidden md:block">
                    <h1 className="text-2xl md:text-3xl font-bold tracking-wider text-black uppercase text-center">Tu Cotización</h1>
                </div>
                
                <Navbar />
                
                <div className="absolute bottom-0 left-0 right-0 flex flex-col">
                    <div className="h-2 bg-[#e24052]"></div>
                    <div className="h-2 bg-[#d08635]"></div>
                    <div className="h-2 bg-[#e3c561]"></div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-6xl grow">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                        {cart.map((item) => (
                            <div key={`${item.id}-${item.selectedWeight}`} className="bg-white p-4 md:p-8 rounded-3xl border-2 border-gray-100 shadow-sm flex flex-row items-center gap-4 relative group overflow-hidden">
                                <div className="h-20 w-20 md:h-24 md:w-24 shrink-0 bg-gray-50 rounded-xl p-2">
                                     <img src={item.image} alt={item.name} className="h-full w-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
                                </div>
                                <div className="flex-1 text-left w-auto">
                                    <h3 className="font-bold text-xl text-gray-900">{item.name}</h3>
                                    <p className="text-gray-500 text-sm uppercase tracking-wide font-semibold">{item.brand}</p>
                                    {item.fruits && item.fruits.length > 0 && (
                                        <div className="mt-2 text-sm text-gray-500">
                                            <span className="font-semibold">Contiene:</span> {item.fruits.join(", ")}
                                        </div>
                                    )}
                                    <span className="inline-block mt-2 bg-[#f0fdf4] text-[#95b721] text-xs font-bold px-2 py-1 rounded-md border border-[#95b721]/20">
                                        {item.selectedWeight}
                                    </span>
                                </div>
                                
                                <div className="flex flex-col items-end gap-2 w-auto md:mr-12 mt-8 md:mt-0 ml-auto">
                                    <p className="font-black text-lg md:text-2xl text-[#95b721]">S/ {(item.price * item.quantity).toFixed(2)}</p>
                                    <div className="flex items-center gap-3 bg-gray-100 rounded-full p-1">
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity - 1)}
                                            className="h-6 w-6 md:h-8 md:w-8 flex items-center justify-center bg-white rounded-full shadow-sm font-bold hover:bg-gray-50 disabled:opacity-50 text-xs md:text-base"
                                            disabled={item.quantity <= 1}
                                        >
                                            -
                                        </button>
                                        <span className="font-bold text-sm md:text-lg w-4 text-center">{item.quantity}</span>
                                        <button 
                                            onClick={() => updateQuantity(item.id, item.selectedWeight, item.quantity + 1)}
                                            className="h-6 w-6 md:h-8 md:w-8 flex items-center justify-center bg-white rounded-full shadow-sm font-bold hover:bg-gray-50 text-xs md:text-base"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button 
                                    onClick={() => removeFromCart(item.id, item.selectedWeight)}
                                    className="absolute top-4 right-4 md:top-6 md:right-6 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
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
                                onClick={clearCart}
                                className="w-full text-red-500 font-bold py-2 text-sm hover:underline"
                            >
                                Vaciar Cotización
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
