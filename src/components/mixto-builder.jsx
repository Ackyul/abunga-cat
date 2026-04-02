import { useState } from 'react';
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { Label } from "./ui/label";
import { cn } from "../lib/utils";
import useCartStore from "../stores/useCartStore";

const AVAILABLE_FRUITS = [
    "Fresa", "Kiwi", "Mango", 
    "Manzana", "Naranja", "Papaya", 
    "Pera", "Piña", "Plátano", "Toronja"
];

export function MixtoBuilder() {
    const [selectedFruits, setSelectedFruits] = useState([]);
    const [selectedSize, setSelectedSize] = useState("50gr");
    const { addToCart } = useCartStore();

    const prices = {
        "50gr": 20,
        "100gr": 40
    };

    const handleFruitToggle = (fruit) => {
        if (selectedFruits.includes(fruit)) {
            setSelectedFruits(selectedFruits.filter(f => f !== fruit));
        } else {
            if (selectedFruits.length < 5) {
                setSelectedFruits([...selectedFruits, fruit]);
            }
        }
    };

    const handleAddToCart = () => {
        const product = {
            id: `mixto-${Date.now()}`,
            name: "Mixto Fruta Deshidratada",
            price: prices[selectedSize],
            image: "/logo-abunga.png", 
            brand: "Abunga",
            fruits: selectedFruits
        };
        addToCart(product, 1, selectedSize);
        setSelectedFruits([]);
    };

    return (
        <div className="bg-white rounded-3xl shadow-lg p-6 border-2 border-[#95b721] flex flex-col h-fit sticky top-8">
            <h2 className="text-2xl font-bold text-[#95b721] mb-4 text-center">
                Arma tu Mixto
            </h2>
            
            <div className="bg-gray-100 rounded-xl aspect-square mb-6 flex items-center justify-center border border-gray-200">
                <p className="text-gray-400 font-medium">Tu Mix Ideal</p>
            </div>

            <div className="mb-6">
                <p className="text-sm text-gray-600 mb-3 font-medium">
                    Selecciona hasta 5 frutas ({selectedFruits.length}/5):
                </p>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar mb-4">
                    {AVAILABLE_FRUITS.map((fruit) => (
                        <div key={fruit} className="flex items-center space-x-2">
                             <Checkbox 
                                id={`mix-${fruit}`} 
                                checked={selectedFruits.includes(fruit)}
                                onCheckedChange={() => handleFruitToggle(fruit)}
                                disabled={!selectedFruits.includes(fruit) && selectedFruits.length >= 5}
                                className="border-[#95b721] data-[state=checked]:bg-[#95b721]"
                            />
                            <Label 
                                htmlFor={`mix-${fruit}`}
                                className={cn(
                                    "text-sm cursor-pointer",
                                    !selectedFruits.includes(fruit) && selectedFruits.length >= 5 && "opacity-50"
                                )}
                            >
                                {fruit}
                            </Label>
                        </div>
                    ))}
                </div>

                <div className="space-y-3">
                    <p className="text-sm text-gray-600 font-medium">Elige el tamaño:</p>
                    <div className="flex gap-4">
                         <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="size-50" 
                                checked={selectedSize === "50gr"}
                                onCheckedChange={() => setSelectedSize("50gr")}
                                className="border-[#95b721] data-[state=checked]:bg-[#95b721] rounded-full"
                            />
                            <Label htmlFor="size-50" className="cursor-pointer">50gr - S/20</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox 
                                id="size-100" 
                                checked={selectedSize === "100gr"}
                                onCheckedChange={() => setSelectedSize("100gr")}
                                className="border-[#95b721] data-[state=checked]:bg-[#95b721] rounded-full"
                            />
                            <Label htmlFor="size-100" className="cursor-pointer">100gr - S/40</Label>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-auto">
                <div className="flex justify-between items-center mb-4">
                    <span className="text-gray-600 font-medium">Precio:</span>
                    <span className="text-2xl font-bold text-[#95b721]">S/ {prices[selectedSize]}</span>
                </div>
                <Button 
                    className="w-full bg-[#95b721] hover:bg-[#85a31d] text-white font-bold py-6 rounded-xl text-lg shadow-md hover:shadow-lg transition-all"
                    disabled={selectedFruits.length === 0}
                    onClick={handleAddToCart}
                >
                    Añadir al carrito
                </Button>
            </div>
        </div>
    );
}
