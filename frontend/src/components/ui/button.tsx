import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "ar" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5E3C] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-[#8B5E3C] text-white hover:bg-[#634027] active:scale-[0.99] shadow-sm",
      secondary:
        "bg-transparent border border-[#8B5E3C] text-[#8B5E3C] hover:bg-[#F3E8DE] active:bg-[#ebd9cb]",
      ghost:
        "bg-transparent text-[#6F6A64] hover:text-[#24211E] hover:bg-[#F4F2EF]",
      danger:
        "bg-[#C84B4B] text-white hover:bg-[#a83c3c] active:scale-[0.99]",
      ar:
        "bg-[#24211E] text-white hover:bg-[#8B5E3C] border border-[#8B5E3C]/30 shadow-md hover:shadow-lg active:scale-[0.98] transition-all",
      outline:
        "bg-white border border-[#E5E0DA] text-[#24211E] hover:bg-[#F4F2EF] hover:border-[#9B958E]",
    };

    const sizeStyles = {
      sm: "h-9 px-3 text-xs rounded-[8px] gap-1.5",
      md: "h-11 px-5 text-sm rounded-[10px] gap-2",
      lg: "h-12 px-7 text-base rounded-[10px] gap-2.5",
      icon: "h-10 w-10 rounded-[10px] p-0",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
