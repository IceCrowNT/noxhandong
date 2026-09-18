"use client";

import { useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function AjaxForm({
  action,
  children,
  className,
  title,
  resetOnSuccess,
  confirmMessage,
}: {
  action: (formData: FormData) => Promise<{ error?: string; success?: boolean; message?: string }>;
  children: React.ReactNode;
  className?: string;
  title?: string;
  resetOnSuccess?: boolean;
  confirmMessage?: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  const formAction = async (formData: FormData) => {
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    
    // Kiểm tra dung lượng tổng của tất cả các file trước khi gửi
    let totalSize = 0;
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        totalSize += value.size;
      }
    }
    if (totalSize > 19 * 1024 * 1024) {
      toast.error("Tổng dung lượng tải lên vượt quá 19MB. Vui lòng chọn file nhỏ hơn.");
      return;
    }
    
    try {
      const res = await action(formData);
      if (res?.error) {
        toast.error(res.error);
      } else if (res?.success) {
        if (res.message) toast.success(res.message);
        if (resetOnSuccess) {
          formRef.current?.reset();
        }
      }
    } catch (err) {
      toast.error("Đã có lỗi xảy ra. Vui lòng thử lại.");
    }
  };

  return (
    <form ref={formRef} action={formAction} className={className} title={title}>
      {children}
    </form>
  );
}

export function DetailsCancelButton({ className }: { className?: string }) {
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={className}
      onClick={(e) => {
        const details = e.currentTarget.closest("details");
        if (details) details.removeAttribute("open");
      }}
    >
      Hủy
    </Button>
  );
}
