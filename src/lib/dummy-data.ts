// ==========================================
// 1. INTERFACES (Definisi Tipe Data)
// ==========================================

// --- Helper: Participant Simple (Dipake di Event & Activity) ---
export interface ParticipantSimple {
  avatarName: string;
  name: string;
}

// --- Helper: Bank Account (Dipake di Contact) ---
export interface BankAccount {
  accountNumber: string;
  bankLogo: string;
  bankName: string;
}

// --- ITEM (Sub-collection dari Activity) ---
export interface Item {
  discountAmount: number;
  itemName: string;
  memberNames: string[]; // Array of names
  price: number;
  quantity: number;
  taxPercentage: number;
  timestamp: number;
}

// --- ACTIVITY (Sub-collection dari Event) ---
export interface Activity {
  amount: number | string; // Bisa angka atau string kosong ""
  category: string;
  categoryColorHex: string;
  eventId: string; // "eventide" di prompt kemungkinan typo dari eventId
  id: string;
  
  // PaidBy (Object)
  paidBy: {
    avatarName: string;
    name: string;
  };

  // Participants (Array of Object)
  participants: ParticipantSimple[];
  
  payerName: string;
  title: string;

  // Sub-collection (untuk struktur dummy)
  items: Item[]; 
}

// --- EVENT (Sub-collection dari User) ---
export interface Event {
  date: string;
  id: string;
  imageUrl: string;
  location: string;
  
  // Participants (Array of Object)
  participants: ParticipantSimple[];
  
  settlementResultJson: string; // JSON String hasil split bill
  title: string;

  // Sub-collection (untuk struktur dummy)
  activities: Activity[];
}

// --- CONTACT (Sub-collection dari User) ---
export interface Contact {
  avatarName: string;
  
  // Bank Accounts (Array of Object)
  bankAccounts: BankAccount[];
  
  id: string;
  name: string;
  phoneNumber: string;
  userId: string;
}

// --- USER (Root Collection) ---
export interface UserData {
  avatarName: string;
  createdAt: number;
  email: string;
  uid: string;
  username: string;

  // Sub-collections (Nested untuk dummy)
  contacts: Contact[];
  events: Event[];
}

// ==========================================
// 2. DUMMY DATA (MOCK DATABASE)
// ==========================================

