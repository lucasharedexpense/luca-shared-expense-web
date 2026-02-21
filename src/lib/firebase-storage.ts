/**
 * Firebase Storage Upload Utility
 * Upload files to Firebase Storage and get download URLs
 */

import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage } from "./firebase";
import { v4 as uuidv4 } from "uuid";

/**
 * Upload an event image to Firebase Storage
 * Path: images/events/{uuid}.{ext}
 * Returns the download URL
 */
export async function uploadEventImage(
  userId: string,
  file: File
): Promise<string> {
  try {
    // Get file extension
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${uuidv4()}.${ext}`;
    const storagePath = `images/events/${fileName}`;

    const storageRef = ref(storage, storagePath);

    // Upload file
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: file.type,
    });

    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);

    return downloadUrl;
  } catch (error) {
    console.error("Error uploading event image:", error);
    throw error;
  }
}
