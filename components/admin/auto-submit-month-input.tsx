"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Calendar, ChevronLeft, ChevronRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const MONTHS = [
  "Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6",
  "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"
];

export function AutoSubmitMonthInput({ 
  name = "xuat_thang",
  defaultValue, 
  className 
}: { 
  name?: string,
  defaultValue?: string, 
  className?: string 
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [open, setOpen] = useState(false);
  
  // Parse defaultValue (e.g. "2026-07")
  const defaultYear = defaultValue ? parseInt(defaultValue.split("-")[0]) : new Date().getFullYear();
  const defaultMonth = defaultValue ? parseInt(defaultValue.split("-")[1]) - 1 : new Date().getMonth();

  const [currentYear, setCurrentYear] = useState(defaultYear);
  const [selected, setSelected] = useState({ year: defaultYear, month: defaultMonth });

  useEffect(() => {
    if (defaultValue) {
      setCurrentYear(parseInt(defaultValue.split("-")[0]));
      setSelected({
        year: parseInt(defaultValue.split("-")[0]),
        month: parseInt(defaultValue.split("-")[1]) - 1
      });
    }
  }, [defaultValue]);

  const displayValue = `${MONTHS[selected.month]} - ${selected.year}`;

  const handleSelect = (m: number) => {
    setSelected({ year: currentYear, month: m });
    setOpen(false);
    
    const newValue = `${currentYear}-${String(m + 1).padStart(2, "0")}`;
    const currentParams = new URLSearchParams(searchParams?.toString() ?? "");
    currentParams.set(name, newValue);

    startTransition(() => {
      router.push(`${pathname}?${currentParams.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative inline-block">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={isPending}
            className={cn(
              "w-[180px] justify-start text-left font-medium bg-white h-10 border-[var(--line)] shadow-sm disabled:opacity-70 disabled:cursor-wait", 
              className
            )}
          >
            <Calendar className="mr-2 h-4 w-4 text-[var(--muted)]" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-3" align="start">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              onClick={() => setCurrentYear(y => y - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="font-semibold text-sm">Năm {currentYear}</div>
            <Button
              variant="outline"
              className="h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
              onClick={() => setCurrentYear(y => y + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((mName, i) => {
              const isSelected = selected.year === currentYear && selected.month === i;
              return (
                <Button
                  key={i}
                  variant={isSelected ? "default" : "ghost"}
                  className={cn("h-9 w-full text-xs", isSelected ? "font-bold" : "font-normal")}
                  onClick={() => handleSelect(i)}
                >
                  {mName.replace("Tháng ", "T")}
                </Button>
              );
            })}
          </div>
        </PopoverContent>
      </Popover>
      {isPending && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--primary)] pointer-events-none">
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}
    </div>
  );
}
