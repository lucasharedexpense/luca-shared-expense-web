"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Code, 
  Globe, 
  Instagram, 
  Info, 
  Check 
} from "lucide-react";
import { LucaLogo } from "@/components/ui/Icons"; // Asumsi file icon yang dibuat sebelumnya

// --- DATA: TEAM MEMBERS ---
const TEAM_MEMBERS = [
  { name: "Beben Rafli Luhut Tua Sianipar", role: "Full Stack Developer, Scrum Master" },
  { name: "Jeremy Emmanuel Susilo", role: "Full Stack Developer, DevOps Engineer" },
  { name: "Made Abel Surya Mahotama", role: "Full Stack Developer, Backend Developer" },
  { name: "Michael Kevin Pratama", role: "Full Stack Developer, UI/UX Designer" },
  { name: "Steven Kukilo Seto", role: "Full Stack Developer, Product Owner" },
];

// --- SUB-COMPONENTS ---

const SectionContainer = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="w-full bg-white rounded-2xl p-6 mb-4 border border-gray-100 shadow-sm">
    <h2 className="text-lg font-bold text-ui-black mb-4 font-display">{title}</h2>
    {children}
  </div>
);

const MissionItem = ({ number, text }: { number: string, text: string }) => (
  <div className="flex items-start gap-4 mb-4 last:mb-0">
    <div className="w-8 h-8 rounded-full bg-ui-accent-yellow flex items-center justify-center shrink-0">
      <span className="text-ui-black font-bold text-sm">{number}</span>
    </div>
    <p className="text-sm text-ui-black leading-relaxed mt-1">{text}</p>
  </div>
);

const ValueItem = ({ title, description }: { title: string, description: string }) => (
  <div className="mb-4 last:mb-0">
    <h3 className="text-base font-bold text-ui-black mb-1">{title}</h3>
    <p className="text-sm text-ui-dark-grey leading-relaxed">{description}</p>
  </div>
);

const TechItem = ({ tech, description }: { tech: string, description: string }) => (
  <div className="flex items-start gap-3 mb-3 last:mb-0">
    <div className="w-2 h-2 rounded-full bg-ui-accent-yellow mt-1.5 shrink-0" />
    <div>
        <h4 className="text-sm font-bold text-ui-black">{tech}</h4>
        <p className="text-xs text-ui-dark-grey">{description}</p>
    </div>
  </div>
);

const TeamMemberCard = ({ name, role }: { name: string, role: string }) => (
  <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col items-center text-center shadow-sm h-full hover:shadow-md transition-shadow">
    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3 text-gray-400">
        <Info className="w-8 h-8" />
    </div>
    <h3 className="text-sm font-bold text-ui-black mb-5 md:mb-0">{name}</h3>
    <p className="text-xs text-ui-dark-grey mb-5 h-8 flex items-center justify-center">{role}</p>
    
    <div className="flex gap-2 mt-auto">
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Code className="w-4 h-4 text-ui-black" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Globe className="w-4 h-4 text-ui-black" />
        </button>
        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
            <Instagram className="w-4 h-4 text-ui-black" />
        </button>
    </div>
  </div>
);

// --- MAIN PAGE ---

