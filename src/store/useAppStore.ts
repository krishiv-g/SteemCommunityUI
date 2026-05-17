import { create } from 'zustand';
import { fetchAccounts } from '@/services/steem.accounts';
import { getAvatarUrl } from '@/services/avatar';

export interface SteemUser {
  username: string;
  avatar: string;
  loginMethod: 'keychain' | 'posting_key';
}

function loadSession(): { user: SteemUser | null; jwt: string | null } {
  try {
    const raw = sessionStorage.getItem('wox_user');
    const jwt = sessionStorage.getItem('wox_jwt');
    return { user: raw ? JSON.parse(raw) : null, jwt };
  } catch {
    return { user: null, jwt: null };
  }
}

interface AppState {
  currentUser: SteemUser | null;
  jwt: string | null;
  login: (username: string, loginMethod: 'keychain' | 'posting_key', jwt: string) => void;
  logout: () => void;
}

const session = loadSession();

export const useAppStore = create<AppState>((set) => ({
  currentUser: session.user,
  jwt: session.jwt,
  login: async (username, loginMethod, jwt) => {
    // Set immediately with fallback avatar so UI doesn't wait
    const fallbackUser: SteemUser = {
      username,
      avatar: getAvatarUrl(username),
      loginMethod,
    };
    sessionStorage.setItem('wox_user', JSON.stringify(fallbackUser));
    sessionStorage.setItem('wox_jwt', jwt);
    set({ currentUser: fallbackUser, jwt });

    // Then fetch real profile image from blockchain and update
    try {
      const [profile] = await fetchAccounts([username]);
      if (profile?.profileImage) {
        const user: SteemUser = { ...fallbackUser, avatar: profile.profileImage };
        sessionStorage.setItem('wox_user', JSON.stringify(user));
        set({ currentUser: user });
      }
    } catch {
      // keep fallback avatar
    }
  },
  logout: () => {
    sessionStorage.removeItem('wox_user');
    sessionStorage.removeItem('wox_jwt');
    sessionStorage.removeItem('posting_key');
    set({ currentUser: null, jwt: null });
  },
}));
