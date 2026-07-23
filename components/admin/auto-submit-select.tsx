"use client";

import { ReactNode, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface AutoSubmitSelectProps {
  name: string;
  defaultValue?: string;
  className?: string;
  children: ReactNode;
}

export function AutoSubmitSelect({ name, defaultValue, className, children }: AutoSubmitSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value;
    const currentParams = new URLSearchParams(searchParams?.toString() ?? "");
    currentParams.set(name, newValue);

    startTransition(() => {
      // Using scroll: false to prevent jumping to top
      router.push(`${pathname}?${currentParams.toString()}`, { scroll: false });
    });
  };

  return (
    <div className="relative inline-block w-full">
      <select
        name={name}
        defaultValue={defaultValue}
        disabled={isPending}
        className={cn(
          "h-10 min-w-[190px] w-full rounded-md border border-[var(--line)] bg-white px-3 pr-8 text-sm font-medium shadow-sm transition-colors focus:border-[var(--primary)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)] disabled:opacity-70 disabled:cursor-wait",
          className
        )}
        onChange={handleChange}
      >
        {children}
      </select>
      {isPending && (
        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[var(--primary)]">
          <Loader2 size={16} className="animate-spin" />
        </div>
      )}
    </div>
  );
}