export default function AboutUsPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background">
      
      {/* HEADER TOP BAR */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
             <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">About Us</h1>
      </div>

      {/* CONTENT SCROLLABLE */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        <div className="p-5 flex flex-col gap-4">

            {/* 1. APP IDENTITY CARD */}
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4">
                     <LucaLogo className="w-full h-full" />
                </div>
                <h1 className="text-3xl font-bold font-display text-ui-black mb-2">Luca</h1>
                <p className="text-sm text-ui-dark-grey font-medium mb-2">Split Expense Made Simple</p>
                <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">Version 1.0.0</span>
            </div>

            {/* 2. DESCRIPTION */}
            <SectionContainer title="Tentang Luca">
                <p className="text-sm text-ui-black leading-relaxed text-justify mb-3">
                    Luca adalah aplikasi mobile yang dirancang untuk memudahkan Anda dalam membagi biaya bersama teman, keluarga, atau kelompok. Dengan fitur yang intuitif dan user-friendly, Luca membantu mengelola pengeluaran bersama dan melacak siapa yang berhutang kepada siapa.
                </p>
                <p className="text-sm text-ui-black leading-relaxed text-justify">
                    Luca dirancang untuk menghilangkan kebingungan dalam menghitung pembagian biaya dan memastikan semua orang mendapatkan perhitungan yang adil dan transparan.
                </p>
            </SectionContainer>

            {/* 3. VISION */}
            <SectionContainer title="Visi Kami">
                <p className="text-sm text-ui-black leading-relaxed text-justify">
                    Menjadi aplikasi pilihan utama dalam memudahkan pembagian biaya dengan cara yang fair, transparan, dan menyenangkan bagi semua pengguna.
                </p>
            </SectionContainer>

            {/* 4. MISSION */}
            <SectionContainer title="Misi Kami">
                <MissionItem number="1" text="Menyediakan platform yang mudah digunakan untuk mengelola pengeluaran bersama" />
                <MissionItem number="2" text="Memastikan perhitungan yang akurat dan transparan dalam pembagian biaya" />
                <MissionItem number="3" text="Mengurangi konflik dan kebingungan terkait pembagian pengeluaran" />
                <MissionItem number="4" text="Terus berinovasi untuk memberikan fitur terbaik kepada pengguna" />
            </SectionContainer>

            {/* 5. VALUES */}
            <SectionContainer title="Nilai Kami">
                <ValueItem title="Transparansi" description="Semua transaksi dan perhitungan ditampilkan dengan jelas dan jujur" />
                <div className="h-4" />
                <ValueItem title="Kepercayaan" description="Data pengguna dijaga dengan aman dan tidak dibagikan tanpa izin" />
                <div className="h-4" />
                <ValueItem title="Kemudahan" description="Antarmuka yang intuitif sehingga siapa saja bisa menggunakannya dengan mudah" />
                <div className="h-4" />
                <ValueItem title="Inovasi" description="Terus mengembangkan fitur baru berdasarkan masukan pengguna" />
            </SectionContainer>

            {/* 6. TEAM MEMBERS */}
            <SectionContainer title="Tim Pengembang">
                <div className="grid grid-cols-2 gap-3">
                    {TEAM_MEMBERS.map((member, idx) => {
                        // Logic untuk membuat item terakhir (ke-5) full width atau centered
                        // Di sini kita pakai flex/col-span logic kalau mau.
                        // Tapi grid-cols-2 dengan item ganjil akan menyisakan 1 di kiri.
                        // Agar mirip Android yang "centered" di baris terakhir, kita bisa pakai style khusus.
                        const isLastAndOdd = idx === TEAM_MEMBERS.length - 1 && TEAM_MEMBERS.length % 2 !== 0;
                        
                        return (
                            <div key={idx} className={isLastAndOdd ? "col-span-2 max-w-[50%] mx-auto w-full" : ""}>
                                <TeamMemberCard name={member.name} role={member.role} />
                            </div>
                        );
                    })}
                </div>
            </SectionContainer>

            {/* 7. TECH STACK */}
            <SectionContainer title="Teknologi yang Digunakan">
                <TechItem tech="Kotlin" description="Bahasa pemrograman untuk Android" />
                <TechItem tech="Jetpack Compose" description="Framework UI modern untuk Android" />
                <TechItem tech="Firebase" description="Backend dan database real-time" />
                <TechItem tech="Material Design 3" description="Design system modern" />
            </SectionContainer>

            {/* 8. COMMITMENT */}
            <SectionContainer title="Komitmen Kami kepada Anda">
                <p className="text-sm text-ui-black leading-relaxed text-justify mb-3">
                    Kami berkomitmen untuk terus memberikan pengalaman terbaik kepada setiap pengguna Luca. Kami selalu terbuka terhadap masukan, saran, dan kritik constructive untuk terus meningkatkan kualitas aplikasi.
                </p>
                <p className="text-sm text-ui-black leading-relaxed text-justify">
                    Pengembangan Luca adalah proses berkelanjutan yang melibatkan feedback dari komunitas pengguna. Terima kasih telah menjadi bagian dari perjalanan Luca!
                </p>
            </SectionContainer>

            {/* 9. FOOTER */}
            <div className="py-6 px-6 text-center">
                <div className="h-px w-full bg-gray-200 mb-6" />
                <p className="text-xs text-ui-dark-grey mb-2">© 2026 Luca. All rights reserved.</p>
                <p className="text-xs font-bold text-ui-accent-yellow">Made with ❤️ by Luca Team</p>
            </div>

        </div>
      </div>

    </div>
  );
}