/**
 * Compress an image File to a target max size (default 1 MB).
 * - If already within the limit, returns the original File unchanged.
 * - Otherwise, rescales the longest edge to at most maxDimension (default 2048)
 *   and iteratively reduces JPEG quality until the file fits.
 */
export async function compressImage(
  file: File,
  maxBytes: number = 1 * 1024 * 1024, // 1 MB
  maxDimension: number = 2048
): Promise<File> {
  // Already small enough — skip compression
  if (file.size <= maxBytes) return file;

  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      // Calculate new dimensions, capped at maxDimension
      let { width, height } = img;
      if (width > maxDimension || height > maxDimension) {
        if (width >= height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("Canvas context unavailable"));
      ctx.drawImage(img, 0, 0, width, height);

      // Iteratively lower quality until we're under the limit
      let quality = 0.9;
      const tryCompress = () => {
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed"));

            if (blob.size <= maxBytes || quality <= 0.1) {
              // Done — wrap in a File
              const compressed = new File(
                [blob],
                file.name.replace(/\.[^.]+$/, ".jpg"),
                { type: "image/jpeg" }
              );
              resolve(compressed);
            } else {
              quality = Math.max(quality - 0.1, 0.1);
              tryCompress();
            }
          },
          "image/jpeg",
          quality
        );
      };

      tryCompress();
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image for compression"));
    };

    img.src = url;
  });
}
