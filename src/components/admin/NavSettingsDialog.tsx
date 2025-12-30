import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GripVertical, RotateCcw, Save, Eye, EyeOff, ChevronUp, ChevronDown } from "lucide-react";
import { useNavSettings, NavSettings, NavCategory, NavItem, defaultNavSettings } from "@/hooks/useNavSettings";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NavSettingsDialog({ open, onOpenChange }: NavSettingsDialogProps) {
  const { navSettings, updateSettings, resetToDefault, isSaving } = useNavSettings();
  const [localSettings, setLocalSettings] = useState<NavSettings>(navSettings);

  useEffect(() => {
    if (open) {
      setLocalSettings(navSettings);
    }
  }, [open, navSettings]);

  const handleCategoryTitleChange = (categoryId: string, newTitle: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, title: newTitle } : cat
      ),
    }));
  };

  const handleCategoryVisibilityChange = (categoryId: string, visible: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      categories: prev.categories.map((cat) =>
        cat.id === categoryId ? { ...cat, visible } : cat
      ),
    }));
  };

  const handleItemTitleChange = (itemId: string, newTitle: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, title: newTitle } : item
      ),
    }));
  };

  const handleItemVisibilityChange = (itemId: string, visible: boolean) => {
    setLocalSettings((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === itemId ? { ...item, visible } : item
      ),
    }));
  };

  const moveCategoryUp = (categoryId: string) => {
    setLocalSettings((prev) => {
      const sortedCategories = [...prev.categories].sort((a, b) => a.order - b.order);
      const index = sortedCategories.findIndex((c) => c.id === categoryId);
      if (index <= 0) return prev;
      
      const newCategories = [...sortedCategories];
      [newCategories[index - 1], newCategories[index]] = [newCategories[index], newCategories[index - 1]];
      
      return {
        ...prev,
        categories: newCategories.map((cat, i) => ({ ...cat, order: i })),
      };
    });
  };

  const moveCategoryDown = (categoryId: string) => {
    setLocalSettings((prev) => {
      const sortedCategories = [...prev.categories].sort((a, b) => a.order - b.order);
      const index = sortedCategories.findIndex((c) => c.id === categoryId);
      if (index >= sortedCategories.length - 1) return prev;
      
      const newCategories = [...sortedCategories];
      [newCategories[index], newCategories[index + 1]] = [newCategories[index + 1], newCategories[index]];
      
      return {
        ...prev,
        categories: newCategories.map((cat, i) => ({ ...cat, order: i })),
      };
    });
  };

  const moveItemUp = (itemId: string) => {
    setLocalSettings((prev) => {
      const item = prev.items.find((i) => i.id === itemId);
      if (!item) return prev;
      
      const categoryItems = prev.items
        .filter((i) => i.categoryId === item.categoryId)
        .sort((a, b) => a.order - b.order);
      
      const index = categoryItems.findIndex((i) => i.id === itemId);
      if (index <= 0) return prev;
      
      const newCategoryItems = [...categoryItems];
      [newCategoryItems[index - 1], newCategoryItems[index]] = [newCategoryItems[index], newCategoryItems[index - 1]];
      
      const updatedItems = prev.items.map((i) => {
        if (i.categoryId !== item.categoryId) return i;
        const newIndex = newCategoryItems.findIndex((ci) => ci.id === i.id);
        return { ...i, order: newIndex };
      });
      
      return { ...prev, items: updatedItems };
    });
  };

  const moveItemDown = (itemId: string) => {
    setLocalSettings((prev) => {
      const item = prev.items.find((i) => i.id === itemId);
      if (!item) return prev;
      
      const categoryItems = prev.items
        .filter((i) => i.categoryId === item.categoryId)
        .sort((a, b) => a.order - b.order);
      
      const index = categoryItems.findIndex((i) => i.id === itemId);
      if (index >= categoryItems.length - 1) return prev;
      
      const newCategoryItems = [...categoryItems];
      [newCategoryItems[index], newCategoryItems[index + 1]] = [newCategoryItems[index + 1], newCategoryItems[index]];
      
      const updatedItems = prev.items.map((i) => {
        if (i.categoryId !== item.categoryId) return i;
        const newIndex = newCategoryItems.findIndex((ci) => ci.id === i.id);
        return { ...i, order: newIndex };
      });
      
      return { ...prev, items: updatedItems };
    });
  };

  const handleSave = () => {
    updateSettings(localSettings);
    toast.success("Paramètres de navigation sauvegardés");
    onOpenChange(false);
  };

  const handleReset = () => {
    setLocalSettings(defaultNavSettings);
    resetToDefault();
    toast.success("Navigation réinitialisée par défaut");
  };

  const sortedCategories = [...localSettings.categories].sort((a, b) => a.order - b.order);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Personnaliser la navigation
          </DialogTitle>
          <DialogDescription>
            Modifiez les noms, l'ordre et la visibilité des éléments de navigation.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {sortedCategories.map((category, catIndex) => (
              <Card key={category.id}>
                <CardHeader className="py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <div className="flex flex-col">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveCategoryUp(category.id)}
                          disabled={catIndex === 0}
                        >
                          <ChevronUp className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-5 w-5"
                          onClick={() => moveCategoryDown(category.id)}
                          disabled={catIndex === sortedCategories.length - 1}
                        >
                          <ChevronDown className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground">Catégorie</Label>
                        <Input
                          value={category.title}
                          onChange={(e) => handleCategoryTitleChange(category.id, e.target.value)}
                          className="h-8 font-medium"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Visible</Label>
                      <Switch
                        checked={category.visible}
                        onCheckedChange={(checked) => handleCategoryVisibilityChange(category.id, checked)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                {category.visible && (
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {localSettings.items
                        .filter((item) => item.categoryId === category.id)
                        .sort((a, b) => a.order - b.order)
                        .map((item, itemIndex, arr) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-2 p-2 rounded-md bg-muted/50"
                          >
                            <div className="flex flex-col">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => moveItemUp(item.id)}
                                disabled={itemIndex === 0}
                              >
                                <ChevronUp className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4"
                                onClick={() => moveItemDown(item.id)}
                                disabled={itemIndex === arr.length - 1}
                              >
                                <ChevronDown className="h-3 w-3" />
                              </Button>
                            </div>
                            <Input
                              value={item.title}
                              onChange={(e) => handleItemTitleChange(item.id, e.target.value)}
                              className="flex-1 h-8 text-sm"
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleItemVisibilityChange(item.id, !item.visible)}
                            >
                              {item.visible ? (
                                <Eye className="h-4 w-4 text-primary" />
                              ) : (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </ScrollArea>

        <Separator />

        <div className="flex justify-between gap-2">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Réinitialiser
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Sauvegarde..." : "Sauvegarder"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
