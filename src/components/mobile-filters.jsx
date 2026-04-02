import { ChevronDown, Filter } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import useProductStore from "../stores/useProductStore";

export function MobileFilters() {
  const [isOpen, setIsOpen] = useState(false);
  const { filters, setFilter, products } = useProductStore();

  const ALL_FRUITS = [
    "Asaí", "Cacao", "Coco", "Fresa", "Mango", 
    "Manzana", "Maracuyá", "Papaya", 
    "Piña", "Plátano", "Sandía", "Tamarindo"
  ];

  const availableFruits = filters.types.length === 0 
    ? ALL_FRUITS
    : ALL_FRUITS.filter(fruit => {
        return products.some(p => {
          const typeMatch = filters.types.some(t => {
             if (t === 'Laminas') return p.tipo.includes('Láminas');
             return p.tipo === t;
          });
          return typeMatch && p.fruta === fruit;
        });
    });

  const handleTypeChange = (value) => {
    setFilter('types', value);
  };

  const handleFruitChange = (value) => {
    setFilter('fruits', value);
  };

  return (
    <div className="w-full mb-6 block md:hidden">
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto hover:bg-gray-50 text-gray-900">
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-[#95b721]" />
              <span className="text-lg font-bold">Filtros</span>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-gray-500 transition-transform duration-200", isOpen ? "transform rotate-180" : "")} />
          </Button>
        </Collapsible.Trigger>

        <Collapsible.Content className="border-t border-gray-100">
          <div className="p-4 space-y-6">
            
            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-base">Tipo</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Checkbox 
                    id="mobile-laminas" 
                    className="h-5 w-5"
                    checked={filters.types.includes('Laminas')}
                    onCheckedChange={() => handleTypeChange('Laminas')}
                  />
                  <Label htmlFor="mobile-laminas" className="text-base font-medium text-gray-700">Láminas</Label>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
                  <Checkbox 
                    id="mobile-fruta" 
                    className="h-5 w-5"
                    checked={filters.types.includes('Fruta')}
                    onCheckedChange={() => handleTypeChange('Fruta')}
                  />
                  <Label htmlFor="mobile-fruta" className="text-base font-medium text-gray-700">Fruta</Label>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-100" />

            <div className="space-y-3">
              <h3 className="font-bold text-gray-900 text-base">Frutas</h3>
              <div className="grid grid-cols-2 gap-3">
                {availableFruits.map((fruta) => (
                  <div key={fruta} className="flex items-center gap-2">
                    <Checkbox 
                      id={`mobile-fruit-${fruta}`}
                      className="h-5 w-5"
                      checked={filters.fruits.includes(fruta)}
                      onCheckedChange={() => handleFruitChange(fruta)}
                    />
                    <Label htmlFor={`mobile-fruit-${fruta}`} className="text-sm font-medium leading-none text-gray-700">
                      {fruta}
                    </Label>
                  </div>
                ))}
              </div>
               {availableFruits.length === 0 && (
                  <p className="text-gray-400 text-sm italic">No hay frutas disponibles.</p>
               )}
            </div>

          </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
