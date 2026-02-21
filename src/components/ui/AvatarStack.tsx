import React from "react";

interface AvatarStackProps {
  avatars: (string | null | undefined)[]; // Update tipe biar lebih aman
  size?: number;
  overlap?: number;
  limit?: number;
  className?: string;
}

export default function AvatarStack({
  avatars = [],
  size = 28,
  overlap = -10,
  limit = 3,
  className = "",
}: AvatarStackProps) {
  
  // Validasi & Cleaning data
  const safeAvatars = avatars || [];
  const visibleAvatars = safeAvatars.slice(0, limit);
  const remainingCount = safeAvatars.length - limit;

  // Helper buat generate URL Dicebear
  // Kita pake index sebagai seed karena kita ga punya data 'nama' di sini
  const getFallbackAvatar = (seed: string | number) => 
    `https://api.dicebear.com/9.x/avataaars/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9`;

  if (safeAvatars.length === 0) {
    return null; 
  }

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((src, index) => {
        // Logic 1: Kalau src kosong/null dari awal, langsung pake Dicebear
        const initialSrc = (src && src.trim() !== "") 
          ? src 
          : getFallbackAvatar(index);

        return (
          <div
            key={index}
            className="relative rounded-full border-2 border-ui-white bg-ui-grey shadow-sm overflow-hidden shrink-0"
            style={{
              width: size,
              height: size,
              marginLeft: index === 0 ? 0 : overlap,
              zIndex: visibleAvatars.length - index,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={initialSrc} 
              alt={`User ${index}`} 
              className="w-full h-full object-cover"
              // Logic 2: Kalau gambar gagal di-load (404/corrupt), ganti ke Dicebear
              onError={(e) => {
                e.currentTarget.onerror = null; // Prevent infinite loop
                e.currentTarget.src = getFallbackAvatar(index);
              }}
            />
          </div>
        );
      })}

      {/* Indikator Sisa (+X) */}
      {remainingCount > 0 && (
        <div
          className="relative rounded-full border-2 border-ui-white bg-ui-black text-ui-white flex items-center justify-center shrink-0 shadow-sm"
          style={{
            width: size,
            height: size,
            marginLeft: overlap,
            fontSize: size * 0.45,
            fontWeight: "bold",
            zIndex: 0,
          }}
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
}