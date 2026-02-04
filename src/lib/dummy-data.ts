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
  
  description: string;
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
  contacts: [
    {
      avatarName: "avatar_4",
      bankAccounts: [
        {
          accountNumber: "1234567890",
          bankLogo: "BCA", 
          bankName: "Bank Central Asia"
        },
        {
          accountNumber: "08123456789",
          bankLogo: "Gopay", 
          bankName: "Gopay"
        }
      ],
      description: "Teman Kantor",
      id: "AZfCO1dyQYJfIm4Apd1z",
      name: "D",
      phoneNumber: "081299998888",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1"
    },
    {
      avatarName: "avatar_2",
      bankAccounts: [],
      description: "",
      id: "Contact_B_ID",
      name: "B",
      phoneNumber: "",
      userId: "HrH1LLMIpBa5ErlWcO5hg67tZlo1"
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