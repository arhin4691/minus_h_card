'use client';

import { type InputHTMLAttributes, forwardRef } from 'react';

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300 pl-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3
            bg-white/20 dark:bg-white/5
            backdrop-blur-xl
            border border-white/30 dark:border-white/10
            rounded-2xl
            text-slate-800 dark:text-slate-100
            placeholder:text-slate-400 dark:placeholder:text-slate-500
            focus:outline-none focus:ring-2 focus:ring-pink-300/50 focus:border-pink-300/50
            transition-all duration-300
            shadow-inner shadow-white/10
            ${error ? 'border-red-400/60 focus:ring-red-300/50' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <span className="text-xs text-red-400 pl-1">{error}</span>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';
export default GlassInput;
