import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "available" | "low-stock" | "out-of-stock" | "ar" | "neutral" | "primary";
  size?: "sm" | "md";
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "neutral", size = "sm", children, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center font-medium rounded-full border transition-colors select-none";

    const variantStyles = {
      available:
        "bg-[#2F7D50]/10 text-[#2F7D50] border-[#2F7D50]/20",
      "low-stock":
        "bg-[#C78A24]/10 text-[#C78A24] border-[#C78A24]/25",
      "out-of-stock":
        "bg-[#C84B4B]/10 text-[#C84B4B] border-[#C84B4B]/20",
      ar:
        "bg-[#F3E8DE] text-[#8B5E3C] border-[#8B5E3C]/30 font-semibold tracking-wide",
      neutral:
        "bg-[#F4F2EF] text-[#6F6A64] border-[#E5E0DA]",
      primary:
        "bg-[#8B5E3C] text-white border-transparent",
    };

    const sizeStyles = {
      sm: "px-2.5 py-0.5 text-xs gap-1",
      md: "px-3 py-1 text-xs gap-1.5",
    };

    return (
      <span
        ref={ref}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";
