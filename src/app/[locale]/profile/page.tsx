"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useStore } from "@/stores/useStore";
import { useCollection } from "@/hooks/useCards";
import GlassCard from "@/components/atoms/GlassCard";
import GlassButton from "@/components/atoms/GlassButton";
import GlassInput from "@/components/atoms/GlassInput";
import SocialGifting from "@/components/organisms/SocialGifting";
import {
  User,
  Edit3,
  Save,
  Gift,
  Award,
  Zap,
  FolderHeart,
  Copy,
  Check,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  saveSession,
  clearPersistedSession,
} from "@/providers/SessionProvider";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tAuth = useTranslations("auth");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const {
    isLoggedIn,
    userId,
    displayName,
    email,
    minusEnergy,
    setUser,
    clearUser,
  } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(displayName ?? "");
  const [friendCode, setFriendCode] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Login/Register form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [keepMeLoggedIn, setKeepMeLoggedIn] = useState(true);

  const { data: collection } = useCollection(userId);
  const totalCards = collection?.reduce((s, c) => s + c.quantity, 0) ?? 0;

  // Load friend code from server
  useEffect(() => {
    if (!userId || !isLoggedIn) return;
    const sessionToken = useStore.getState().sessionToken;
    if (!sessionToken) return;
    fetch("/api/auth/me", {
      headers: { Authorization: `Bearer ${sessionToken}`, "X-User-Id": userId },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.valid && data.friendCode) setFriendCode(data.friendCode);
      })
      .catch(() => {});
  }, [userId, isLoggedIn]);

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    setIsSubmitting(true);

    try {
      const endpoint = isLoginMode ? "/api/auth/login" : "/api/auth/register";
      const body = isLoginMode
        ? { email: formEmail, password: formPassword }
        : { email: formEmail, password: formPassword, displayName: formName };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        setFormError(data.error ?? "Error");
        return;
      }

      const userData = {
        userId: data.userId,
        email: data.email,
        displayName: data.displayName,
        sessionToken: data.sessionToken,
        minusEnergy: data.minusEnergy ?? 0,
      };

      setUser(userData);

      if (keepMeLoggedIn) {
        saveSession(userData);
      }

      if (data.friendCode) setFriendCode(data.friendCode);
    } catch {
      setFormError("Network error");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSaveName() {
    if (!newName.trim()) return;
    setUser({ displayName: newName.trim() });
    setIsEditing(false);
    // Update persisted session if present
    const state = useStore.getState();
    if (state.sessionToken && state.userId) {
      saveSession({
        userId: state.userId,
        email: state.email ?? "",
        displayName: newName.trim(),
        sessionToken: state.sessionToken,
        minusEnergy: state.minusEnergy,
      });
    }
  }

  function handleLogout() {
    clearUser();
    clearPersistedSession();
  }

  function copyFriendCode() {
    if (!friendCode) return;
    navigator.clipboard.writeText(friendCode).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  // Not logged in → show auth form
  if (!isLoggedIn) {
    return (
      <div className="max-w-md mx-auto py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <GlassCard hover={false} className="p-8">
            <div className="text-center mb-6">
              <span className="text-4xl mb-3 block">✿</span>
              <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                {isLoginMode ? tAuth("loginTitle") : tAuth("registerTitle")}
              </h1>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLoginMode && (
                <GlassInput
                  label={tAuth("displayName")}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                />
              )}
              <GlassInput
                label={tAuth("email")}
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />
              <GlassInput
                label={tAuth("password")}
                type="password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
                error={formError}
              />

              {/* Keep me logged in */}
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => setKeepMeLoggedIn((v) => !v)}
                  className={`w-10 h-5 rounded-full transition-colors duration-200 flex items-center ${
                    keepMeLoggedIn
                      ? "bg-[#fc88c6]"
                      : "bg-slate-300 dark:bg-slate-600"
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 mx-0.5 ${
                      keepMeLoggedIn ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300">
                  {tAuth("keepMeLoggedIn")}
                </span>
              </label>

              <GlassButton
                type="submit"
                variant="primary"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "..."
                  : isLoginMode
                    ? tAuth("loginButton")
                    : tAuth("registerButton")}
              </GlassButton>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setIsLoginMode(!isLoginMode);
                  setFormError("");
                }}
                className="text-sm text-[#d4509a] hover:text-[#fc88c6] transition-colors"
              >
                {isLoginMode ? tAuth("noAccount") : tAuth("hasAccount")}
              </button>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    );
  }

  // Logged in → show profile
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-slate-100">
        {t("title")}
      </h1>

      {/* Profile card */}
      <GlassCard hover={false} className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#fc88c6] to-purple-400 flex items-center justify-center">
            <User size={28} className="text-white" />
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="flex items-center gap-2">
                <GlassInput
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="flex-1"
                />
                <GlassButton size="sm" onClick={handleSaveName}>
                  <Save size={14} />
                </GlassButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {displayName}
                </h2>
                <button
                  onClick={() => {
                    setNewName(displayName ?? "");
                    setIsEditing(true);
                  }}
                  className="p-1 rounded-lg hover:bg-white/20 text-slate-400 transition-colors"
                >
                  <Edit3 size={14} />
                </button>
              </div>
            )}
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {email}
            </p>
          </div>
        </div>

        {/* Friend code */}
        {friendCode && (
          <div className="mb-5 p-3 rounded-2xl bg-[#fc88c6]/10 border border-[#fc88c6]/20 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">
                {t("friendCode")}
              </p>
              <code className="font-mono font-bold text-[#d4509a] dark:text-[#fc88c6] text-base tracking-widest">
                {friendCode}
              </code>
            </div>
            <button
              onClick={copyFriendCode}
              className="p-2 rounded-xl hover:bg-white/20 text-slate-500 dark:text-slate-400 transition-colors"
              title="Copy code"
            >
              {codeCopied ? (
                <Check size={16} className="text-emerald-500" />
              ) : (
                <Copy size={16} />
              )}
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            {
              icon: FolderHeart,
              label: t("cardsCollected"),
              value: totalCards,
              color: "text-[#d4509a] dark:text-[#fc88c6]",
            },
            {
              icon: Gift,
              label: t("giftsGiven"),
              value: "—",
              color: "text-purple-500",
            },
            {
              icon: Award,
              label: t("badgesEarned"),
              value: "—",
              color: "text-amber-500",
            },
            {
              icon: Zap,
              label: t("energyTotal"),
              value: minusEnergy,
              color: "text-blue-500",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="text-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm"
            >
              <stat.icon size={20} className={`mx-auto mb-1 ${stat.color}`} />
              <div className={`text-xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
          {showLogoutConfirm ? (
            <motion.div
              whileHover={{ scale: 1.03 }}
              transition={{ type: "spring", stiffness: 260, damping: 20 }}
              className="w-full rounded-2xl bg-red-500/10 border border-red-400/20 p-4 text-center space-y-3"
            >
              <motion.p className="text-sm text-slate-700 dark:text-slate-200 font-medium">
                {tNav("logoutConfirm")}
              </motion.p>
              <motion.div className="flex items-center justify-center gap-3">
                <GlassButton
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    setShowLogoutConfirm(false);
                    handleLogout();
                  }}
                >
                  {tNav("logout")}
                </GlassButton>
                <GlassButton
                  size="sm"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  {tCommon("cancel")}
                </GlassButton>
              </motion.div>
            </motion.div>
          ) : (
            <GlassButton
              variant="danger"
              size="sm"
              onClick={() => setShowLogoutConfirm(true)}
            >
              {tNav("logout")}
            </GlassButton>
          )}
        </div>
      </GlassCard>

      {/* Social Gifting */}
      <SocialGifting />
    </div>
  );
}
