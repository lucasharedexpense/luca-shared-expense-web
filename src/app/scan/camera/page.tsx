"use client";

import React, { useRef, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AlertCircle, Image as ImageIcon, Camera } from "lucide-react";
import Header from "@/components/ui/Header";
import { useScan } from "../scan-context";

export default function CameraPage() {
  const router = useRouter();
  const pathname = usePathname();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const { setFile, setPreview, setError, setReceiptData } = useScan();
  const [cameraError, setCameraError] = React.useState<string | null>(null);

  // Function to stop camera
  const stopCamera = () => {
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;

    }
  };

  // Camera ON hanya di /scan/camera, selain itu OFF
  useEffect(() => {
    if (pathname === "/scan/camera") {
      const initCamera = async () => {
        try {
          setCameraError(null);
          const stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: "environment",
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
          });

          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            streamRef.current = stream;
          }
        } catch (err) {
          const errorMsg =
            err instanceof Error
              ? err.message
              : "Could not access camera. Please check permissions.";
          setCameraError(errorMsg);
        }
      };

      initCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [pathname]);

  const handleCapturePhoto = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      const context = canvasRef.current.getContext("2d");
      if (!context) return;

      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      canvasRef.current.toBlob((blob) => {
        if (!blob) return;

        const file = new File([blob], "receipt-photo.jpg", {
          type: "image/jpeg",
        });

        setFile(file);
        setPreview(canvasRef.current!.toDataURL("image/jpeg"));
        setError(null);
        setReceiptData(null);

        stopCamera();
        router.push("/scan/upload");
      }, "image/jpeg");
    } catch {
      setError("Failed to capture photo. Please try again.");
    }
  };

  const handleUploadClick = () => {
    stopCamera();
    router.push("/scan/upload");
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background">
      <Header variant="SCAN" onLeftIconClick={() => router.push("/home")} />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          {cameraError ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm font-semibold text-red-700 mb-2">Camera Access Denied</p>
                <p className="text-sm text-red-600 mb-6">{cameraError}</p>
                <button
                  onClick={handleUploadClick}
                  className="px-4 py-2 bg-ui-accent-yellow text-ui-black font-bold rounded-lg hover:brightness-105 transition-all"
                >
                  Upload File Instead
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 bg-black rounded-2xl overflow-hidden mb-6 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              {/* CAMERA CONTROLS */}
              <div className="flex items-center justify-center gap-6 pb-6">
                {/* Upload Icon Button */}
                <button
                  onClick={handleUploadClick}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                >
                  <ImageIcon className="w-6 h-6 text-ui-black" />
                </button>

                {/* Capture Button */}
                <button
                  onClick={handleCapturePhoto}
                  className="w-16 h-16 bg-ui-accent-yellow rounded-full flex items-center justify-center shadow-lg hover:brightness-105 active:scale-95 transition-all"
                >
                  <Camera className="w-8 h-8 text-ui-black" />
                </button>

                {/* Spacer for alignment */}
                <div className="w-14"></div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Hidden Canvas */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
