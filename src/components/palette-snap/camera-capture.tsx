"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
}

export function CameraCapture({ onCapture }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let stream: MediaStream | null = null;
    let isCancelled = false;

    const getCameraPermission = async () => {
      if (hasCameraPermission === true || isCancelled) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (isCancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        if (isCancelled) return;
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();
    
    return () => {
        isCancelled = true;
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
    }
  }, [toast, hasCameraPermission]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL('image/png');
        setCapturedImage(dataUrl);
      }
    }
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onCapture(capturedImage);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
  };
  
  return (
    <div className="flex flex-col items-center gap-4 w-full">
        <div className="w-full aspect-video rounded-md overflow-hidden relative bg-muted border">
            {capturedImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
            ) : (
                <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted playsInline />
            )}
        </div>
      
        {hasCameraPermission === false && (
            <Alert variant="destructive">
                <AlertTitle>Camera Access Required</AlertTitle>
                <AlertDescription>
                Please allow camera access in your browser to use this feature.
                </AlertDescription>
            </Alert>
        )}

        <div className="flex gap-4">
            {capturedImage ? (
            <>
                <Button onClick={handleRetake} variant="outline" size="lg">
                    <RefreshCw className="mr-2" /> Retake
                </Button>
                <Button onClick={handleConfirm} size="lg">
                    <Check className="mr-2" /> Use Photo
                </Button>
            </>
            ) : (
            <Button onClick={handleCapture} disabled={hasCameraPermission !== true} size="lg">
                <Camera className="mr-2" /> Capture
            </Button>
            )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
