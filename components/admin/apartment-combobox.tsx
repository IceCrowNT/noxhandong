"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { normalizeFreeText } from "@/src/modules/shared/utils/text";

type ApartmentComboboxProps = {
  name?: string;
  defaultValue?: string;
  placeholder?: string;
  apartments: string[];
  onChange?: (value: string) => void;
  className?: string;
  disabled?: boolean;
};

export function ApartmentCombobox({
  name,
  defaultValue = "",
  placeholder = "Ví dụ L4B.303",
  apartments,
  onChange,
  className,
  disabled,
}: ApartmentComboboxProps) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(defaultValue);

  const [search, setSearch] = useState("");

  const filteredApartments = useMemo(() => {
    if (!search) return apartments.slice(0, 50);

    const normalizedSearch = normalizeFreeText(search).replace(/\s/g, "");
    const guessSearch = normalizedSearch
        .replace(/LO(\d+[A-C]?)/, "L$1")
        .replace(/TOA(\d+[A-C]?)/, "L$1");
    const strippedSearch = guessSearch.replace(/(LK|L)0+(\d)/, "$1$2");

    return apartments.filter((itemValue) => {
      const normalizedItem = normalizeFreeText(itemValue).replace(/\s/g, "");
      const strippedItem = normalizedItem.replace(/(LK|L)0+(\d)/, "$1$2");
      return strippedItem.includes(strippedSearch) || normalizedItem.includes(normalizedSearch);
    }).slice(0, 50);
  }, [apartments, search]);

  const handleSelect = (currentValue: string) => {
    // cmdk returns itemValue in lowercase, so we need to find original case from the list
    const originalValue = apartments.find((a) => a.toLowerCase() === currentValue.toLowerCase()) || currentValue;
    const finalValue = originalValue === value ? "" : originalValue;
    setValue(finalValue);
    setOpen(false);
    if (onChange) onChange(finalValue);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between font-normal hover:bg-white bg-white/50 border-[var(--line)]", className, !value && "text-[var(--muted)]")}
            disabled={disabled}
          >
            {value ? value : placeholder}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[200px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput placeholder="Tìm mã căn..." value={search} onValueChange={setSearch} />
            <CommandList>
              <CommandEmpty>Không tìm thấy căn.</CommandEmpty>
              <CommandGroup>
                {filteredApartments.map((code) => (
                  <CommandItem
                    key={code}
                    value={code}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value.toLowerCase() === code.toLowerCase() ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {code}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {name && <input type="hidden" name={name} value={value} />}
    </>
  );
}
