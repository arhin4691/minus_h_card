'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '@/stores/useStore';
import { useCollection } from '@/hooks/useCards';
import {
  useFriends,
  useFriendCollection,
  useFriendRequests,
  useAddFriend,
  useRemoveFriend,
  useRespondToFriendRequest,
  type FriendUser,
} from '@/hooks/useFriends';
import GlassCard from '@/components/atoms/GlassCard';
import GlassButton from '@/components/atoms/GlassButton';
import GlassInput from '@/components/atoms/GlassInput';
import CardContainer from '@/components/molecules/CardContainer';
import { Users, UserPlus, ArrowLeft, Copy, Check, Trash2, UserCheck, UserX, Bell } from 'lucide-react';
import type { CardRarity } from '@/models/Card';

export default function FriendsPage() {
  const t = useTranslations('friends');
  const { userId, isLoggedIn } = useStore();
  const [addCode, setAddCode] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [selectedFriend, setSelectedFriend] = useState<FriendUser | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const { data: friends, isLoading: friendsLoading } = useFriends(userId);
  const { data: incomingRequests, isLoading: requestsLoading } = useFriendRequests(userId);
  const { data: myCollection } = useCollection(userId);
  const { data: friendCollection, isLoading: cardsLoading } = useFriendCollection(
    selectedFriend?._id ?? null,
    userId,
  );
  const addFriendMutation = useAddFriend();
  const removeFriendMutation = useRemoveFriend();
  const respondMutation = useRespondToFriendRequest();

  // My collection card IDs for blur comparison
  const myOwnedIds = useMemo(
    () => new Set(myCollection?.map((c) => c.cardId._id) ?? []),
    [myCollection],
  );

  // My friend code is stored in profile ??read from /api/auth/me via SessionProvider
  // We expose it via a small local GET here
  const [myFriendCode, setMyFriendCode] = useState<string | null>(null);
  useMemo(() => {
    if (!userId || !isLoggedIn) return;
    const token = useStore.getState().sessionToken;
    if (!token) return;
    fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}`, 'X-User-Id': userId },
    })
      .then((r) => r.json())
      .then((d) => d.valid && d.friendCode && setMyFriendCode(d.friendCode))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, isLoggedIn]);

  function copyCode() {
    if (!myFriendCode) return;
    navigator.clipboard.writeText(myFriendCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!userId || !addCode.trim()) return;
    setAddError('');
    setAddSuccess('');
    try {
      await addFriendMutation.mutateAsync({ userId, friendCode: addCode.trim() });
      setAddCode('');
      setAddSuccess('Friend request sent!');
      setTimeout(() => setAddSuccess(''), 3000);
    } catch (err) {
      setAddError(err instanceof Error ? err.message : 'Error');
    }
  }

  async function handleRemove(friendId: string) {
    if (!userId) return;
    await removeFriendMutation.mutateAsync({ userId, friendId });
    if (selectedFriend?._id === friendId) setSelectedFriend(null);
  }

  async function handleRespond(requestId: string, action: 'accept' | 'deny') {
    if (!userId) return;
    try {
      await respondMutation.mutateAsync({ requestId, userId, action });
    } catch {
      // error is surfaced via mutation.error if needed
    }
  }

  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <span className="text-5xl mb-4 block">?</span>
        <p className="text-slate-500 dark:text-slate-400">{t('loginRequired')}</p>
      </div>
    );
  }

  // Viewing a friend's collection
  if (selectedFriend) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <GlassButton variant="ghost" size="sm" onClick={() => setSelectedFriend(null)}>
            <ArrowLeft size={16} />
            {t('back')}
          </GlassButton>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t('friendCards', { name: selectedFriend.displayName })}
          </h1>
        </div>

        {cardsLoading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-8 h-8 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
            />
          </div>
        ) : friendCollection && friendCollection.length > 0 ? (
          <motion.div
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.04 } } }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 justify-items-center"
          >
            {friendCollection.map((item) => (
              <motion.div
                key={item._id}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
                className="w-full"
              >
                <CardContainer
                  id={item.cardId._id}
                  name={item.cardId.name}
                  information={item.cardId.information}
                  rarity={item.cardId.rarity as CardRarity}
                  image={item.cardId.image}
                  quantity={item.quantity}
                  owned={myOwnedIds.has(item.cardId._id) && isLoggedIn}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <GlassCard hover={false} className="p-12 text-center">
            <span className="text-4xl mb-3 block">?</span>
            <p className="text-slate-500 dark:text-slate-400">No cards yet</p>
          </GlassCard>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-3">
        <Users size={28} className="text-[#fc88c6]" />
        {t('title')}
      </h1>

      {/* My friend code */}
      {myFriendCode && (
        <GlassCard hover={false} className="p-5">
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{t('myCode')}</p>
          <div className="flex items-center gap-3">
            <code className="font-mono font-bold text-[#d4509a] dark:text-[#fc88c6] text-xl tracking-[0.25em] flex-1">
              {myFriendCode}
            </code>
            <button
              onClick={copyCode}
              className="p-2 rounded-xl hover:bg-white/20 text-slate-500 transition-colors"
              title="Copy"
            >
              {codeCopied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
            </button>
          </div>
        </GlassCard>
      )}

      {/* Add friend ??sends request */}
      <GlassCard hover={false} className="p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
          <UserPlus size={16} className="text-[#fc88c6]" />
          {t('addFriend')}
        </h2>
        <form onSubmit={handleAdd} className="flex gap-2">
          <GlassInput
            placeholder={t('addByCode')}
            value={addCode}
            onChange={(e) => {
              setAddCode(e.target.value);
              setAddError('');
              setAddSuccess('');
            }}
            className="flex-1 font-mono w-full"
            error={addError}
          />
          <GlassButton
            type="submit"
            variant="primary"
            disabled={addFriendMutation.isPending || !addCode.trim()}
          >
            {addFriendMutation.isPending ? t('sending') : t('sendRequest')}
          </GlassButton>
        </form>
        {addSuccess && (
          <p className="mt-2 text-xs text-emerald-500 font-medium">{addSuccess}</p>
        )}
      </GlassCard>

      {/* Incoming friend requests */}
      {((incomingRequests && incomingRequests.length > 0) || requestsLoading) && (
        <GlassCard hover={false} className="p-5">
          <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Bell size={15} className="text-amber-400" />
            Friend Requests
            {incomingRequests && incomingRequests.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-[#fc88c6]/20 text-[#d4509a] dark:text-[#fc88c6] text-[10px] font-bold">
                {incomingRequests.length}
              </span>
            )}
          </h2>

          {requestsLoading ? (
            <div className="flex justify-center py-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-5 h-5 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
              />
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {incomingRequests?.map((req) => (
                  <motion.div
                    key={req._id}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex items-center gap-3 p-3 rounded-2xl bg-white/10"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400/50 to-[#fc88c6]/50 flex items-center justify-center text-sm font-bold text-white shrink-0">
                      {req.fromUserId.displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 dark:text-slate-100 truncate text-sm">
                        {req.fromUserId.displayName}
                      </p>
                      <p className="text-xs text-slate-400 font-mono">{req.fromUserId.friendCode}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        onClick={() => handleRespond(req._id, 'accept')}
                        disabled={respondMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-600 dark:text-emerald-400 text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Accept"
                      >
                        <UserCheck size={13} />
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(req._id, 'deny')}
                        disabled={respondMutation.isPending}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-red-400/20 hover:bg-red-400/30 text-red-500 dark:text-red-400 text-xs font-semibold transition-colors disabled:opacity-50"
                        title="Deny"
                      >
                        <UserX size={13} />
                        Deny
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          )}
        </GlassCard>
      )}

      {/* Friend list */}
      <GlassCard hover={false} className="p-5">
        <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4">
          {t('title')} ({friends?.length ?? 0})
        </h2>

        {friendsLoading ? (
          <div className="flex justify-center py-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
              className="w-6 h-6 border-2 border-[#fc88c6]/60 border-t-transparent rounded-full"
            />
          </div>
        ) : friends && friends.length > 0 ? (
          <AnimatePresence>
            <div className="space-y-2">
              {friends.map((friend) => (
                <motion.div
                  key={friend._id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#fc88c6]/50 to-purple-400/50 flex items-center justify-center text-sm font-bold text-white">
                    {friend.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 dark:text-slate-100 truncate">
                      {friend.displayName}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                      {friend.friendCode}
                    </p>
                  </div>
                  <div className="flex gap-1.5">
                    <GlassButton
                      size="sm"
                      variant="primary"
                      onClick={() => setSelectedFriend(friend)}
                    >
                      {t('viewCards')}
                    </GlassButton>
                    <button
                      onClick={() => handleRemove(friend._id)}
                      disabled={removeFriendMutation.isPending}
                      className="p-2 rounded-xl hover:bg-red-400/20 text-slate-400 hover:text-red-500 transition-colors disabled:opacity-50"
                      title={t('removeFriend')}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        ) : (
          <div className="text-center py-8">
            <span className="text-4xl mb-3 block">?</span>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('noFriends')}</p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
