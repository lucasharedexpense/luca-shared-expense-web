"use client";

import React, { useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, Camera, AlertCircle } from "lucide-react";
import Header from "@/components/ui/Header";
import { useScan } from "../scan-context";

/** Returns true when running on a touch-based mobile/tablet device */
function isMobileOrTablet(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod|Mobile|Tablet/i.test(navigator.userAgent);
}

export default function CameraPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  // Mobile: native camera input (capture="environment")
  const nativeCameraInputRef = useRef<HTMLInputElement>(null);
  // Gallery input for all devices
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { setFile, setPreview, setError, setReceiptData, setTargetEventId, setTargetActivityId } = useScan();

  // "mobile" = use native camera app; "desktop" = use WebRTC stream; null = detecting
  const [mode, setMode] = useState<"mobile" | "desktop" | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Read optional target activity params from URL
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      setTargetEventId(params.get("eventId") ?? null);
      setTargetActivityId(params.get("activityId") ?? null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Detect device type on mount
  useEffect(() => {
    setMode(isMobileOrTablet() ? "mobile" : "desktop");
  }, []);

  // ── WebRTC helpers (desktop only) ──────────────────────────────────────────

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
      });
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const startCamera = useCallback(async () => {
    setIsLoading(true);
    setCameraError(null);
    stopCamera();
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Camera not supported.");
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsLoading(false);
    } catch (err) {
      setIsLoading(false);
      if (err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "PermissionDeniedError")) {
        setCameraError("Camera permission denied. Allow camera access in your browser settings, then click Retry.");
      } else if (err instanceof DOMException && (err.name === "NotFoundError" || err.name === "DevicesNotFoundError")) {
        setCameraError("No camera found on this device. Use gallery instead.");
      } else if (err instanceof DOMException && (err.name === "NotReadableError" || err.name === "TrackStartError")) {
        setCameraError("Camera is in use by another app. Close it and click Retry.");
      } else {
        setCameraError((err instanceof Error ? err.message : "Could not access camera.") + " Try gallery instead.");
      }
    }
  }, [stopCamera]);

  // Desktop: start WebRTC stream when mode is detected; mobile: skip, just trigger native input
  useEffect(() => {
    if (mode === "desktop") {
      startCamera();
      return () => stopCamera();
    }
    if (mode === "mobile") {
      setIsLoading(false);
      // Small delay so the hidden input is mounted before we trigger it
      const t = setTimeout(() => nativeCameraInputRef.current?.click(), 80);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // ── Shared file handler ────────────────────────────────────────────────────

  const handleFileSelected = (file: File) => {
    setFile(file);
    setError(null);
    setReceiptData(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      stopCamera();
      router.push("/scan/upload");
    };
    reader.readAsDataURL(file);
  };

  const handleNativeCameraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
    // If user cancelled on mobile, let them see the fallback buttons
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelected(file);
  };

  // ── Desktop: capture from live stream ─────────────────────────────────────

  const handleCapturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    canvasRef.current.width = videoRef.current.videoWidth;
    canvasRef.current.height = videoRef.current.videoHeight;
    ctx.drawImage(videoRef.current, 0, 0);
    canvasRef.current.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], "receipt-photo.jpg", { type: "image/jpeg" });
      setFile(file);
      setPreview(canvasRef.current!.toDataURL("image/jpeg"));
      setError(null);
      setReceiptData(null);
      stopCamera();
      router.push("/scan/upload");
    }, "image/jpeg");
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-screen w-full bg-ui-background overflow-hidden">
      <Header variant="SCAN" onLeftIconClick={() => { stopCamera(); router.push("/home"); }} />

      {/* Native camera input — mobile/tablet only (full autofocus + native resolution) */}
      <input
        ref={nativeCameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Take a photo with camera"
        onChange={handleNativeCameraChange}
        className="hidden"
      />

      {/* Gallery/file picker — all devices */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        aria-label="Choose image from gallery"
        onChange={handleGalleryChange}
        className="hidden"
      />

      {/* ── MOBILE / TABLET MODE ─────────────────────────────────────────── */}
      {mode === "mobile" && (
        <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 bg-ui-accent-yellow/10 rounded-full flex items-center justify-center">
              <Camera className="w-10 h-10 text-ui-accent-yellow" />
            </div>
            <p className="text-sm font-semibold text-ui-black">Scan Receipt</p>
            <p className="text-xs text-ui-dark-grey/70">
              Use your device camera for the best quality and autofocus
            </p>
          </div>
          <div className="flex flex-col gap-3 w-full max-w-sm">
            <button
              onClick={() => nativeCameraInputRef.current?.click()}
              className="w-full py-4 bg-ui-accent-yellow text-ui-black font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md hover:brightness-105"
            >
              <Camera className="w-5 h-5" />
              Open Camera
            </button>
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="w-full py-4 bg-ui-grey text-ui-black font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all hover:bg-ui-grey/80"
            >
              <ImageIcon className="w-5 h-5" />
              Choose from Gallery
            </button>
          </div>
        </div>
      )}

      {/* ── DESKTOP MODE ─────────────────────────────────────────────────── */}
      {mode === "desktop" && (
        <div className="flex-1 relative overflow-hidden">

          {/* Error state */}
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 bg-ui-background">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md w-full">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-red-700 mb-2">Camera Access Issue</p>
                <p className="text-sm text-red-600 mb-6 leading-relaxed">{cameraError}</p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={startCamera}
                    className="w-full py-3 bg-ui-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                  >
                    🔄 Retry
                  </button>
                  <button
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-full py-3 bg-ui-accent-yellow text-ui-black font-bold rounded-xl hover:brightness-105 transition-all"
                  >
                    <span className="flex items-center justify-center gap-2">
                      <ImageIcon className="w-4 h-4" /> Choose from Gallery
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Loading state */}
          {!cameraError && isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-ui-background">
              <div className="w-14 h-14 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-semibold text-ui-black">Starting camera…</p>
              <p className="text-xs text-gray-500 mt-1">Allow camera access if prompted</p>
            </div>
          )}

          {/* Live WebRTC stream */}
          <div className={`absolute inset-0 flex flex-col ${!cameraError && !isLoading ? "" : "invisible pointer-events-none"}`}>
            <div className="flex-1 relative bg-black overflow-hidden md:max-w-2xl md:w-full md:mx-auto md:mt-6 md:rounded-2xl md:shadow-lg">
              <video ref={videoRef} autoPlay playsInline muted className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
            </div>
            <div className="flex items-center justify-center gap-6 py-5 max-w-2xl mx-auto w-full px-5">
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                aria-label="Choose from gallery"
              >
                <ImageIcon className="w-6 h-6 text-ui-black" />
              </button>
              <button
                onClick={handleCapturePhoto}
                className="w-16 h-16 bg-ui-accent-yellow rounded-full flex items-center justify-center shadow-lg hover:brightness-105 active:scale-95 transition-all"
                aria-label="Capture photo"
              >
                <Camera className="w-8 h-8 text-ui-black" />
              </button>
              <div className="w-14" />
            </div>
          </div>

        </div>
      )}

      {/* Detecting device — brief blank while mode resolves */}
      {mode === null && (
        <div className="flex-1 flex flex-col items-center justify-center bg-ui-background">
          <div className="w-14 h-14 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
