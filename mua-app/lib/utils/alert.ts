import { useAlertStore, AlertButton } from "../stores/alert-store";

/**
 * Utility to show a custom premium alert.
 * Mimics React Native's Alert.alert API but uses our custom UI.
 */
export const showAlert = (
  title: string,
  message: string,
  buttons?: AlertButton[],
  options?: { cancelable?: boolean }
) => {
  useAlertStore.getState().showAlert(title, message, buttons, options);
};

// Also provide an object that mimics the native Alert module for easier drop-in replacement
export const CustomAlertManager = {
  alert: showAlert,
};
