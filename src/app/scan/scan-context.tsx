"use client";

import React, { createContext, useContext, useState } from "react";

export interface ReceiptItem {
  name: string;
  price: string;
  qty: string;
}

export interface ReceiptData {
  items: ReceiptItem[];
  subtotal: string | null;
  tax: string | null;
  service_charge: string | null;
  total: string | null;
}

interface ScanContextType {
  file: File | null;
  setFile: (file: File | null) => void;
  preview: string | null;
  setPreview: (preview: string | null) => void;
  receiptData: ReceiptData | null;
  setReceiptData: (data: ReceiptData | null) => void;
  error: string | null;
  setError: (error: string | null) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setReceiptData(null);
    setError(null);
    setLoading(false);
  };

  return (
    <ScanContext.Provider
      value={{
        file,
        setFile,
        preview,
        setPreview,
        receiptData,
        setReceiptData,
        error,
        setError,
        loading,
        setLoading,
        reset,
      }}
    >
      {children}
    </ScanContext.Provider>
  );
}

export function useScan() {
  const context = useContext(ScanContext);
  if (!context) {
    throw new Error("useScan must be used within ScanProvider");
  }
  return context;
}
