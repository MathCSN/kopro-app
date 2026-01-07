import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { BrowserQRCodeReader, IScannerControls } from "@zxing/browser";

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResult: (text: string) => void;
  onError?: (message: string) => void;
}

export function QrScannerDialog({ open, onOpenChange, onResult, onError }: QrScannerDialogProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      controlsRef.current?.stop();
      controlsRef.current = null;
      setError(null);
      return;
    }

    let mounted = true;
    const reader = new BrowserQRCodeReader();

    const start = async () => {
      try {
        if (!videoRef.current) return;

        const controls = await reader.decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            if (!mounted || !result) return;
            onResult(result.getText());
            onOpenChange(false);
          }
        );

        controlsRef.current = controls;
      } catch (e) {
        const message = "Impossible d'accéder à la caméra.";
        setError(message);
        onError?.(message);
      }
    };

    start();

    return () => {
      mounted = false;
      controlsRef.current?.stop();
      controlsRef.current = null;
    };
  }, [open, onOpenChange, onResult, onError]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 sm:max-w-md overflow-hidden">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle>Scanner un QR code</DialogTitle>
        </DialogHeader>

        <div className="px-4 pb-4">
          <div className="relative w-full aspect-square rounded-xl border border-border overflow-hidden bg-muted">
            <video
              ref={videoRef}
              className="absolute inset-0 h-full w-full object-cover"
              muted
              playsInline
            />
          </div>

          {error && (
            <p className="text-sm text-destructive mt-3">{error}</p>
          )}

          <div className="mt-4">
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
