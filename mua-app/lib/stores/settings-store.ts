import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  showBridalParty: boolean;
  showInventory: boolean;
  isLicenseActive: boolean;
  toggleBridalParty: () => void;
  toggleInventory: () => void;
  setLicenseStatus: (status: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showBridalParty: true,
      showInventory: true,
      isLicenseActive: false, // Default inactive for development
      toggleBridalParty: () => set((state) => ({ showBridalParty: !state.showBridalParty })),
      toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
      setLicenseStatus: (status: boolean) => set({ isLicenseActive: status }),
    }),
    {
      name: 'mua-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
