import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, FileText, Eye } from "lucide-react";

interface TenantCardProps {
  tenant: {
    id: string;
    user_id: string;
    profile: {
      first_name: string | null;
      last_name: string | null;
      email: string | null;
      phone: string | null;
      avatar_url: string | null;
    } | null;
    lot: {
      lot_number: string;
      door: string | null;
      floor: number | null;
    } | null;
    type: string;
    is_active: boolean;
    documents_count?: number;
  };
  onSelect: (tenant: TenantCardProps["tenant"]) => void;
}

export function TenantCard({ tenant, onSelect }: TenantCardProps) {
  const fullName = tenant.profile 
    ? `${tenant.profile.first_name || ""} ${tenant.profile.last_name || ""}`.trim() || "Sans nom"
    : "Sans nom";
  
  const initials = tenant.profile
    ? `${(tenant.profile.first_name || "")[0] || ""}${(tenant.profile.last_name || "")[0] || ""}`.toUpperCase() || "?"
    : "?";

  const lotInfo = tenant.lot
    ? `Lot ${tenant.lot.lot_number}${tenant.lot.floor ? ` - Étage ${tenant.lot.floor}` : ""}${tenant.lot.door ? ` - ${tenant.lot.door}` : ""}`
    : "Non assigné";

  return (
    <Card 
      className="group hover:shadow-medium transition-all duration-200 cursor-pointer border-border/50"
      onClick={() => onSelect(tenant)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarImage src={tenant.profile?.avatar_url || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {initials}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-foreground truncate">{fullName}</h3>
              <Badge 
                variant={tenant.is_active ? "default" : "secondary"}
                className={tenant.is_active ? "bg-success/10 text-success border-success/20" : ""}
              >
                {tenant.is_active ? "Actif" : "Inactif"}
              </Badge>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{lotInfo}</span>
              </div>
              
              {tenant.profile?.email && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{tenant.profile.email}</span>
                </div>
              )}

              {tenant.profile?.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-3.5 w-3.5 shrink-0" />
                  <span>{tenant.profile.phone}</span>
                </div>
              )}
            </div>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <FileText className="h-3.5 w-3.5" />
                <span>{tenant.documents_count || 0} document(s)</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                className="opacity-0 group-hover:opacity-100 transition-opacity gap-1.5"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(tenant);
                }}
              >
                <Eye className="h-3.5 w-3.5" />
                Voir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
