// lib/dummy-data.ts

// URL Avatar Generator (Pake DiceBear biar variatif)
const getAvatar = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

export const MOCK_EVENTS = [
  { 
    id: "1", 
    title: "Trip to Lampung", 
    location: "Bakauheni, Lampung", // <-- Tambah ini
    date: "Mar 4, 2026", 
    // totalExpense ga perlu dipanggil di UI, tapi biarin di data gapapa
    totalExpense: 2350000,
    participants: [
      getAvatar("Felix"), getAvatar("Budi"), getAvatar("Chandra"), 
      getAvatar("Dian"), getAvatar("Eka")
    ]
  },
  { 
    id: "2", 
    title: "Makan Siang Tim", 
    location: "Sushi Tei, Central Park", // <-- Tambah ini
    date: "Feb 10, 2026", 
    totalExpense: 450000,
    participants: [ getAvatar("Sarah"), getAvatar("Tom"), getAvatar("Jerry") ]
  },
  { 
    id: "3", 
    title: "Nonton Bioskop & Snacks", 
    location: "CGV Grand Indonesia", // <-- Tambah ini
    date: "Jan 28, 2026", 
    totalExpense: 185000,
    participants: [ getAvatar("Felix"), getAvatar("Sarah") ]
  },
  { 
    id: "4", 
    title: "Badminton Mingguan", 
    location: "GOR Bulutangkis Juara", // <-- Tambah ini
    date: "Jan 21, 2026", 
    totalExpense: 120000,
    participants: [
      getAvatar("Kevin"), getAvatar("Rian"), getAvatar("Marcus"), 
      getAvatar("Anthony"), getAvatar("Jonatan"), getAvatar("Fajar")
    ]
  },
  { 
    id: "5", 
    title: "Patungan Kado Bos", 
    location: "Kantor Pusat", // <-- Tambah ini
    date: "Jan 15, 2026", 
    totalExpense: 850000,
    participants: [
      getAvatar("Office1"), getAvatar("Office2"), getAvatar("Office3"), getAvatar("Office4")
    ]
  },
];

export const MockBackend = {
  getEvents: async () => {
    return new Promise<typeof MOCK_EVENTS>((resolve) => {
      // Delay dikit biar loading animation keliatan
      setTimeout(() => {
        resolve(MOCK_EVENTS);
      }, 1000); 
    });
  },
};