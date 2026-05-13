// lib/db/client.web.ts
// Mock implementation of db for Web platform to avoid SQLite WASM issues
export const db = {
  select: () => ({ from: () => ({ where: () => ({ limit: () => Promise.resolve([]) }) }) }),
  update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
  insert: () => ({ values: () => Promise.resolve() }),
  delete: () => ({ where: () => Promise.resolve() }),
};
