import { db } from "../db/client";
import { products } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { productService } from "../supabase/products";

export const productRepository = {
  async getAll() {
    return await db.select().from(products).orderBy(products.name);
  },

  async create(data: any) {
    const newProduct = {
      ...data,
      isSynced: false,
      localUpdatedAt: new Date().toISOString(),
    };

    await db.insert(products).values(newProduct);

    // Background sync
    productService.create(data)
      .then(() => db.update(products).set({ isSynced: true }).where(eq(products.id, data.id)))
      .catch(() => {});

    return newProduct;
  },

  async update(id: string, data: any) {
    await db.update(products)
      .set({ ...data, isSynced: false, localUpdatedAt: new Date().toISOString() })
      .where(eq(products.id, id));

    // Background sync
    productService.update(id, data)
      .then(() => db.update(products).set({ isSynced: true }).where(eq(products.id, id)))
      .catch(() => {});
  },

  async delete(id: string) {
    await db.delete(products).where(eq(products.id, id));
    // Background sync
    productService.delete(id).catch(() => {});
  }
};
