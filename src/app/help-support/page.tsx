"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Mail, 
  Bug, 
  ChevronRight 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// --- COMPONENT: FAQ ITEM (ACCORDION) ---
const FaqItem = ({ question, answer }: { question: string, answer: string }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-4 px-5 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-medium text-sm text-ui-black pr-4">{question}</span>
        {isOpen ? (
            <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
        ) : (
            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
            <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
            >
                <div className="px-5 pb-4 text-xs text-ui-dark-grey leading-relaxed">
                    {answer}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- COMPONENT: CONTACT ACTION ITEM ---
interface ContactActionItemProps { icon: React.ReactNode; title: string; subtitle: string; onClick: () => void; }
const ContactActionItem = ({ icon, title, subtitle, onClick }: ContactActionItemProps) => {
  return (
    <button 
        onClick={onClick}
        className="w-full flex items-center bg-gray-50 hover:bg-gray-100 p-4 rounded-2xl transition-all group active:scale-[0.98]"
    >
        {/* Icon Circle */}
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm shrink-0">
            <div className="text-ui-accent-yellow">{icon}</div>
        </div>

        <div className="flex-1 text-left ml-4">
            <h4 className="font-bold text-sm text-ui-black group-hover:text-black">{title}</h4>
            <p className="text-xs text-ui-dark-grey">{subtitle}</p>
        </div>

        <ChevronRight className="w-5 h-5 text-gray-400" />
    </button>
  );
};

// --- MAIN PAGE ---

export default function HelpSupportPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const faqs = [
    { 
        q: "How to split a bill equally?", 
        a: "To split a bill equally, go to the Activity Detail page and toggle the 'Equal Split' switch. This will automatically divide the total amount by the number of participants." 
    },
    { 
        q: "Can I edit an activity after saving?", 
        a: "Yes! Simply tap on the activity you want to edit, then click the Edit (Pencil) icon. You can modify items, prices, and participants." 
    },
    { 
        q: "How do I add friends?", 
        a: "Currently, friends are added automatically when you create a new event. We are working on a dedicated contacts feature!" 
    },
    { 
        q: "Payment methods supported", 
        a: "Luca helps calculate split bills but does not process payments directly. You can settle up using your preferred payment apps like GoPay, OVO, or Bank Transfer." 
    }
  ];

  // Simple Search Filter
  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background relative">
      
      {/* HEADER TOP BAR */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
             <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">Help & Support</h1>
      </div>

      {/* SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="p-5 flex flex-col gap-6">

            {/* 1. SEARCH HERO SECTION */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold text-ui-black mb-2 font-display">How can we help you?</h2>
                <p className="text-sm text-ui-dark-grey mb-6">Search for topics or questions</p>

                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input 
                        type="text"
                        placeholder="e.g., split bill, forgot password"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 rounded-full bg-ui-background border-none outline-none text-sm text-ui-black focus:ring-2 focus:ring-ui-accent-yellow transition-all placeholder:text-gray-400"
                    />
                </div>
            </div>

            {/* 2. FAQ SECTION */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
                <div className="px-5 pt-5 pb-2">
                    <h3 className="font-bold text-base text-ui-black">Popular Topics</h3>
                </div>
                
                <div className="flex flex-col">
                    {filteredFaqs.length > 0 ? (
                        filteredFaqs.map((faq, idx) => (
                            <FaqItem key={idx} question={faq.q} answer={faq.a} />
                        ))
                    ) : (
                        <div className="p-5 text-center text-sm text-gray-400">
                            No topics found for &ldquo;{searchQuery}&rdquo;
                        </div>
                    )}
                </div>
            </div>

            {/* 3. CONTACT & ACTIONS */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                <h3 className="font-bold text-base text-ui-black mb-4 px-1">Still need help?</h3>
                
                <div className="flex flex-col gap-3">
                    <ContactActionItem 
                        icon={<Mail className="w-5 h-5" />}
                        title="Email Support"
                        subtitle="Get response within 24 hours"
                        onClick={() => window.location.href = "mailto:support@luca.app"}
                    />
                    
                    <ContactActionItem 
                        icon={<Bug className="w-5 h-5" />}
                        title="Report a Bug"
                        subtitle="Something not working?"
                        onClick={() => router.push("/report-bug")}
                    />
                </div>
            </div>

        </div>
      </div>

    </div>
  );
}