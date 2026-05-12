import { create } from 'zustand';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  options?: { cancelable?: boolean };
  
  showAlert: (title: string, message: string, buttons?: AlertButton[], options?: { cancelable?: boolean }) => void;
  hideAlert: () => void;
}

export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: '',
  buttons: [],
  options: { cancelable: true },

  showAlert: (title, message, buttons = [{ text: 'OK' }], options = { cancelable: true }) => {
    set({
      visible: true,
      title,
      message,
      buttons,
      options,
    });
  },

  hideAlert: () => {
    set({ visible: false });
  },
}));
