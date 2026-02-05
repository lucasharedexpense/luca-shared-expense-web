"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bug, ImagePlus, Check, X, Loader2 } from "lucide-react";

// --- COMPONENT: CUSTOM TEXT FIELD ---
interface LucaTextFieldProps extends React.InputHTMLAttributes<HTMLInputElement | HTMLTextAreaElement> {
  label: string;
  isTextArea?: boolean;
}

const LucaTextField = ({ label, isTextArea = false, className, ...props }: LucaTextFieldProps) => {
  return (
    <div className="w-full">
      <label className="text-sm font-bold text-ui-black mb-2 block">{label}</label>
      {isTextArea ? (
        <textarea 
          className={`w-full bg-ui-grey border border-ui-grey/50 rounded-xl px-4 py-3 text-sm text-ui-black font-medium outline-none focus:border-ui-accent-yellow focus:ring-1 focus:ring-ui-accent-yellow transition-all resize-none ${className}`}
          rows={5}
          {...props as React.TextareaHTMLAttributes<HTMLTextAreaElement>}
        />
      ) : (
        <input 
          className={`w-full bg-ui-grey border border-ui-grey/50 rounded-xl px-4 py-3 text-sm text-ui-black font-medium outline-none focus:border-ui-accent-yellow focus:ring-1 focus:ring-ui-accent-yellow transition-all ${className}`}
          {...props as React.InputHTMLAttributes<HTMLInputElement>}
        />
      )}
    </div>
  );
};

// --- MAIN PAGE ---
export default function ReportBugPage() {
  const router = useRouter();
  
  // State
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Mock Handle Submit
  const handleSubmit = () => {
    if (!subject || !description) return;
    
    setIsSubmitting(true);
    
    // Simulate API Delay
    setTimeout(() => {
        setIsSubmitting(false);
        setShowSuccess(true);
        
        // Auto go back after success
        setTimeout(() => {
            router.back();
        }, 1500);
    }, 1500);
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background relative">
      
      {/* 1. TOP BAR */}
      <div className="px-5 pt-6 pb-4 flex items-center gap-4 bg-white sticky top-0 z-30 border-b border-gray-50">
        <button 
            onClick={() => router.back()} 
            className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
        >
             <ArrowLeft className="w-5 h-5 text-ui-black" />
        </button>
        <h1 className="text-xl font-bold font-display text-ui-black">Report a Bug</h1>
      </div>

      {/* 2. SCROLLABLE CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
        <div className="flex flex-col gap-4 p-5">
            
            {/* SECTION: INTRO */}
            <div className="bg-white rounded-2xl p-6 flex flex-col items-center text-center shadow-sm border border-gray-100">
                <div className="w-16 h-16 rounded-2xl bg-ui-accent-yellow/20 flex items-center justify-center mb-4 text-ui-black">
                    <Bug className="w-8 h-8" />
                </div>
                <h2 className="text-lg font-bold text-ui-black mb-2">Found an issue?</h2>
                <p className="text-sm text-ui-dark-grey leading-relaxed max-w-xs">
                    Please describe the bug you encountered. Your feedback helps us make Luca better.
                </p>
            </div>

            {/* SECTION: FORM */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col gap-5">
                <LucaTextField 
                    label="Subject"
                    placeholder="e.g., App crashes on split screen"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                />
                
                <LucaTextField 
                    label="Description"
                    placeholder="Tell us what happened, steps to reproduce, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    isTextArea={true}
                />
            </div>

            {/* SECTION: ATTACHMENT */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-ui-black mb-1">Screenshots (Optional)</h3>
                <p className="text-xs text-ui-dark-grey mb-4">Upload images to help us understand the issue.</p>
                
                <div className="flex gap-3">
                    {/* Add Button Placeholder */}
                    <button className="w-20 h-20 rounded-xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 transition-colors text-gray-400 hover:text-gray-600">
                        <ImagePlus className="w-6 h-6" />
                        <span className="text-[10px] font-medium">Add</span>
                    </button>
                    
                    {/* Contoh visual kalau ada foto (bisa dikomen kalo gak perlu) */}
                    {/* <div className="w-20 h-20 rounded-xl bg-gray-200 border border-gray-100 overflow-hidden relative group">
                        <img src="https://via.placeholder.com/150" className="w-full h-full object-cover" />
                        <button className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                            <X className="w-3 h-3" />
                        </button>
                    </div> */}
                </div>
            </div>
        </div>
      </div>

      {/* 3. BOTTOM BAR (STICKY) */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white border-t border-gray-100 z-30 md:pl-72">
        {/* md:pl-72 itu kompensasi kalau ada sidebar di desktop */}
        <button 
            onClick={handleSubmit}
            disabled={!subject || !description || isSubmitting}
            className={`w-full h-12 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                (!subject || !description) 
                ? "bg-gray-200 text-gray-400 cursor-not-allowed" 
                : "bg-ui-accent-yellow text-ui-black hover:brightness-105 active:scale-95 shadow-ui-accent-yellow/20"
            }`}
        >
            {isSubmitting ? (
                <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                </>
            ) : (
                "Submit Report"
            )}
        </button>
      </div>

      {/* SUCCESS TOAST OVERLAY */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-ui-black text-white px-6 py-4 rounded-2xl shadow-xl flex flex-col items-center gap-3 animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center text-white">
                    <Check className="w-6 h-6" strokeWidth={3} />
                </div>
                <div className="text-center">
                    <h3 className="font-bold text-lg">Thank You!</h3>
                    <p className="text-xs text-gray-300">Your report has been submitted.</p>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}