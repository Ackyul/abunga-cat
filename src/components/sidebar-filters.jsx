import { ChevronDown, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import useProductStore from "../stores/useProductStore";

export function SidebarFilters() {
  const [isOpen, setIsOpen] = useState(true);
  const [isFrutaOpen, setIsFrutaOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { filters, setFilter, products } = useProductStore();

  const ALL_FRUITS = [
    "Acaí", "Cacao", "Coco", "Fresa", "Mango", 
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
    <div className={cn(
      "bg-white rounded-lg border-r border-[#e5e7eb] shrink-0 transition-all duration-300 ease-in-out relative",
      isCollapsed ? "w-16 p-2" : "w-64 p-4"
    )}>
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full h-6 w-6 shadow-sm z-10 hover:bg-gray-100"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? <PanelLeftOpen className="h-3 w-3" /> : <PanelLeftClose className="h-3 w-3" />}
      </Button>

      <div className={cn("h-full overflow-hidden transition-opacity duration-200", isCollapsed ? "opacity-0 invisible" : "opacity-100 visible")}>
        <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="space-y-2">
          <div className="flex items-center justify-between space-x-4 px-1">
            <h3 className="text-xl font-bold">Tipo</h3>
            <Collapsible.Trigger asChild>
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", isOpen ? "transform rotate-180" : "")} />
                <span className="sr-only">Toggle</span>
              </button>
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content className="space-y-4 pt-2">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="laminas" className="text-lg">Láminas</Label>
              <Checkbox 
                id="laminas" 
                className="h-6 w-6"
                checked={filters.types.includes('Laminas')}
                onCheckedChange={() => handleTypeChange('Laminas')}
              />
            </div>
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="fruta-tipo" className="text-lg">Fruta</Label>
              <Checkbox 
                id="fruta-tipo" 
                className="h-6 w-6"
                checked={filters.types.includes('Fruta')}
                onCheckedChange={() => handleTypeChange('Fruta')}
              />
            </div>
          </Collapsible.Content>
        </Collapsible.Root>
        
        <div className="my-6"><div className="h-px bg-gray-200" /></div>

        <Collapsible.Root className="space-y-4" open={isFrutaOpen} onOpenChange={setIsFrutaOpen}>
          <div className="flex items-center justify-between space-x-4 px-1">
            <h3 className="text-xl font-bold">Fruta</h3>
            <Collapsible.Trigger asChild>
              <button className="p-1 hover:bg-gray-100 rounded-full transition-colors cursor-pointer">
                <ChevronDown className={cn("h-5 w-5 transition-transform duration-200", isFrutaOpen ? "transform rotate-180" : "")} />
                <span className="sr-only">Toggle</span>
              </button>
            </Collapsible.Trigger>
          </div>
          <Collapsible.Content className="space-y-3 pt-2 pl-2">
             <div className="grid grid-cols-1 gap-3">
                {availableFruits.map((fruta) => (
                  <div key={fruta} className="flex items-center justify-between gap-3">
                    <Label htmlFor={`fruit-${fruta}`} className="text-lg font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {fruta}
                    </Label>
                    <Checkbox 
                      id={`fruit-${fruta}`}
                      className="h-6 w-6"
                      checked={filters.fruits.includes(fruta)}
                      onCheckedChange={() => handleFruitChange(fruta)}
                    />
                  </div>
                ))}
                {availableFruits.length === 0 && (
                   <p className="text-gray-400 text-sm italic">No hay frutas disponibles para este tipo.</p>
                )}
             </div>
          </Collapsible.Content>
        </Collapsible.Root>
      </div>
    </div>
  );
}
