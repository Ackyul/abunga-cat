import { ChevronDown, Sparkles } from "lucide-react";
import * as Collapsible from "@radix-ui/react-collapsible";
import { useState } from "react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { MixtoBuilder } from "./mixto-builder";

export function MobileMixto() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="w-full mb-6 block md:hidden">
      <Collapsible.Root open={isOpen} onOpenChange={setIsOpen} className="bg-white rounded-xl shadow-sm border border-[#95b721] overflow-hidden">
        <Collapsible.Trigger asChild>
          <Button variant="ghost" className="w-full flex items-center justify-between p-4 h-auto hover:bg-[#95b721]/5 bg-[#95b721]/10">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#95b721]" />
              <span className="text-lg font-bold text-[#95b721]">Arma aquí tu mixto</span>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-[#95b721] transition-transform duration-200", isOpen ? "transform rotate-180" : "")} />
          </Button>
        </Collapsible.Trigger>

        <Collapsible.Content className="border-t border-[#95b721]/20 p-4">
            <div className="[&>div]:border-0! [&>div]:shadow-none! [&>div]:p-0 [&>div]:static">
               <MixtoBuilder />
            </div>
        </Collapsible.Content>
      </Collapsible.Root>
    </div>
  );
}
