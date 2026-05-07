import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

// Polyfill for Crypto.randomUUID()
if (typeof global.crypto !== 'object') {
  global.crypto = {} as any;
}
if (typeof global.crypto.randomUUID !== 'function') {
  global.crypto.randomUUID = function () {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  } as any;
}

const expoDb = openDatabaseSync("mua_app.db", { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });
