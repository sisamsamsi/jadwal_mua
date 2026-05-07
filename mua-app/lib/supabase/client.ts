import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import "react-native-url-polyfill/auto";

// Prefer the react-native-dotenv import; fallback to process.env
let SUPABASE_URL: string | undefined;
let SUPABASE_ANON_KEY: string | undefined;

try {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const env = require("@env");
  SUPABASE_URL = env.SUPABASE_URL;
  SUPABASE_ANON_KEY = env.SUPABASE_ANON_KEY;
} catch (e) {
  SUPABASE_URL = process.env.SUPABASE_URL;
  SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // In runtime this will fail; keep a console warning for developer
  // Do NOT throw here to avoid crashing tools that inspect files
  // Real runtime expects .env to be configured
  // eslint-disable-next-line no-console
  console.warn("SUPABASE_URL or SUPABASE_ANON_KEY is not set. Check your .env file.");
}

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    return await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    return await SecureStore.deleteItemAsync(key);
  },
};

export const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
