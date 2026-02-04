"use client";

import { Search, UserPlus } from "lucide-react";

export default function ContactsPage() {
  const dummyFriends = [
    { name: "Felix", status: "Owe you Rp 50.000" },
    { name: "Sarah", status: "Settled up" },
    { name: "Budi", status: "Settled up" },
    { name: "Milo", status: "Owes you Rp 12.000" },
    { name: "Chandra", status: "Settled up" },
  ];

  return (
    <div className="flex flex-col h-full w-full">
      
      {/* 1. Header Area (Kuning) */}
      <div className="px-5 pb-6 pt-2 shrink-0 z-20 flex justify-between items-center">
         <h1 className="text-2xl font-bold font-display text-ui-black">Friends</h1>
         <button className="bg-ui-black text-ui-white p-2 rounded-full active:scale-90 transition-transform">
            <UserPlus className="w-5 h-5" />
         </button>
      </div>

      {/* 2. White Content Area */}
      <div className="flex-1 bg-ui-white rounded-t-[30px] shadow-[-5px_-5px_20px_rgba(0,0,0,0.05)] overflow-hidden flex flex-col relative z-0">
        
        {/* Search Input Dummy */}
        <div className="mt-6 mx-5 bg-ui-grey/50 rounded-xl h-12 flex items-center px-4 gap-3">
            <Search className="w-5 h-5 text-ui-dark-grey" />
            <span className="text-ui-dark-grey font-medium text-sm">Find friends...</span>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-6 pb-32 px-5">
           <p className="text-xs font-bold text-ui-dark-grey uppercase tracking-widest mb-4">
              All Contacts
           </p>
           
           <div className="flex flex-col gap-2">
              {dummyFriends.map((friend, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-colors">
                      {/* Avatar Placeholder */}
                      <div className="w-10 h-10 rounded-full bg-ui-grey border border-ui-black/5 overflow-hidden">
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.name}`} alt={friend.name} />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 border-b border-ui-grey/30 pb-3">
                          <h4 className="font-bold text-ui-black">{friend.name}</h4>
                          <p className={`text-xs font-medium ${friend.status.includes("Owe") ? "text-ui-accent-red" : "text-ui-dark-grey"}`}>
                              {friend.status}
                          </p>
                      </div>
                  </div>
              ))}
           </div>
        </div>
      </div>
    </div>
  );
}