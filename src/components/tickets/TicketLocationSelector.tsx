import { Home, Building2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface TicketLocationSelectorProps {
  value: "private" | "common";
  onChange: (value: "private" | "common") => void;
}

export function TicketLocationSelector({ value, onChange }: TicketLocationSelectorProps) {
  return (
    <div className="space-y-2">
      <Label>Où se situe le problème ? *</Label>
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => onChange("private")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
            value === "private"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <Home className={cn("h-8 w-8", value === "private" ? "text-primary" : "text-muted-foreground")} />
          <div className="text-center">
            <p className="font-medium text-sm">Dans mon appartement</p>
            <p className="text-xs text-muted-foreground mt-1">
              Fuite, panne, dégât...
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChange("common")}
          className={cn(
            "flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all",
            value === "common"
              ? "border-primary bg-primary/5 text-primary"
              : "border-border hover:border-muted-foreground/50"
          )}
        >
          <Building2 className={cn("h-8 w-8", value === "common" ? "text-primary" : "text-muted-foreground")} />
          <div className="text-center">
            <p className="font-medium text-sm">Parties communes</p>
            <p className="text-xs text-muted-foreground mt-1">
              Hall, ascenseur, toiture...
            </p>
          </div>
        </button>
      </div>
    </div>
  );
}
