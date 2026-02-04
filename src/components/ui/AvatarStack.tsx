interface AvatarStackProps {
  avatars: string[];
  size?: number;
  overlap?: number;
  limit?: number;
  className?: string;
}

export default function AvatarStack({
  avatars = [],
  size = 28, // Default size gw gedein dikit biar lebih jelas
  overlap = -10,
  limit = 3,
  className = "",
}: AvatarStackProps) {
  
  // Validasi: kalau avatars null/undefined, pake array kosong
  const safeAvatars = avatars || [];
  const visibleAvatars = safeAvatars.slice(0, limit);
  const remainingCount = safeAvatars.length - limit;

  if (safeAvatars.length === 0) {
    return null; // Gak nampilin apa-apa kalau gak ada partisipan
  }

  return (
    <div className={`flex items-center ${className}`}>
      {visibleAvatars.map((src, index) => (
        <div
          key={index}
          // Tambahin bg-ui-grey biar ada warnanya kalau gambar loading/gagal
          className="relative rounded-full border-2 border-ui-white bg-ui-grey shadow-sm overflow-hidden shrink-0"
          style={{
            width: size,
            height: size,
            marginLeft: index === 0 ? 0 : overlap,
            zIndex: visibleAvatars.length - index,
          }}
        >
          {/* Pake <img> standar HTML */}
          <img 
            src={src} 
            alt={`User ${index}`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback kalau gambar error (opsional: ganti src ke placeholder lokal)
              e.currentTarget.style.display = 'none'; // Sembunyiin img, tampilin bg-ui-grey
            }}
          />
        </div>
      ))}

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