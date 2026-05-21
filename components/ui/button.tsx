import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-[var(--accent)] text-white hover:bg-[var(--accent-strong)]",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-100/80",
        outline: "border border-[var(--line)] bg-white text-[var(--text)] hover:bg-slate-50 hover:text-slate-900",
        ghost: "text-[var(--text)] hover:bg-slate-100 hover:text-slate-900",
        destructive: "bg-[var(--danger)] text-white hover:bg-red-800",
        link: "text-[var(--accent)] underline-offset-4 hover:underline"
      },
      size: {
        default: "h-9",
        xs: "h-8 rounded-md px-2.5 text-xs",
        sm: "h-9 rounded-md px-3",
        lg: "h-10 rounded-md px-6",
        icon: "h-9 w-9 p-0",
        "icon-sm": "h-8 w-8 p-0",
        "icon-lg": "h-10 w-10 p-0"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
