import { useState } from "react";
import { Building2, ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useResidence } from "@/contexts/ResidenceContext";

interface ResidenceSelectorProps {
  collapsed?: boolean;
}

export function ResidenceSelector({ collapsed = false }: ResidenceSelectorProps) {
  const {
    residences,
    selectedResidence,
    setSelectedResidence,
    isAllResidences,
    setIsAllResidences,
  } = useResidence();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filteredResidences = residences.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.city?.toLowerCase().includes(search.toLowerCase())
  );

  const displayName = isAllResidences
    ? "Toutes les résidences"
    : selectedResidence?.name || "Sélectionner...";

  if (collapsed) {
    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-9 h-9 rounded-lg bg-sidebar-accent/50 hover:bg-sidebar-accent mx-auto"
          >
            <Building2 className="h-5 w-5 text-sidebar-foreground" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-0 ml-2" align="start" side="right">
          <ResidenceList
            residences={filteredResidences}
            selectedResidence={selectedResidence}
            isAllResidences={isAllResidences}
            search={search}
            setSearch={setSearch}
            onSelect={(r) => {
              setSelectedResidence(r);
              setOpen(false);
            }}
            onSelectAll={() => {
              setIsAllResidences(true);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 py-2 h-auto bg-sidebar-accent/30 hover:bg-sidebar-accent border border-sidebar-border rounded-lg"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
            <span className="truncate text-sm font-medium text-sidebar-foreground">
              {displayName}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 text-sidebar-foreground/50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <ResidenceList
          residences={filteredResidences}
          selectedResidence={selectedResidence}
          isAllResidences={isAllResidences}
          search={search}
          setSearch={setSearch}
          onSelect={(r) => {
            setSelectedResidence(r);
            setOpen(false);
          }}
          onSelectAll={() => {
            setIsAllResidences(true);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

interface ResidenceListProps {
  residences: { id: string; name: string; city: string | null }[];
  selectedResidence: { id: string } | null;
  isAllResidences: boolean;
  search: string;
  setSearch: (value: string) => void;
  onSelect: (residence: { id: string; name: string; address: string | null; city: string | null }) => void;
  onSelectAll: () => void;
}

function ResidenceList({
  residences,
  selectedResidence,
  isAllResidences,
  search,
  setSearch,
  onSelect,
  onSelectAll,
}: ResidenceListProps) {
  return (
    <div className="bg-popover">
      <div className="p-2 border-b border-border">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>
      <ScrollArea className="max-h-[280px]">
        <div className="p-1">
          {/* All residences option */}
          <button
            onClick={onSelectAll}
            className={cn(
              "flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors",
              isAllResidences
                ? "bg-primary/10 text-primary"
                : "hover:bg-accent text-foreground"
            )}
          >
            <Building2 className="h-4 w-4" />
            <span className="flex-1 text-left">Toutes les résidences</span>
            {isAllResidences && <Check className="h-4 w-4" />}
          </button>

          {residences.length > 0 && (
            <div className="h-px bg-border my-1" />
          )}

          {residences.map((residence) => (
            <button
              key={residence.id}
              onClick={() => onSelect(residence as any)}
              className={cn(
                "flex items-center gap-2 w-full px-2 py-2 rounded-md text-sm transition-colors",
                selectedResidence?.id === residence.id && !isAllResidences
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-accent text-foreground"
              )}
            >
              <Building2 className="h-4 w-4" />
              <div className="flex-1 text-left min-w-0">
                <p className="truncate font-medium">{residence.name}</p>
                {residence.city && (
                  <p className="text-xs text-muted-foreground truncate">{residence.city}</p>
                )}
              </div>
              {selectedResidence?.id === residence.id && !isAllResidences && (
                <Check className="h-4 w-4 shrink-0" />
              )}
            </button>
          ))}

          {residences.length === 0 && search && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune résidence trouvée
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
