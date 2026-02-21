"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Camera, AlertCircle } from "lucide-react";

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const pathname = usePathname();

  const stopCameraMedia = () => {
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    let isMounted = true;
    const startCamera = async () => {
      try {
        // Check if still on scan page before starting
        if (!isMounted || pathname !== "/scan") return;
        
        setErrorMessage("");
        setCameraActive(false);
        
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment", // Gunakan kamera belakang (untuk scan)
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        // Double-check: only set stream if still on scan page and component is mounted
        if (isMounted && videoRef.current && pathname === "/scan") {
          streamRef.current = stream;
          videoRef.current.srcObject = stream;
        } else {
          // If pathname changed while waiting for getUserMedia, stop the stream
          stream.getTracks().forEach((track) => track.stop());
        }
      } catch {
        if (!isMounted) return;
        
        let errorMsg = "Unable to access camera";
        
        if (error instanceof DOMException) {
          if (error.name === "NotAllowedError") {
            errorMsg = "Camera permission denied. Please allow camera access.";
          } else if (error.name === "NotFoundError") {
            errorMsg = "No camera device found.";
          }
        }
        setErrorMessage(errorMsg);
        setCameraActive(false);
      }
    };

    if (pathname === "/scan/camera") {
      startCamera();
    } else {
      stopCameraMedia();
    }

    return () => {
      isMounted = false;
      stopCameraMedia();
    };
  }, [pathname]);

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const link = document.createElement("a");
        link.href = canvasRef.current.toDataURL("image/jpeg");
        link.download = `receipt-${Date.now()}.jpg`;
        link.click();
      }
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-black relative">
      {/* Video Camera Stream - Always render */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onLoadedMetadata={() => setCameraActive(true)}
          className="w-full h-full object-cover"
        />
        
        {/* Scanner Overlay - Only show when camera is active */}
        {cameraActive && (
          <>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-64 h-64 border-2 border-ui-accent-yellow rounded-3xl">
                {/* Top Left Corner */}
                <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-ui-accent-yellow"></div>
                {/* Top Right Corner */}
                <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-ui-accent-yellow"></div>
                {/* Bottom Left Corner */}
                <div className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-ui-accent-yellow"></div>
                {/* Bottom Right Corner */}
                <div className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-ui-accent-yellow"></div>
                
                {/* Animated Scanning Line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-ui-accent-yellow animate-[bounce_2s_infinite]" />
              </div>
            </div>

            {/* Dark Overlay untuk area di luar scanner */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          </>
        )}

        {/* Placeholder - Show while loading */}
        {!cameraActive && !errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-white space-y-4 bg-black">
            <Camera className="w-16 h-16 text-white/50 animate-pulse" />
            <p className="text-sm font-medium text-center text-white/70">
              Opening camera...
            </p>
          </div>
        )}

        {/* Error State - Show if there's an error */}
        {errorMessage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-10 text-white space-y-4 bg-black">
            <AlertCircle className="w-16 h-16 text-red-400" />
            <p className="text-sm font-medium text-center text-white">{errorMessage}</p>
          </div>
        )}
      </div>

      {/* Control Bottom Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col items-center justify-center z-10 space-y-4">
        {cameraActive && (
          <>
            <button
              onClick={capturePhoto}
              className="w-16 h-16 rounded-full bg-ui-accent-yellow hover:bg-yellow-500 transition-colors shadow-lg flex items-center justify-center"
              title="Capture photo"
            >
              <Camera className="w-8 h-8 text-black" />
            </button>
            <p className="text-xs text-white/60">Tap to capture</p>
          </>
        )}
      </div>

      {/* Hidden Canvas untuk capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
