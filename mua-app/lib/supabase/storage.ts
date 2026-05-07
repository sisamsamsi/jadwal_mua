import { supabase } from "./client";
import { Buckets } from "../constants/supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";

export const storageService = {
  async uploadFile(bucket: string, path: string, fileUri: string) {
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: "base64" as any,
    });
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64), {
        contentType: "image/jpeg", // Assume jpeg for simplicity
        upsert: true,
      });

    if (error) throw error;
    
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
      
    return publicUrlData.publicUrl;
  },

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);
    if (error) throw error;
  }
};
