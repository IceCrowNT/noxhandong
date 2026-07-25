"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UploadCloud, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportProgressButtonProps extends React.ComponentProps<typeof Button> {
  pendingText?: string;
  icon?: React.ReactNode;
}

export function ImportProgressButton({
  children,
  pendingText = "Đang xử lý dữ liệu...",
  icon = <CheckCircle2 size={17} aria-hidden="true" />,
  className,
  ...props
}: ImportProgressButtonProps) {
  const { pending } = useFormStatus();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pending) {
      setProgress(0);
      // Simulate progress: rapid to 30%, then slow to 60%, then very slow to 95%
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 40) return prev + (Math.random() * 8 + 2);
          if (prev < 75) return prev + (Math.random() * 4 + 1);
          if (prev < 95) return prev + (Math.random() * 1.5 + 0.1);
          return prev;
        });
      }, 500);
    } else {
      setProgress(100);
      const timeout = setTimeout(() => setProgress(0), 500);
      return () => clearTimeout(timeout);
    }
    return () => clearInterval(interval);
  }, [pending]);

  if (!pending) {
    return (
      <Button type="submit" className={className} {...props}>
        {icon}
        <span className="ml-2">{children}</span>
      </Button>
    );
  }

  return (
    <Button 
      type="submit" 
      disabled 
      className={cn("relative overflow-hidden pointer-events-none", className)}
      {...props}
    >
      {/* Progress Fill */}
      <div 
        className="absolute bottom-0 left-0 top-0 bg-white/20 transition-all duration-500 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
      {/* Text */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        <Loader2 size={17} className="animate-spin" />
        {pendingText} ({Math.round(Math.min(progress, 99))}%)
      </div>
    </Button>
  );
}
