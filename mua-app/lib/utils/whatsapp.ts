import * as Linking from "expo-linking";

export const sendWhatsApp = (phone: string, message: string) => {
  // Clean phone number (remove +, spaces, etc)
  let cleanPhone = phone.replace(/[^\d]/g, "");
  
  // Convert 08... to 628...
  if (cleanPhone.startsWith("0")) {
    cleanPhone = "62" + cleanPhone.substring(1);
  }

  const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  Linking.openURL(url);
};

export const formatWhatsAppTemplate = (
  template: string, 
  data: { 
    nama: string; 
    layanan: string; 
    tanggal: string; 
    jam: string; 
  }
) => {
  return template
    .replace(/{{nama}}/g, data.nama)
    .replace(/{{layanan}}/g, data.layanan)
    .replace(/{{tanggal}}/g, data.tanggal)
    .replace(/{{jam}}/g, data.jam);
};

export const getBookingReminderTemplate = (clientName: string, date: string, time: string, serviceName: string) => {
  return `Halo ${clientName}, ini pengingat untuk jadwal makeup kamu:
📅 Tanggal: ${date}
⏰ Jam: ${time}
💄 Layanan: ${serviceName}

Sampai jumpa di lokasi ya!`;
};
