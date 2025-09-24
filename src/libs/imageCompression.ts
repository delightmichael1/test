export async function optimizeImage(
  file: File | string,
  fileName: string,
  returnType: "string" | "file" = "file"
): Promise<File | string | null> {
  if (!file) return null;

  return new Promise((resolve) => {
    const originalImage = new Image();

    originalImage.onload = function () {
      const quality = 0.5;
      const scale = 0.9;
      const mimeType = "image/webp";

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        resolve(null);
        return;
      }

      const newWidth = originalImage.width * scale;
      const newHeight = originalImage.height * scale;

      canvas.width = newWidth;
      canvas.height = newHeight;

      ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);

      canvas.toBlob(
        function (blob) {
          if (!blob) {
            resolve(null);
            return;
          }

          const originalSize =
            typeof file === "string" ? getBase64FileSize(file) : file.size;

          const optimizedSize = blob.size;
          const reduction = originalSize - optimizedSize;
          const percentReduction = ((reduction / originalSize) * 100).toFixed(
            1
          );

          console.log(`Original size: ${(originalSize / 1024).toFixed(1)} KB`);
          console.log(
            `Optimized size: ${(optimizedSize / 1024).toFixed(1)} KB`
          );
          console.log(
            `Reduction: ${(reduction / 1024).toFixed(
              1
            )} KB (${percentReduction}% reduction)`
          );

          if (returnType === "string") {
            const optimizedURL = URL.createObjectURL(blob);
            resolve(optimizedURL);
          } else {
            const imageName = fileName.split(".")[0] + ".webp";
            const optimizedImage = new File([blob], imageName, {
              type: blob.type,
            });
            resolve(optimizedImage);
          }
        },
        mimeType,
        quality
      );
    };

    originalImage.onerror = function () {
      resolve(null);
    };

    originalImage.src =
      typeof file === "string" ? file : URL.createObjectURL(file);
  });
}

function getBase64FileSize(base64String: string): number {
  const base64 = base64String.includes(",")
    ? base64String.split(",")[1]
    : base64String;

  const padding = (base64.match(/=/g) || []).length;
  return Math.floor((base64.length * 3) / 4) - padding;
}
