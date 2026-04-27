"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useCollection } from "@/hooks/useCards";
import { useStore } from "@/stores/useStore";
import GlassCard from "@/components/atoms/GlassCard";
import GlassButton from "@/components/atoms/GlassButton";
import GlassInput from "@/components/atoms/GlassInput";
import CardContainer from "@/components/molecules/CardContainer";
import CardDetailModal from "@/components/molecules/CardDetailModal";
import {
  Trophy,
  Star,
  ArrowUpDown,
  Search,
  Filter,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";
import type { CardRarity } from "@/models/Card";

const RARITY_ORDER: Record<CardRarity, number> = {
  common: 1,
  uncommon: 2,
  rare: 3,
  superRare: 4,
  epic: 5,
  legendary: 6,
};

const RARITIES: (CardRarity | "all")[] = [
  "all",
  "common",
  "uncommon",
  "rare",
  "superRare",
  "epic",
  "legendary",
];

const RARITY_LABELS: Record<CardRarity, string> = {
  common: "C",
  uncommon: "UC",
  rare: "R",
  superRare: "SR",
  epic: "SSR",
  legendary: "-H",
};

type SortKey = "default" | "name" | "rarity" | "quantity";

const PAGE_SIZE = 15;

interface ModalCard {
  _id: string;
  name: string;
  information: string;
  rarity: CardRarity;
  image: string;
  generation?: string;
}

export default function CollectionMilestones() {
  const t = useTranslations("collection");
  const { userId } = useStore();
  const { data: collection } = useCollection(userId);
  const [selectedCard, setSelectedCard] = useState<ModalCard | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("default");
  const [sortAsc, setSortAsc] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [rarityFilter, setRarityFilter] = useState<CardRarity | "all">("all");
  const [generationFilter, setGenerationFilter] = useState<string>("all");

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Reset pagination whenever sort/filter changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [sortKey, sortAsc, searchQuery, rarityFilter, generationFilter]);

  // Observe sentinel to load next batch
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibleCount((prev) => prev + PAGE_SIZE);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const totalCards = collection?.reduce((sum, c) => sum + c.quantity, 0) ?? 0;
  const uniqueCards = collection?.length ?? 0;
  const crystalizedCount =
    collection?.filter((c) => c.isCrystalized).length ?? 0;

  // Derive generation codes present in the user's collection
  const ownedGenerations = useMemo(() => {
    if (!collection) return [];
    const codes = [
      ...new Set(
        collection.map((item) => item.cardId.generation).filter(Boolean),
      ),
    ];
    return codes.sort();
  }, [collection]);

  const sorted = useMemo(() => {
    if (!collection) return [];
    // Filter first
    const filtered = collection.filter((item) => {
      if (rarityFilter !== "all" && item.cardId.rarity !== rarityFilter)
        return false;
      if (
        generationFilter !== "all" &&
        item.cardId.generation !== generationFilter
      )
        return false;
      if (
        searchQuery &&
        !item.cardId.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });
    // Then sort
    const arr = [...filtered];
    arr.sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") {
        diff = a.cardId.name.localeCompare(b.cardId.name);
      } else if (sortKey === "rarity") {
        diff =
          (RARITY_ORDER[a.cardId.rarity] ?? 0) -
          (RARITY_ORDER[b.cardId.rarity] ?? 0);
      } else if (sortKey === "quantity") {
        diff = a.quantity - b.quantity;
      }
      return sortAsc ? diff : -diff;
    });
    return arr;
  }, [
    collection,
    sortKey,
    sortAsc,
    searchQuery,
    rarityFilter,
    generationFilter,
  ]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: "default", label: t("sort.default") },
    { key: "name", label: t("sort.name") },
    { key: "rarity", label: t("sort.rarity") },
    { key: "quantity", label: t("sort.quantity") },
  ];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <GlassCard hover={false} className="p-3 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl font-bold text-[#d4509a] dark:text-[#fc88c6]">
            {totalCards}
          </div>
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
            {t("totalCards")}
          </div>
        </GlassCard>
        <GlassCard hover={false} className="p-3 sm:p-5 text-center">
          <div className="text-3xl sm:text-5xl font-bold text-purple-500">
            {uniqueCards}
          </div>
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
            {t("uniqueCards")}
          </div>
        </GlassCard>
        <GlassCard
          hover={false}
          glow={crystalizedCount > 0}
          className="p-3 sm:p-5 text-center"
        >
          <div className="flex items-center justify-center gap-1 sm:gap-2">
            <Trophy size={16} className="text-amber-400 sm:hidden" />
            <Trophy size={20} className="text-amber-400 hidden sm:block" />
            <span className="text-3xl sm:text-5xl font-bold text-amber-500">
              {crystalizedCount}
            </span>
          </div>
          <div className="text-[10px] sm:text-sm text-slate-500 dark:text-slate-400 mt-1 leading-tight">
            {t("crystalUnlocked")}
          </div>
        </GlassCard>
      </div>

      {/* Filter + Sort controls */}
      {collection && collection.length > 0 && (
        <GlassCard hover={false} className="p-4 space-y-3">
          {/* Search */}
          <div className="relative mb-3">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <GlassInput
              placeholder={t("filter.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Rarity filter */}
          <div className="flex items-center gap-1.5 flex-wrap mb-3">
            <Filter size={13} className="text-slate-400 mr-0.5" />
            {RARITIES.map((r) => (
              <GlassButton
                key={r}
                size="sm"
                variant={rarityFilter === r ? "primary" : "ghost"}
                onClick={() => setRarityFilter(r)}
              >
                {r === "all" ? t("filter.all") : RARITY_LABELS[r as CardRarity]}
              </GlassButton>
            ))}
          </div>

          {/* Generation filter — only show generations the user owns */}
          {ownedGenerations.length > 1 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <Layers size={13} className="text-slate-400 mr-0.5" />
              <GlassButton
                size="sm"
                variant={generationFilter === "all" ? "primary" : "ghost"}
                onClick={() => setGenerationFilter("all")}
              >
                {t("filter.allGen")}
              </GlassButton>
              {ownedGenerations.map((code) => (
                <GlassButton
                  key={code}
                  size="sm"
                  variant={generationFilter === code ? "primary" : "ghost"}
                  onClick={() => setGenerationFilter(code)}
                >
                  {code}
                </GlassButton>
              ))}
            </div>
          )}

          {/* Sort */}
          <div className="flex items-center gap-2 flex-wrap border-t border-white/10 pt-3">
            <ArrowUpDown size={13} className="text-slate-400" />
            {SORT_OPTIONS.map(({ key, label }) => (
              <GlassButton
                key={key}
                size="sm"
                variant={sortKey === key ? "primary" : "ghost"}
                onClick={() => handleSort(key)}
              >
                {label}
                {sortKey === key && (
                  <span className="ml-1 text-xs">{sortAsc ? "↑" : "↓"}</span>
                )}
              </GlassButton>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Collection grid */}
      {sorted.length > 0 ? (
        <>
          <CardDetailModal
            card={selectedCard}
            owned={true}
            onClose={() => setSelectedCard(null)}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.04 } },
            }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 justify-items-center"
          >
            {sorted.slice(0, visibleCount).map((item) => (
              <motion.div
                key={item._id}
                variants={{
                  hidden: { opacity: 0, scale: 0.9 },
                  visible: { opacity: 1, scale: 1 },
                }}
                className="relative w-full"
              >
                {item.isCrystalized && (
                  <div className="absolute -top-2 -right-2 z-30">
                    <Star size={20} className="text-amber-400 fill-amber-400" />
                  </div>
                )}
                <CardContainer
                  id={item.cardId._id}
                  name={item.cardId.name}
                  information={item.cardId.information}
                  rarity={item.cardId.rarity}
                  image={item.cardId.image}
                  generation={item.cardId.generation || undefined}
                  quantity={item.quantity}
                  owned={true}
                  onClick={() =>
                    setSelectedCard({
                      _id: item.cardId._id,
                      name: item.cardId.name,
                      information: item.cardId.information,
                      rarity: item.cardId.rarity,
                      image: item.cardId.image,
                      generation: item.cardId.generation || undefined,
                    })
                  }
                />
              </motion.div>
            ))}
          </motion.div>

          {/* Infinite-scroll sentinel */}
          <div ref={sentinelRef} className="flex justify-center py-6">
            {visibleCount < sorted.length && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                className="w-5 h-5 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
              />
            )}
          </div>
        </>
      ) : collection && collection.length > 0 ? (
        <GlassCard hover={false} className="p-12 text-center">
          <span className="text-4xl mb-3 block">🔍</span>
          <p className="text-slate-500 dark:text-slate-400">{t("noResults")}</p>
        </GlassCard>
      ) : (
        <GlassCard hover={false} className="p-12 text-center">
          <span className="text-4xl mb-3 block">📦</span>
          <p className="text-slate-500 dark:text-slate-400">{t("empty")}</p>
        </GlassCard>
      )}
    </div>
  );
}
