'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Layers, ChevronDown, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useGenerations } from '@/hooks/useGenerations';
import GlassCard from '@/components/atoms/GlassCard';

export default function GenerationsInfoPanel() {
  const t = useTranslations('gallery');
  const { data: generations, isLoading } = useGenerations();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading || !generations || generations.length === 0) return null;

  return (
    <div className="space-y-2">
      {/* Header + gallery title row */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
          {t('title')}
        </h1>
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium
                     bg-white/15 dark:bg-white/5 border border-white/20
                     text-[#d4509a] dark:text-[#fc88c6] hover:bg-[#fc88c6]/10 transition-all"
        >
          <Layers size={14} />
          {t('generationsPanel.label', { count: generations.length })}
          <motion.span
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
            className="inline-flex"
          >
            <ChevronDown size={14} />
          </motion.span>
        </button>
      </div>

      {/* Expandable generations grid */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
              {generations.map((gen, i) => (
                <motion.div
                  key={gen._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <GlassCard hover={false} className="p-4 h-full space-y-2">
                    {/* Code pill */}
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold tracking-widest
                                       bg-[#fc88c6]/20 text-[#d4509a] dark:text-[#fc88c6] border border-[#fc88c6]/30">
                        {gen.code}
                      </span>
                      {gen.releaseDate && (
                        <span className="flex items-center gap-1 text-[10px] text-slate-400">
                          <Calendar size={10} />
                          {new Date(gen.releaseDate).getFullYear()}
                        </span>
                      )}
                    </div>

                    {/* Names */}
                    <div>
                      <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 leading-tight">
                        {gen.nameEn}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{gen.nameJa}</p>
                    </div>

                    {/* Description */}
                    {gen.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {gen.description}
                      </p>
                    )}
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
