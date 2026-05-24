import { supabase } from "./client";
import { Buckets } from "../constants/supabase";
import * as FileSystem from "expo-file-system/legacy";
import { decode } from "base64-arraybuffer";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

export const storageService = {
  async uploadFile(bucket: string, path: string, fileUri: string) {
    let finalUri = fileUri;
    try {
      // Konversi format gambar (HEIC, PNG, WebP) ke format JPEG standar demi rendering universal
      const result = await manipulateAsync(
        fileUri,
        [],
        { format: SaveFormat.JPEG, compress: 0.85 }
      );
      finalUri = result.uri;
    } catch (manipulateError) {
      console.warn("expo-image-manipulator: failed to convert, uploading original file", manipulateError);
    }

    const base64 = await FileSystem.readAsStringAsync(finalUri, {
      encoding: "base64" as any,
    });
    
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, decode(base64), {
        contentType: "image/jpeg",
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
