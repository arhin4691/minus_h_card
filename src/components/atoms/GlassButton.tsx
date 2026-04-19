"use client";

import { type ReactNode } from "react";
import { motion } from "framer-motion";

interface GlassButtonProps {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

const variants = {
  primary:
    "bg-[#fc88c6]/30 hover:bg-[#fc88c6]/50 text-[#8b2252] dark:text-[#ffd1ec] border-[#fc88c6]/40 shadow-[#fc88c6]/20",
  secondary:
    "bg-purple-400/30 hover:bg-purple-400/50 text-purple-900 dark:text-purple-100 border-purple-300/40 shadow-purple-200/20",
  ghost:
    "bg-white/10 hover:bg-white/20 text-slate-700 dark:text-slate-200 border-white/20 shadow-white/10",
  danger:
    "bg-red-400/30 hover:bg-red-400/50 text-red-900 dark:text-red-100 border-red-300/40 shadow-red-200/20",
};

const sizes = {
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-5 py-2.5 text-base rounded-xl",
  lg: "px-8 py-3.5 text-lg rounded-2xl",
};

export default function GlassButton({
  children,
  variant = "primary",
  size = "md",
  className = "",
  onClick,
  disabled,
  type = "button",
}: GlassButtonProps) {
  return (
    <motion.button
      whileHover={disabled ? undefined : { scale: 1.03 }}
      whileTap={disabled ? undefined : { scale: 0.97 }}
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        backdrop-blur-xl border
        font-medium tracking-wide
        shadow-lg
        transition-colors duration-300
        cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
    >
      {children}
    </motion.button>
  );
}
