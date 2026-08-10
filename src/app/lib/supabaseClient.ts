import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const persistencePreferenceKey = "hub-auth-persistence";

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Faltan VITE_SUPABASE_URL o VITE_SUPABASE_PUBLISHABLE_KEY en .env.local");
}

const authStorage = {
  getItem(key: string) {
    return window.localStorage.getItem(key) ?? window.sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    const shouldPersist = window.localStorage.getItem(persistencePreferenceKey) !== "session";
    const target = shouldPersist ? window.localStorage : window.sessionStorage;
    const other = shouldPersist ? window.sessionStorage : window.localStorage;
    target.setItem(key, value);
    other.removeItem(key);
  },
  removeItem(key: string) {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  },
};

export function setSessionPersistence(remember: boolean) {
  window.localStorage.setItem(persistencePreferenceKey, remember ? "local" : "session");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    detectSessionInUrl: true,
    persistSession: true,
    storage: authStorage,
  },
});
