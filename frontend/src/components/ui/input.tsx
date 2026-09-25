import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, success, helperText, id, disabled, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-xs font-medium text-[#24211E] tracking-wide uppercase"
          >
            {label}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full h-11 px-4 text-sm bg-white text-[#24211E] placeholder:text-[#9B958E] rounded-[10px] border border-[#E5E0DA] transition-all duration-200 outline-none",
              "hover:border-[#9B958E]",
              "focus:border-[#8B5E3C] focus:ring-3 focus:ring-[#F3E8DE]",
              error && "border-[#C84B4B] focus:border-[#C84B4B] focus:ring-[#C84B4B]/20",
              success && "border-[#2F7D50] focus:border-[#2F7D50] focus:ring-[#2F7D50]/20",
              disabled && "bg-[#F4F2EF] text-[#9B958E] border-[#E5E0DA] cursor-not-allowed",
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-[#C84B4B] font-medium">{error}</p>}
        {!error && helperText && (
          <p className="text-xs text-[#6F6A64]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
