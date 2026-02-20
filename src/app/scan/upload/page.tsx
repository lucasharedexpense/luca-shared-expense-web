"use client";

import React, { useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Upload, AlertCircle, X, Loader2 } from "lucide-react";
import Header from "@/components/ui/Header";
import { useScan } from "../scan-context";
import { scanReceipt } from "@/app/action";

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { file, setFile, preview, setPreview, error, setError, loading, setLoading, setReceiptData } = useScan();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    setFile(selectedFile);
    setError(null);
    setReceiptData(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleScan = async () => {
    if (!file) {
      setError("Please select an image file first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[Upload Page] Starting scan...");
      const formData = new FormData();
      formData.append("file", file);

      const result = await scanReceipt(formData);
      console.log("[Upload Page] Scan result:", result);

      if (!result.success || result.error) {
        setError(result.error || "Failed to scan receipt");
        setReceiptData(null);
      } else if (result.data) {
        setReceiptData(result.data);
        setError(null);
        console.log("[Upload Page] Navigating to result page...");
        router.push("/scan/result");
      }
    } catch (err) {
      console.error("[Upload Page] Exception:", err);
      const errorMsg = err instanceof Error ? err.message : "Failed to scan receipt. Please try again.";
      setError(errorMsg);
      setReceiptData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    router.push("/scan/camera");
  };

  const handleClear = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setReceiptData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background">
      <Header variant="SCAN" onLeftIconClick={() => router.push("/home")} />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="max-w-2xl mx-auto">
          {/* FILE UPLOAD AREA */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center mb-6 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
              aria-label="Upload receipt image"
            />

            {preview ? (
              <div className="space-y-4">
                <div className="relative w-full max-h-64 rounded-xl overflow-hidden bg-gray-100">
                  <Image src={preview} alt="Preview" fill className="object-cover" unoptimized />
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 px-4 py-2 bg-gray-100 text-ui-black font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
                  >
                    Change Image
                  </button>
                  <button
                    onClick={handleClear}
                    className="flex-1 px-4 py-2 bg-red-500 text-white font-semibold text-sm rounded-xl hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Clear
                  </button>
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer space-y-4"
              >
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-ui-accent-yellow/10 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-ui-accent-yellow" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-ui-black">Click to upload or drag and drop</p>
                  <p className="text-xs text-ui-dark-grey mt-1">PNG, JPG, GIF up to 10MB</p>
                </div>
              </div>
            )}
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 mb-6">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-700">Error</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* SCAN BUTTON */}
          {file && !error && (
            <button
              onClick={handleScan}
              disabled={loading}
              className="w-full py-3 bg-ui-accent-yellow text-ui-black font-bold rounded-xl hover:brightness-105 active:scale-[0.98] transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scanning...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Scan Receipt
                </>
              )}
            </button>
          )}

          {/* BACK TO CAMERA */}
          <button
            onClick={handleReset}
            className="w-full py-2 bg-gray-100 text-ui-black font-semibold text-sm rounded-xl hover:bg-gray-200 transition-colors"
          >
            Back to Camera
          </button>
        </div>
      </div>
    </div>
  );
}
