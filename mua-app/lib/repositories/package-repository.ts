import { db } from "../db/client";
import { packages, packageItems } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { packageService } from "../supabase/packages";
import { useSyncStore } from "../stores/sync-store";

export const packageRepository = {
  async getAll() {
    return await db.select().from(packages).orderBy(packages.createdAt);
  },

  async getById(id: string) {
    const pkgRows = await db.select().from(packages).where(eq(packages.id, id));
    const itemRows = await db.select().from(packageItems).where(eq(packageItems.packageId, id));
    
    if (pkgRows.length === 0) return null;
    
    return { ...pkgRows[0], items: itemRows };
  },

  async create(data: any, items: any[]) {
    const newPkg = {
      ...data,
      isSynced: false,
      localUpdatedAt: new Date().toISOString(),
    };

    await db.insert(packages).values(newPkg);
    
    if (items.length > 0) {
      const newItems = items.map(item => ({
        ...item,
        packageId: newPkg.id,
        isSynced: false,
        localUpdatedAt: new Date().toISOString(),
      }));
      await db.insert(packageItems).values(newItems);
    }

    // Background sync attempt
    packageService.create(data, items)
      .then(() => db.update(packages).set({ isSynced: true }).where(eq(packages.id, data.id)))
      .catch(() => {});

    return newPkg;
  },

  async update(id: string, data: any, items?: any[]) {
    await db.update(packages)
      .set({ ...data, isSynced: false, localUpdatedAt: new Date().toISOString() })
      .where(eq(packages.id, id));

    if (items) {
      await db.delete(packageItems).where(eq(packageItems.packageId, id));
      const newItems = items.map(item => ({
        ...item,
        packageId: id,
        isSynced: false,
        localUpdatedAt: new Date().toISOString(),
      }));
      await db.insert(packageItems).values(newItems);
    }

    // Background sync
    packageService.update(id, data, items)
      .then(() => db.update(packages).set({ isSynced: true }).where(eq(packages.id, id)))
      .catch(() => {});
  },

  async delete(id: string) {
    await db.delete(packages).where(eq(packages.id, id));
    await db.delete(packageItems).where(eq(packageItems.packageId, id));
    
    // Background sync
    packageService.delete(id).catch(() => {});
  }
};
