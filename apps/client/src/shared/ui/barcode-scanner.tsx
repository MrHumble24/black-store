import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Button } from "./button";
import { Maximize, X, RefreshCw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./dialog";

interface BarcodeScannerProps {
  onScan: (decodedText: string) => void;
  onClose: () => void;
  isOpen: boolean;
}

export function BarcodeScanner({
  onScan,
  onClose,
  isOpen,
}: BarcodeScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const elementId = "barcode-scanner-viewport";

  useEffect(() => {
    let timeoutId: any;

    if (isOpen) {
      // Small delay to ensure Dialog animation finishes and element is in DOM
      timeoutId = setTimeout(() => {
        const element = document.getElementById(elementId);
        if (element && !scannerRef.current) {
          scannerRef.current = new Html5Qrcode(elementId);
        }
        if (scannerRef.current && !isScanning) {
          startScanner();
        }
      }, 300);
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      // We don't stop here because the Dialog might still be closing
      // stopScanner is called in handleClose which is triggered by Dialog
    };
  }, [isOpen]);

  const startScanner = async () => {
    if (!scannerRef.current || isScanning) return;

    try {
      setIsScanning(true);
      setError(null);
      setCameraActive(false);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 150 },
        aspectRatio: 1.0,
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
        ],
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          onScan(decodedText);
          handleClose(); // Use handleClose to ensure full cleanup
        },
        () => {
          // Success callback but no code found in this frame
        }
      );
      setCameraActive(true);
    } catch (err: any) {
      console.error("Scanner start error:", err);
      setError(
        "Failed to start camera. Please ensure permissions are granted."
      );
      setIsScanning(false);
      setCameraActive(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
        setIsScanning(false);
        setCameraActive(false);
      } catch (err) {
        console.error("Scanner stop error:", err);
      }
    }
  };

  const handleClose = async () => {
    await stopScanner();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 bg-card border-border">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-foreground flex items-center gap-2">
            <Maximize className="w-5 h-5 text-blue-500" />
            Barcode Scanner
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Align the barcode or QR code within the frame to scan.
          </DialogDescription>
        </DialogHeader>

        <div className="relative aspect-square w-full bg-black overflow-hidden group">
          <div id={elementId} className="w-full h-full" />

          {!cameraActive && !error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/50 backdrop-blur-sm">
              <div className="w-16 h-16 border-t-2 border-l-2 border-blue-500 animate-spin rounded-full" />
              <p className="text-muted-foreground text-sm font-medium">
                Initializing camera...
              </p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-muted/80 p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                <X className="w-6 h-6 text-red-500" />
              </div>
              <p className="text-foreground font-medium">{error}</p>
              <Button
                onClick={startScanner}
                variant="outline"
                className="mt-2 border-border hover:bg-accent text-foreground"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          )}

          {/* Scanner Overlay */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-40 border-black/40" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[250px] h-[150px] border-2 border-blue-500/50 rounded-lg shadow-[0_0_0_1000px_rgba(0,0,0,0.5)]">
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-blue-500 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-blue-500 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-blue-500 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-blue-500 rounded-br-sm" />

                {/* Scanning Line */}
                <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-[scan_2s_linear_infinite]" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-muted/50 border-t border-border flex justify-center">
          <Button
            variant="ghost"
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            Cancel Scanning
          </Button>
        </div>
      </DialogContent>
      <style>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        #barcode-scanner-viewport video {
          object-fit: cover !important;
          width: 100% !important;
          height: 100% !important;
        }
      `}</style>
    </Dialog>
  );
}
