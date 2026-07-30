"use client";

import * as React from "react";

export function ClientActionForm({
  action,
  children,
  ...props
}: React.FormHTMLAttributes<HTMLFormElement> & { action: (formData: FormData) => void }) {
  return (
    <form action={action} {...props}>
      {children}
    </form>
  );
}
