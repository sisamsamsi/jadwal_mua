import { createClient } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import "react-native-url-polyfill/auto";

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn("EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is not set. Check your .env file.");
}

const MAX_SIZE = 2048;

const ExpoSecureStoreAdapter = {
  getItem: async (key: string) => {
    try {
      const chunkedInfo = await SecureStore.getItemAsync(`${key}_chunked`);
      if (chunkedInfo) {
        const chunks = parseInt(chunkedInfo);
        if (isNaN(chunks)) return null;
        
        let data = "";
        for (let i = 0; i < chunks; i++) {
          const chunk = await SecureStore.getItemAsync(`${key}_${i}`);
          if (chunk) {
            data += chunk;
          }
        }
        return data;
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error("SecureStore getItem error:", error);
      return null;
    }
  },
  setItem: async (key: string, value: string) => {
    try {
      if (value.length > MAX_SIZE) {
        const chunks = Math.ceil(value.length / MAX_SIZE);
        await SecureStore.setItemAsync(`${key}_chunked`, chunks.toString());
        for (let i = 0; i < chunks; i++) {
          const chunk = value.slice(i * MAX_SIZE, (i + 1) * MAX_SIZE);
          await SecureStore.setItemAsync(`${key}_${i}`, chunk);
        }
        await SecureStore.deleteItemAsync(key);
      } else {
        const chunkedInfo = await SecureStore.getItemAsync(`${key}_chunked`);
        if (chunkedInfo) {
          const chunks = parseInt(chunkedInfo);
          if (!isNaN(chunks)) {
            for (let i = 0; i < chunks; i++) {
              await SecureStore.deleteItemAsync(`${key}_${i}`);
            }
          }
          await SecureStore.deleteItemAsync(`${key}_chunked`);
        }
        await SecureStore.setItemAsync(key, value);
      }
    } catch (error) {
      console.error("SecureStore setItem error:", error);
    }
  },
  removeItem: async (key: string) => {
    try {
      const chunkedInfo = await SecureStore.getItemAsync(`${key}_chunked`);
      if (chunkedInfo) {
        const chunks = parseInt(chunkedInfo);
        if (!isNaN(chunks)) {
          for (let i = 0; i < chunks; i++) {
            await SecureStore.deleteItemAsync(`${key}_${i}`);
          }
        }
        await SecureStore.deleteItemAsync(`${key}_chunked`);
      }
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error("SecureStore removeItem error:", error);
    }
  },
};



export const supabase = createClient(SUPABASE_URL ?? "", SUPABASE_ANON_KEY ?? "", {
  auth: {
    storage: Platform.OS === "web" ? undefined : ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: Platform.OS !== "web",
    detectSessionInUrl: false,
  },
});
