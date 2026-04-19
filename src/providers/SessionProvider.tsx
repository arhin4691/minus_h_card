'use client';

import { useEffect } from 'react';
import { useStore } from '@/stores/useStore';

const SESSION_KEY = 'minus-h-auth';

export interface PersistedSession {
  userId: string;
  email: string;
  displayName: string;
  sessionToken: string;
  minusEnergy: number;
}

/** Call after a successful login with keepMeLoggedIn=true to persist session. */
export function saveSession(data: PersistedSession) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch {
    //
  }
}

/** Remove persisted session (call on logout). */
export function clearPersistedSession() {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch {
    //
  }
}

/** Read session from localStorage without triggering a re-render. */
export function readSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as PersistedSession) : null;
  } catch {
    return null;
  }
}

/**
 * Bootstraps the Zustand auth state from localStorage on first mount.
 * Verifies the session token with the server; clears stale data if invalid.
 */
export default function SessionProvider({ children }: { children: React.ReactNode }) {
  const { setUser, clearUser, setEnergy } = useStore();

  useEffect(() => {
    const saved = readSession();
    if (!saved) return;

    // Optimistically restore state so the UI doesn't flash "logged out"
    setUser({
      userId: saved.userId,
      email: saved.email,
      displayName: saved.displayName,
      sessionToken: saved.sessionToken,
      minusEnergy: saved.minusEnergy,
    });

    // Verify token with server and refresh live data
    fetch('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${saved.sessionToken}`,
        'X-User-Id': saved.userId,
      },
    })
      .then((r) => r.json())
      .then((data: { valid: boolean; displayName?: string; minusEnergy?: number }) => {
        if (!data.valid) {
          clearUser();
          clearPersistedSession();
        } else {
          // Sync fresh values from server
          if (data.displayName) setUser({ displayName: data.displayName });
          if (data.minusEnergy !== undefined) setEnergy(data.minusEnergy);
          // Update persisted copy with fresh energy
          saveSession({ ...saved, minusEnergy: data.minusEnergy ?? saved.minusEnergy });
        }
      })
      .catch(() => {
        // Network error — keep the optimistically-restored state
      });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
