import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eraser, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignaturePadProps {
  label?: string;
  onSave?: (signatureDataUrl: string) => void;
  onClear?: () => void;
  className?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export function SignaturePad({
  label = "Signature",
  onSave,
  onClear,
  className,
  width = 320,
  height = 200,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for retina displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);

    // Set drawing styles
    ctx.strokeStyle = "hsl(220 20% 20%)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Fill with white background
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
  }, [width, height]);

  const getPosition = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ("touches" in e) {
        if (e.touches.length === 0) return null;
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      return {
        x: clientX - rect.left,
        y: clientY - rect.top,
      };
    },
    []
  );

  const startDrawing = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (disabled) return;
      e.preventDefault();

      const pos = getPosition(e);
      if (!pos) return;

      setIsDrawing(true);
      setLastPos(pos);
    },
    [disabled, getPosition]
  );

  const draw = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");
      if (!canvas || !ctx || !lastPos) return;

      const pos = getPosition(e);
      if (!pos) return;

      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      setLastPos(pos);
      setHasSignature(true);
    },
    [isDrawing, disabled, lastPos, getPosition]
  );

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    setLastPos(null);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, width, height);
    setHasSignature(false);
    onClear?.();
  }, [width, height, onClear]);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const dataUrl = canvas.toDataURL("image/png");
    onSave?.(dataUrl);
  }, [hasSignature, onSave]);

  return (
    <Card className={cn("shadow-soft", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          {label}
          {hasSignature && (
            <span className="text-xs text-success font-normal flex items-center gap-1">
              <Check className="h-3 w-3" />
              Signé
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div
          className={cn(
            "relative border-2 border-dashed rounded-lg overflow-hidden touch-none",
            disabled ? "border-muted bg-muted/30" : "border-border bg-white",
            hasSignature && "border-success/50"
          )}
        >
          <canvas
            ref={canvasRef}
            className="block cursor-crosshair"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && !disabled && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-muted-foreground text-sm">
                Signez ici avec votre doigt
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSignature}
            disabled={disabled || !hasSignature}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Effacer
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={saveSignature}
            disabled={disabled || !hasSignature}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            Valider
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
