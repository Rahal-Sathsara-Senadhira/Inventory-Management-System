// src/lib/cloudinary.js
export async function uploadToCloudinary(file) {
  if (!file) throw new Error("No file provided");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD;
  const unsignedPreset = import.meta.env.VITE_CLOUDINARY_UNSIGNED_PRESET;

  const url = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", unsignedPreset);

  const res = await fetch(url, { method: "POST", body: fd });
  const data = await res.json();

  if (!res.ok) {
    const msg = data?.error?.message || "Cloudinary upload failed";
    throw new Error(msg);
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}
