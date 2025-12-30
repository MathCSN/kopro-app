import { useState, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { GripVertical, RotateCcw, Save, Eye, EyeOff } from "lucide-react";
import { useNavSettings, NavSettings, NavCategory, NavItem, defaultNavSettings } from "@/hooks/useNavSettings";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface NavSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SortableCategoryProps {
  category: NavCategory;
  items: NavItem[];
  onTitleChange: (id: string, title: string) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
  onItemTitleChange: (id: string, title: string) => void;
  onItemVisibilityChange: (id: string, visible: boolean) => void;
  onItemsReorder: (categoryId: string, items: NavItem[]) => void;
}

interface SortableItemProps {
  item: NavItem;
  onTitleChange: (id: string, title: string) => void;
  onVisibilityChange: (id: string, visible: boolean) => void;
}

function SortableItem({ item, onTitleChange, onVisibilityChange }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md bg-muted/50",
        isDragging && "opacity-50 shadow-lg z-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </button>
      <Input
        value={item.title}
        onChange={(e) => onTitleChange(item.id, e.target.value)}
        className="flex-1 h-8 text-sm"
      />
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => onVisibilityChange(item.id, !item.visible)}
      >
        {item.visible ? (
          <Eye className="h-4 w-4 text-primary" />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  );
}

function SortableCategory({
  category,
  items,
  onTitleChange,
  onVisibilityChange,
  onItemTitleChange,
  onItemVisibilityChange,
  onItemsReorder,
}: SortableCategoryProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleItemDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      const reordered = arrayMove(items, oldIndex, newIndex).map((item, index) => ({
        ...item,
        order: index,
      }));
      onItemsReorder(category.id, reordered);
    }
  };

  const sortedItems = [...items].sort((a, b) => a.order - b.order);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(isDragging && "opacity-50 shadow-lg")}
    >
      <CardHeader className="py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </button>
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">Catégorie</Label>
              <Input
                value={category.title}
                onChange={(e) => onTitleChange(category.id, e.target.value)}
                className="h-8 font-medium"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs text-muted-foreground">Visible</Label>
            <Switch
              checked={category.visible}
              onCheckedChange={(checked) => onVisibilityChange(category.id, checked)}
            />
          </div>
        </div>
      </CardHeader>

      {category.visible && (
        <CardContent className="pt-0">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleItemDragEnd}
          >
            <SortableContext
              items={sortedItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {sortedItems.map((item) => (
                  <SortableItem
                    key={item.id}
                    item={item}
                    onTitleChange={onItemTitleChange}
                    onVisibilityChange={onItemVisibilityChange}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </CardContent>
      )}
    </Card>
  );
}

export function NavSettingsDialog({ open, onOpenChange }: NavSettingsDialogProps) {
  const { navSettings, updateSettings, resetToDefault, isSaving } = useNavSettings();
  const [localSettings, setLocalSettings] = useState<NavSettings>(navSettings);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleItemsReorder = (categoryId: string, reorderedItems: NavItem[]) => {
    setLocalSettings((prev) => ({
      ...prev,
      items: prev.items.map((item) => {
        if (item.categoryId !== categoryId) return item;
        const reorderedItem = reorderedItems.find((ri) => ri.id === item.id);
        return reorderedItem || item;
      }),
    }));
  };

  const handleCategoryDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLocalSettings((prev) => {
        const sortedCategories = [...prev.categories].sort((a, b) => a.order - b.order);
        const oldIndex = sortedCategories.findIndex((c) => c.id === active.id);
        const newIndex = sortedCategories.findIndex((c) => c.id === over.id);
        const reordered = arrayMove(sortedCategories, oldIndex, newIndex).map((cat, index) => ({
          ...cat,
          order: index,
        }));
        return { ...prev, categories: reordered };
      });
    }
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

  const getItemsForCategory = (categoryId: string) => {
    return localSettings.items.filter((item) => item.categoryId === categoryId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GripVertical className="h-5 w-5" />
            Personnaliser la navigation
          </DialogTitle>
          <DialogDescription>
            Glissez-déposez pour réorganiser les catégories et éléments. Modifiez les noms et la visibilité.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleCategoryDragEnd}
          >
            <SortableContext
              items={sortedCategories.map((c) => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-4">
                {sortedCategories.map((category) => (
                  <SortableCategory
                    key={category.id}
                    category={category}
                    items={getItemsForCategory(category.id)}
                    onTitleChange={handleCategoryTitleChange}
                    onVisibilityChange={handleCategoryVisibilityChange}
                    onItemTitleChange={handleItemTitleChange}
                    onItemVisibilityChange={handleItemVisibilityChange}
                    onItemsReorder={handleItemsReorder}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
