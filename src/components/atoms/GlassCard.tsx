'use client';

import { type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
  glowColor?: string;
}

export default function GlassCard({
  children,
  className = '',
  hover = true,
  glow = false,
  glowColor = 'pink',
}: GlassCardProps) {
  const glowStyles = glow
    ? `shadow-[0_0_30px_rgba(236,72,153,0.3)] border-${glowColor}-300/50`
    : 'shadow-lg border-white/20';

  return (
    <motion.div
      whileHover={hover ? { y: -4, scale: 1.01 } : undefined}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        relative overflow-hidden
        bg-white/20 dark:bg-white/5
        backdrop-blur-2xl
        border rounded-3xl
        ${glowStyles}
        ${className}
      `}
    >
      {/* Glass reflection effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-transparent pointer-events-none rounded-3xl" />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}
