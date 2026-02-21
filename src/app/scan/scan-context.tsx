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
  // Optional target activity to add scan results to directly
  targetEventId: string | null;
  setTargetEventId: (id: string | null) => void;
  targetActivityId: string | null;
  setTargetActivityId: (id: string | null) => void;
  reset: () => void;
}

const ScanContext = createContext<ScanContextType | undefined>(undefined);

export function ScanProvider({ children }: { children: React.ReactNode }) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [targetEventId, setTargetEventId] = useState<string | null>(null);
  const [targetActivityId, setTargetActivityId] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setPreview(null);
    setReceiptData(null);
    setError(null);
    setLoading(false);
    setTargetEventId(null);
    setTargetActivityId(null);
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
        targetEventId,
        setTargetEventId,
        targetActivityId,
        setTargetActivityId,
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
