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
  const [isLoading, setIsLoading] = React.useState(true);
  const [retryCount, setRetryCount] = React.useState(0);

  // Function to stop ALL camera streams globally
  const stopAllCameraStreams = React.useCallback(async () => {
    // Stop our own stream
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current.load(); // Force reload
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("[Camera] Stopped track:", track.label);
      });
      streamRef.current = null;
    }

    // Wait a bit for resources to be released
    await new Promise(resolve => setTimeout(resolve, 300));
  }, []);

  // Function to initialize camera with multiple fallbacks
  const initCamera = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setCameraError(null);
      
      console.log("[Camera] === Starting camera initialization ===");
      
      // Step 1: Stop any existing streams first
      await stopAllCameraStreams();
      
      // Step 2: Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Your browser doesn't support camera access. Please use a modern browser like Chrome or Edge.");
      }

      // Step 3: List available cameras for debugging
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(d => d.kind === 'videoinput');
        console.log("[Camera] Available cameras:", videoDevices.length);
        videoDevices.forEach((device, i) => {
          console.log(`  [${i}] ${device.label || 'Camera ' + (i + 1)}`);
        });
      } catch (e) {
        console.log("[Camera] Could not enumerate devices:", e);
      }

      let stream: MediaStream | null = null;
      const constraints = [
        // Try 1: Ideal environment camera with lower resolution
        {
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        // Try 2: Any camera with lower resolution
        {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        },
        // Try 3: Absolute minimal constraints
        {
          video: true,
        },
        // Try 4: User-facing camera (front camera)
        {
          video: {
            facingMode: "user",
          },
        },
      ];

      // Try each constraint set until one works
      for (let i = 0; i < constraints.length; i++) {
        try {
          console.log(`[Camera] Attempt ${i + 1}/${constraints.length}:`, constraints[i]);
          stream = await navigator.mediaDevices.getUserMedia(constraints[i]);
          console.log(`[Camera] ✓ Success with attempt ${i + 1}`);
          break;
        } catch (attemptError) {
          console.log(`[Camera] ✗ Attempt ${i + 1} failed:`, attemptError);
          if (i === constraints.length - 1) {
            // This was the last attempt, throw the error
            throw attemptError;
          }
          // Otherwise, continue to next constraint
        }
      }

      if (!stream) {
        throw new Error("Failed to obtain camera stream after all attempts");
      }

      // Step 4: Attach stream to video element
      if (videoRef.current) {
        console.log("[Camera] Attaching stream to video element");
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        const loadPromise = new Promise<void>((resolve) => {
          if (videoRef.current) {
            videoRef.current.onloadedmetadata = () => {
              console.log("[Camera] ✓ Video metadata loaded");
              console.log(`[Camera] Video dimensions: ${videoRef.current?.videoWidth}x${videoRef.current?.videoHeight}`);
              resolve();
            };
          }
        });

        // Timeout if video doesn't load
        const timeoutPromise = new Promise<void>((_, reject) => {
          setTimeout(() => reject(new Error("Video loading timeout")), 10000);
        });

        await Promise.race([loadPromise, timeoutPromise]);
        
        setIsLoading(false);
        console.log("[Camera] === Camera initialization complete ===");
      }
    } catch (err) {
      console.error("[Camera] === Camera initialization failed ===");
      console.error("[Camera] Error details:", err);
      setIsLoading(false);
      
      let errorMsg = "Could not access camera.";
      let suggestion = "Please try uploading a file instead.";
      
      if (err instanceof DOMException) {
        switch (err.name) {
          case "NotAllowedError":
          case "PermissionDeniedError":
            errorMsg = "Camera permission was denied.";
            suggestion = "Click the 🔒 icon in your browser's address bar and allow camera access, then click Try Again.";
            break;
          case "NotFoundError":
          case "DevicesNotFoundError":
            errorMsg = "No camera was found on this device.";
            suggestion = "Please use the Upload File option to scan your receipt.";
            break;
          case "NotReadableError":
          case "TrackStartError":
            errorMsg = "Camera is already in use.";
            suggestion = "Close all other apps/tabs using the camera (Zoom, Teams, etc.), then click Try Again.";
            break;
          case "AbortError":
            errorMsg = "Camera access was interrupted.";
            suggestion = "Please click Try Again.";
            break;
          case "OverconstrainedError":
            errorMsg = "Camera doesn't meet the requirements.";
            suggestion = "Your camera may not be compatible. Please use Upload File instead.";
            break;
          case "SecurityError":
            errorMsg = "Camera access is blocked.";
            suggestion = "Make sure you're using HTTPS or localhost.";
            break;
          default:
            errorMsg = `Camera error: ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMsg = err.message;
      }
      
      setCameraError(`${errorMsg} ${suggestion}`);
    }
  }, [stopAllCameraStreams]);

  // Camera ON hanya di /scan/camera, selain itu OFF
  useEffect(() => {
    if (pathname === "/scan/camera") {
      initCamera();
    } else {
      stopAllCameraStreams();
    }
    return () => {
      stopAllCameraStreams();
    };
  }, [pathname, initCamera, stopAllCameraStreams, retryCount]);

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

        stopAllCameraStreams();
        router.push("/scan/upload");
      }, "image/jpeg");
    } catch {
      setError("Failed to capture photo. Please try again.");
    }
  };

  const handleUploadClick = () => {
    stopAllCameraStreams();
    router.push("/scan/upload");
  };

  return (
    <div className="flex flex-col h-full min-h-screen w-full bg-ui-background">
      <Header variant="SCAN" onLeftIconClick={() => router.push("/home")} />

      {/* CONTENT */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-5 py-6">
        <div className="max-w-2xl mx-auto h-full flex flex-col">
          {cameraError ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-md w-full">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <p className="text-sm font-bold text-red-700 mb-3">Camera Access Issue</p>
                <p className="text-sm text-red-600 mb-6 leading-relaxed">{cameraError}</p>
                
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      console.log("[Camera] User clicked Try Again");
                      setRetryCount(prev => prev + 1);
                    }}
                    className="w-full px-4 py-3 bg-ui-black text-white font-bold rounded-xl hover:bg-gray-800 transition-all"
                  >
                    🔄 Try Again
                  </button>
                  <button
                    onClick={handleUploadClick}
                    className="w-full px-4 py-3 bg-ui-accent-yellow text-ui-black font-bold rounded-xl hover:brightness-105 transition-all"
                  >
                    📁 Upload File Instead
                  </button>
                </div>
                
                {/* Quick tips */}
                <div className="mt-4 pt-4 border-t border-red-200">
                  <p className="text-xs text-gray-600 mb-2 font-semibold">Quick Tips:</p>
                  <ul className="text-xs text-gray-600 space-y-1 text-left">
                    <li>• Close Zoom, Teams, or other camera apps</li>
                    <li>• Check browser permissions (🔒 icon)</li>
                    <li>• Try a different browser</li>
                  </ul>
                </div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 border-4 border-ui-accent-yellow border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-sm font-semibold text-ui-black">Initializing Camera...</p>
                <p className="text-xs text-gray-500 mt-2">Please allow camera access if prompted</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 bg-black rounded-2xl overflow-hidden mb-6 shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {/* CAMERA CONTROLS */}
              <div className="flex items-center justify-center gap-6 pb-6">
                {/* Upload Icon Button */}
                <button
                  onClick={handleUploadClick}
                  className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100 transition-colors"
                  aria-label="Upload image from gallery"
                >
                  <ImageIcon className="w-6 h-6 text-ui-black" />
                </button>

                {/* Capture Button */}
                <button
                  onClick={handleCapturePhoto}
                  className="w-16 h-16 bg-ui-accent-yellow rounded-full flex items-center justify-center shadow-lg hover:brightness-105 active:scale-95 transition-all"
                  aria-label="Capture photo"
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
