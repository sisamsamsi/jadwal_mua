import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";
import * as schema from "./schema";

const expoDb = openDatabaseSync("mua_app.db", { enableChangeListener: true });
export const db = drizzle(expoDb, { schema });

export async function clearLocalDatabase() {
  try {
    await db.transaction(async (tx) => {
      await tx.delete(schema.bookingLogs);
      await tx.delete(schema.reminders);
      await tx.delete(schema.clientPhotos);
      await tx.delete(schema.products);
      await tx.delete(schema.expenses);
      await tx.delete(schema.invoices);
      await tx.delete(schema.payments);
      await tx.delete(schema.bridalParty);
      await tx.delete(schema.bookings);
      await tx.delete(schema.packageItems);
      await tx.delete(schema.packages);
      await tx.delete(schema.services);
      await tx.delete(schema.clients);
      await tx.delete(schema.profiles);
    });
    console.log("Local SQLite database cleared successfully!");
  } catch (error) {
    console.error("Error clearing local database:", error);
    throw error;
  }
}
