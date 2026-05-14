import * as schema from "./schema";

// Mock for web to prevent initialization crashes and bundle issues
export const db = {
  select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
  insert: () => ({ values: () => Promise.resolve([]) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve([]) }) }),
  delete: () => ({ from: () => ({ where: () => Promise.resolve([]) }) }),
  query: {},
  transaction: (cb: any) => cb({}),
} as any;
