import { format, formatDistanceToNow, parseISO } from "date-fns";
import { id } from "date-fns/locale";

export const formatDate = (date: string | Date, pattern: string = "dd MMMM yyyy"): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: id });
};

export const formatTime = (time: string): string => {
  // input: "HH:mm"
  return time;
};

export const formatRelative = (date: string | Date): string => {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: id });
};

export const getTodayDateString = (): string => {
  return format(new Date(), "yyyy-MM-dd");
};

export const getTimeString = (date: Date): string => {
  return format(date, "HH:mm");
};
