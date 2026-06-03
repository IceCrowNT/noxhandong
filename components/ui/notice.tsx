import * as React from "react";
import { AlertTriangle, CheckCircle2, Info } from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeTone = "success" | "error" | "warning" | "info";

const toneClass: Record<NoticeTone, string> = {
  success: "border-emerald-200 bg-emerald-50 text-emerald-950",
  error: "border-red-200 bg-red-50 text-red-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  info: "border-slate-200 bg-slate-50 text-slate-950",
};

const toneIcon: Record<NoticeTone, React.ElementType> = {
  success: CheckCircle2,
  error: AlertTriangle,
  warning: AlertTriangle,
  info: Info,
};

export function Notice({
  children,
  tone = "info",
  className,
}: {
  children: React.ReactNode;
  tone?: NoticeTone;
  className?: string;
}) {
  const Icon = toneIcon[tone];

  return (
    <div
      className={cn(
        "mb-4 flex items-start gap-3 rounded-lg border px-4 py-3 text-[15px] font-semibold leading-6 shadow-sm",
        toneClass[tone],
        className
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
