import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from './env';

const STORAGE_KEY = 'hiring-remember-me';

// Custom storage wrapper that switches between localStorage and sessionStorage
// based on the 'remember me' preference.
const customStorage = {
  getItem: (key: string): string | null => {
    const rememberMe = localStorage.getItem(STORAGE_KEY) === 'true';
    if (rememberMe) {
      return localStorage.getItem(key);
    }
    return sessionStorage.getItem(key);
  },
  setItem: (key: string, value: string): void => {
    const rememberMe = localStorage.getItem(STORAGE_KEY) === 'true';
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
    }
  },
  removeItem: (key: string): void => {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const setRememberMePreference = (rememberMe: boolean) => {
  localStorage.setItem(STORAGE_KEY, rememberMe ? 'true' : 'false');
};

export const supabase = createClient<Database>(env.supabaseUrl, env.supabaseAnonKey, {
  auth: {
    storage: customStorage,
    persistSession: true,
    autoRefreshToken: true,
  },
});

