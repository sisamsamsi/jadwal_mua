import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("mua_app.db", { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });
