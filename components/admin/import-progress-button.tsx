"use client";

import { useFormStatus } from "react-dom";
import { useEffect, useState, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
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
  const [isRedirecting, setIsRedirecting] = useState(false);

  const wasPendingRef = useRef(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Reset toàn bộ trạng thái khi URL thay đổi (trang đã reload/chuyển hướng xong)
  useEffect(() => {
    setIsRedirecting(false);
    setProgress(0);
    wasPendingRef.current = false;
  }, [pathname, searchParams]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (pending) {
      wasPendingRef.current = true;
      setIsRedirecting(false);
      setProgress(0);

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 40) return prev + (Math.random() * 8 + 2);
          if (prev < 75) return prev + (Math.random() * 4 + 1);
          if (prev < 95) return prev + (Math.random() * 1.5 + 0.1);
          return prev;
        });
      }, 500);
    } else {
      // Khi pending về false, nếu trước đó form vừa thực sự submit
      if (wasPendingRef.current) {
        setIsRedirecting(true); // Khóa cứng nút chờ tải trang
        setProgress(100);       // Kéo thanh chạy lên 100%
        wasPendingRef.current = false;
      }
    }

    return () => clearInterval(interval);
  }, [pending]);

  const isLoading = pending || isRedirecting;

  if (!isLoading) {
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
        {isRedirecting ? "Đang xử lý dữ liệu..." : `${pendingText} (${Math.round(Math.min(progress, 99))}%)`}
      </div>
    </Button>
  );
}
