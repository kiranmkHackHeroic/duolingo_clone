import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "super" | "locked";
  children: React.ReactNode;
}

export function Button({ variant = "primary", children, className = "", ...props }: ButtonProps) {
  const baseStyle = "px-6 py-3 rounded-2xl font-bold tracking-wide transition-all border-b-4 select-none outline-none text-center flex items-center justify-center cursor-pointer";
  let variantStyle = "";

  if (variant === "primary") {
    variantStyle = "bg-[#58CC02] text-white border-[#46a302] hover:bg-[#61e002] active:bg-[#58cc02] active:translate-y-[2px] active:border-b-2";
  } else if (variant === "secondary") {
    variantStyle = "bg-[#1CB0F6] text-white border-[#1899D6] hover:bg-[#24C2FF] active:bg-[#1CB0F6] active:translate-y-[2px] active:border-b-2";
  } else if (variant === "danger") {
    variantStyle = "bg-[#EA2B2B] text-white border-[#C21D1D] hover:bg-[#FF3C3C] active:bg-[#EA2B2B] active:translate-y-[2px] active:border-b-2";
  } else if (variant === "super") {
    variantStyle = "bg-[#FFC800] text-[#4b4b4b] border-[#E6B400] hover:bg-[#ffd233] active:bg-[#FFC800] active:translate-y-[2px] active:border-b-2";
  } else if (variant === "ghost") {
    variantStyle = "bg-transparent text-[#afafaf] border-transparent hover:bg-zinc-100 active:translate-y-[2px] active:border-b-2";
  } else if (variant === "locked") {
    variantStyle = "bg-[#E5E5E5] text-[#AFAFAF] border-[#C0C0C0] cursor-not-allowed";
  }

  return (
    <button
      className={`${baseStyle} ${variantStyle} ${className}`}
      disabled={variant === "locked" || props.disabled}
      {...props}
    >
      {children}
    </button>
  );
}
