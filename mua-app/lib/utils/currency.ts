import { AppConstants } from "../constants/app";

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat(AppConstants.currency.locale, {
    style: "currency",
    currency: AppConstants.currency.code,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatCurrencyCompact = (amount: number): string => {
  if (amount >= 1000000) {
    return `Rp ${(amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1)}jt`;
  }
  if (amount >= 1000) {
    return `Rp ${(amount / 1000).toFixed(0)}rb`;
  }
  return formatCurrency(amount);
};
