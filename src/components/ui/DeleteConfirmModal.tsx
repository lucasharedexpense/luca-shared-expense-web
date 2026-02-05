import React from "react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  title?: string; // Opsional, defaultnya nanti kita set
}

export default function DeleteConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  name, 
  title = "Hapus Item?" // Default title
}: DeleteConfirmModalProps) {
    
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-ui-white w-full max-w-xs rounded-2xl p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-ui-black mb-2">{title}</h3>
            
            <p className="text-sm text-ui-dark-grey mb-6 leading-relaxed">
                Apakah Anda yakin ingin menghapus <br/>
                <b className="text-ui-black">{name}</b>?
            </p>
            
            <div className="flex gap-3">
                <button 
                    onClick={onClose} 
                    className="flex-1 py-3 rounded-xl bg-ui-grey font-semibold text-sm text-gray-600 hover:bg-gray-200 transition-colors"
                >
                    Batal
                </button>
                <button 
                    onClick={onConfirm} 
                    className="flex-1 py-3 rounded-xl bg-ui-accent-red text-white font-semibold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-500/30"
                >
                    Hapus
                </button>
            </div>
        </div>
     </div>
  );
}