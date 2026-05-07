import { db } from "./client";
import migrations from "./migrations/migrations";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";

export function useAppMigrations() {
  return useMigrations(db, migrations);
}
