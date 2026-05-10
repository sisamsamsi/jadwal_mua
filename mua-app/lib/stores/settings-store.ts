import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SettingsState {
  showBridalParty: boolean;
  showInventory: boolean;
  isLicenseActive: boolean;
  businessName: string;
  whatsappNumber: string;
  hasSeenOnboarding: boolean;
  waTemplates: {
    confirmation: string;
    reminder: string;
    thanks: string;
  };
  toggleBridalParty: () => void;
  toggleInventory: () => void;
  setLicenseStatus: (status: boolean) => void;
  updateBusinessProfile: (name: string, whatsapp: string) => void;
  completeOnboarding: () => void;
  updateTemplates: (templates: Partial<SettingsState['waTemplates']>) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      showBridalParty: true,
      showInventory: true,
      isLicenseActive: false,
      businessName: "",
      whatsappNumber: "",
      hasSeenOnboarding: false,
      waTemplates: {
        confirmation: "Halo {{nama}}, booking Anda untuk {{layanan}} pada {{tanggal}} jam {{jam}} telah dikonfirmasi. Sampai jumpa!",
        reminder: "Halo {{nama}}, ini pengingat untuk jadwal {{layanan}} Anda besok pada {{tanggal}} jam {{jam}}. Mohon konfirmasinya ya.",
        thanks: "Terima kasih {{nama}} sudah menggunakan jasa kami untuk {{layanan}}. Semoga hasilnya memuaskan!",
      },
      toggleBridalParty: () => set((state) => ({ showBridalParty: !state.showBridalParty })),
      toggleInventory: () => set((state) => ({ showInventory: !state.showInventory })),
      setLicenseStatus: (status: boolean) => set({ isLicenseActive: status }),
      updateBusinessProfile: (name, whatsapp) => set({ businessName: name, whatsappNumber: whatsapp }),
      completeOnboarding: () => set({ hasSeenOnboarding: true }),
      updateTemplates: (templates) => set((state) => ({ 
        waTemplates: { ...state.waTemplates, ...templates } 
      })),
    }),
    {
      name: 'mua-app-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