export const MOCK_DATABASE: UserData = {
  // Field User
  avatarName: "avatar_5",
  createdAt: 1770176894460,
  email: "bebensianipar@gmail.com",
  uid: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
  username: "Beben",

  // --- Sub-collection: CONTACTS ---
  // Di dalam object MOCK_DATABASE:

contacts: [
    // 1. A - Andi
    {
      id: "contact_001",
      name: "Andi Pratama",
      avatarName: "avatar_1",
      phoneNumber: "08123456001",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo2",
      bankAccounts: [
        { accountNumber: "111222333", bankLogo: "BCA", bankName: "Bank Central Asia" },
        { accountNumber: "08123456001", bankLogo: "OVO", bankName: "OVO" }
      ]
    },
    {
      id: "contact_016",
      name: "Andi Satria",
      avatarName: "avatar_1",
      phoneNumber: "",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo3",
      bankAccounts: [
        { accountNumber: "111222333", bankLogo: "BCA", bankName: "Bank Central Asia" },
        { accountNumber: "08123456001", bankLogo: "OVO", bankName: "OVO" }
      ]
    },
    {
      id: "contact_017",
      name: "Andi Zulfikar",
      avatarName: "avatar_1",
      phoneNumber: "08123456001",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo4",
      bankAccounts: []
    },
    // 2. B - Budi
    {
      id: "contact_002",
      name: "Budi Santoso",
      avatarName: "avatar_2",
      phoneNumber: "08123456002",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "9988776655", bankLogo: "Mandiri", bankName: "Bank Mandiri" }
      ]
    },
    // 3. C - Citra
    {
      id: "contact_003",
      name: "Citra Lestari",
      avatarName: "avatar_3",
      phoneNumber: "08123456003",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "555666777", bankLogo: "Jago", bankName: "Bank Jago" }
      ]
    },
    // 4. D - D (Dari data asli lu)
    {
      id: "AZfCO1dyQYJfIm4Apd1z",
      name: "D",
      avatarName: "avatar_4",
      phoneNumber: "081299998888",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "1234567890", bankLogo: "BCA", bankName: "Bank Central Asia" },
        { accountNumber: "08123456789", bankLogo: "Gopay", bankName: "Gopay" }
      ]
    },
    // 5. E - Eko
    {
      id: "contact_005",
      name: "Eko Kurniawan",
      avatarName: "avatar_5",
      phoneNumber: "08123456005",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: []
    },
    // 6. F - Fani
    {
      id: "contact_006",
      name: "Fani Rahmawati",
      avatarName: "avatar_6",
      phoneNumber: "08123456006",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "444555666", bankLogo: "BNI", bankName: "Bank Negara Indonesia" }
      ]
    },
    // 7. G - Gilang
    {
      id: "contact_007",
      name: "Gilang Ramadhan",
      avatarName: "avatar_7",
      phoneNumber: "08123456007",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "08123456007", bankLogo: "Dana", bankName: "Dana" }
      ]
    },
    // 8. H - Hana
    {
      id: "contact_008",
      name: "Hana Pertiwi",
      avatarName: "avatar_8",
      phoneNumber: "08123456008",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "123123123", bankLogo: "BCA", bankName: "Bank Central Asia" }
      ]
    },
    // 9. I - Indra
    {
      id: "contact_009",
      name: "Indra Lesmana",
      avatarName: "avatar_1",
      phoneNumber: "08123456009",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "777888999", bankLogo: "BRI", bankName: "Bank Rakyat Indonesia" }
      ]
    },
    // 10. J - Joko
    {
      id: "contact_010",
      name: "Joko Anwar",
      avatarName: "avatar_2",
      phoneNumber: "08123456010",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: []
    },
    // 11. K - Kiki
    {
      id: "contact_011",
      name: "Kiki Amalia",
      avatarName: "avatar_3",
      phoneNumber: "08123456011",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "08123456011", bankLogo: "ShopeePay", bankName: "ShopeePay" }
      ]
    },
    // 12. L - Luna
    {
      id: "contact_012",
      name: "Luna Maya",
      avatarName: "avatar_4",
      phoneNumber: "08123456012",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "111000111", bankLogo: "BCA", bankName: "Bank Central Asia" },
        { accountNumber: "222000222", bankLogo: "Mandiri", bankName: "Bank Mandiri" }
      ]
    },
    // 13. M - Mawar
    {
      id: "contact_013",
      name: "Mawar Eva",
      avatarName: "avatar_5",
      phoneNumber: "08123456013",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "333000333", bankLogo: "Jenius", bankName: "Jenius BTPN" }
      ]
    },
    // 14. N - Nana
    {
      id: "contact_014",
      name: "Nana Mirdad",
      avatarName: "avatar_6",
      phoneNumber: "08123456014",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: []
    },
    // 15. O - Omar
    {
      id: "contact_015",
      name: "Omar Daniel",
      avatarName: "avatar_7",
      phoneNumber: "08123456015",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1",
      bankAccounts: [
        { accountNumber: "999000999", bankLogo: "CIMB", bankName: "CIMB Niaga" }
      ]
    }
  ],

  // --- Sub-collection: EVENTS ---
  events: [
    {
      date: "05/02/2026",
      id: "Jl0ZG43KmwCbbuMV7HSH",
      imageUrl: "https://firebasestorage.googleapis.com/v0/b/luca-app/o/images%2Fplaceholder.jpg?alt=media",
      location: "Test 2",
      participants: [
        { avatarName: "avatar_4", name: "D" },
        { avatarName: "avatar_6", name: "E" },
        { avatarName: "avatar_7", name: "F" }
      ],
      settlementResultJson: "{}", // Placeholder JSON string
      title: "Test 2",

      // --- Sub-collection: ACTIVITIES ---
      activities: [
        {
          amount: "", 
          category: "Food",
          categoryColorHex: "#FFA726",
          eventId: "Jl0ZG43KmwCbbuMV7HSH",
          id: "l0f5ao4UMBUo22Lebcqm",
          paidBy: {
            avatarName: "avatar_2",
            name: "B"
          },
          participants: [
            { avatarName: "avatar_3", name: "C" },
            { avatarName: "avatar_4", name: "D" }
          ],
          payerName: "B",
          title: "Tes 2",

          // --- Sub-collection: ITEMS ---
          items: [
            {
              discountAmount: 10000,
              itemName: "Gurame",
              memberNames: ["Beben", "A", "B"],
              price: 60000,
              quantity: 3,
              taxPercentage: 1,
              timestamp: 1770177198291
            }
          ]
        }
      ]
    },
    // Event Kedua (Dummy)
    {
      date: "04/03/2026",
      id: "Event_Trip_Lampung",
      imageUrl: "",
      location: "Bakauheni, Lampung",
      participants: [
        { avatarName: "avatar_5", name: "Beben" },
        { avatarName: "avatar_1", name: "Sarah" }
      ],
      settlementResultJson: "{}",
      title: "Trip to Lampung",
      activities: []
    }
  ]
};