import { create } from "zustand";

interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: string | null;
  unsyncedCount: number;
  setOnline: (online: boolean) => void;
  setSyncing: (syncing: boolean) => void;
  setLastSync: (date: string) => void;
  setUnsyncedCount: (count: number) => void;
}

export const useSyncStore = create<SyncState>((set: any) => ({
  isOnline: true,
  isSyncing: false,
  lastSyncAt: null,
  unsyncedCount: 0,
  setOnline: (isOnline) => set({ isOnline }),
  setSyncing: (isSyncing) => set({ isSyncing }),
  setLastSync: (lastSyncAt) => set({ lastSyncAt }),
  setUnsyncedCount: (unsyncedCount) => set({ unsyncedCount }),
}));
