'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useGiftCard, useCollection } from '@/hooks/useCards';
import { useFriends } from '@/hooks/useFriends';
import { useStore } from '@/stores/useStore';
import GlassCard from '@/components/atoms/GlassCard';
import GlassButton from '@/components/atoms/GlassButton';
import CardContainer from '@/components/molecules/CardContainer';
import { Gift, Heart, Send, Check, Users } from 'lucide-react';

export default function SocialGifting() {
  const t = useTranslations('social');
  const { userId } = useStore();
  const { data: collection } = useCollection(userId);
  const { data: friends } = useFriends(userId);
  const giftMutation = useGiftCard();
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const duplicates = collection?.filter((c) => c.quantity > 1) ?? [];

  async function handleGift() {
    if (!userId || !selectedCardId || !selectedFriendId) return;
    try {
      await giftMutation.mutateAsync({
        fromUserId: userId,
        toFriendId: selectedFriendId,
        cardId: selectedCardId,
      });
      setShowSuccess(true);
      setSelectedCardId(null);
      setSelectedFriendId('');
      setTimeout(() => setShowSuccess(false), 3000);
    } catch {
      // Error handled by mutation state
    }
  }

  return (
    <div className="space-y-6">
      <GlassCard hover={false} className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <Heart size={24} className="text-pink-400" />
          <div>
            <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
              {t('bless')}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('blessDescription')}
            </p>
          </div>
        </div>

        {/* Friend selector */}
        <div className="mb-4">
          {friends && friends.length > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <Users size={14} />
                {t('giftTo')}
              </div>
              <div className="flex flex-wrap gap-2">
                {friends.map((friend) => (
                  <button
                    key={friend._id}
                    onClick={() => setSelectedFriendId(friend._id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-200 ${
                      selectedFriendId === friend._id
                        ? 'bg-pink-400/30 border-pink-400 text-pink-700 dark:text-pink-200'
                        : 'bg-white/10 border-white/20 text-slate-600 dark:text-slate-300 hover:border-pink-300/50'
                    }`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white shrink-0 ${
                      selectedFriendId === friend._id ? 'bg-pink-500' : 'bg-slate-400 dark:bg-slate-600'
                    }`}>
                      {friend.displayName.charAt(0).toUpperCase()}
                    </span>
                    {friend.displayName}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400 flex items-center gap-1.5 py-2">
              <Users size={14} />
              {t('noFriends')}
            </p>
          )}
        </div>

        {/* Duplicate cards to gift */}
        {duplicates.length > 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              {t('gift')}:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {duplicates.map((item) => (
                <div
                  key={item._id}
                  onClick={() => setSelectedCardId(item.cardId._id)}
                  className={`cursor-pointer transition-all duration-200 rounded-2xl ${
                    selectedCardId === item.cardId._id
                      ? 'ring-2 ring-pink-400 ring-offset-2 ring-offset-transparent'
                      : ''
                  }`}
                >
                  <CardContainer
                    id={item.cardId._id}
                    name={item.cardId.name}
                    information={item.cardId.information}
                    rarity={item.cardId.rarity}
                    image={item.cardId.image}
                    quantity={item.quantity}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-slate-400 text-center py-4">
            No duplicate cards to gift yet
          </p>
        )}

        {/* Send button */}
        <div className="mt-5">
          <GlassButton
            variant="primary"
            size="md"
            onClick={handleGift}
            disabled={!selectedCardId || !selectedFriendId || giftMutation.isPending}
            className="w-full"
          >
            <Send size={16} />
            {giftMutation.isPending ? '...' : t('gift')}
          </GlassButton>
        </div>

        {/* Error message */}
        {giftMutation.isError && (
          <p className="mt-2 text-sm text-red-500 text-center">
            {giftMutation.error?.message ?? 'Gift failed'}
          </p>
        )}

        {/* Success message */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex items-center justify-center gap-2 text-green-500 text-sm font-medium"
            >
              <Check size={16} />
              {t('giftSuccess')}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}

