import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera, Send, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useResidence } from "@/contexts/ResidenceContext";
import { TicketLocationSelector } from "@/components/tickets/TicketLocationSelector";

function NewTicketContent() {
  const { user, profile } = useAuth();
  const { selectedResidence, residences } = useResidence();
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [ticketType, setTicketType] = useState<"private" | "common">("private");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const effectiveResidence = selectedResidence || (residences.length === 1 ? residences[0] : null);

  if (!user || !profile) {
    return null;
  }

  const handleImageUpload = async (files: FileList) => {
    if (!user || files.length === 0) return;
    
    setUploading(true);
    const uploadedUrls: string[] = [];
    
    try {
      for (let i = 0; i < Math.min(files.length, 4 - images.length); i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `tickets/${user.id}/${Date.now()}-${i}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, file, { upsert: false });
        
        if (uploadError) {
          console.error('Upload error:', uploadError);
          continue;
        }
        
        const { data } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName);
        
        uploadedUrls.push(data.publicUrl);
      }
      
      if (uploadedUrls.length > 0) {
        setImages(prev => [...prev, ...uploadedUrls]);
        toast.success(`${uploadedUrls.length} photo(s) ajoutée(s)`);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!effectiveResidence) {
      toast.error("Veuillez sélectionner une résidence");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .insert({
          title,
          description,
          category,
          ticket_type: ticketType,
          residence_id: effectiveResidence.id,
          created_by: user.id,
          status: 'open',
          priority: 'medium',
        });

      if (error) throw error;

      // If common ticket, notify the syndic
      if (ticketType === "common") {
        // Check if there's a syndic assigned to this residence
        const { data: syndicAssignment } = await supabase
          .from("syndic_assignments")
          .select("syndic_user_id")
          .eq("residence_id", effectiveResidence.id)
          .eq("status", "active")
          .single();

        if (syndicAssignment) {
          // TODO: Send notification to syndic
          console.log("Syndic notified:", syndicAssignment.syndic_user_id);
        }
      }

      toast.success("Incident signalé avec succès");
      navigate("/tickets");
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error("Erreur lors de la création du ticket");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <Button variant="ghost" onClick={() => navigate('/tickets')}>
        <ArrowLeft className="h-4 w-4 mr-2" />Retour
      </Button>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Nouveau signalement</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Location selector - private or common area */}
            <TicketLocationSelector value={ticketType} onChange={setTicketType} />

            <div className="space-y-2">
              <Label htmlFor="title">Titre</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder={ticketType === "private" ? "Ex: Fuite robinet cuisine" : "Ex: Porte hall cassée"} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Catégorie</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                <SelectContent>
                  {ticketType === "private" ? (
                    <>
                      <SelectItem value="plomberie">Plomberie</SelectItem>
                      <SelectItem value="electricite">Électricité</SelectItem>
                      <SelectItem value="chauffage">Chauffage</SelectItem>
                      <SelectItem value="menuiserie">Menuiserie</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="ascenseur">Ascenseur</SelectItem>
                      <SelectItem value="hall_entree">Hall / Entrée</SelectItem>
                      <SelectItem value="toiture">Toiture</SelectItem>
                      <SelectItem value="parking">Parking</SelectItem>
                      <SelectItem value="espaces_verts">Espaces verts</SelectItem>
                      <SelectItem value="autre">Autre</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez le problème..." rows={4} required />
            </div>

            {/* Hidden file input - opens native iOS/Android picker */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (e.target.files) {
                  handleImageUpload(e.target.files);
                  e.target.value = '';
                }
              }}
            />

            {/* Uploaded images preview */}
            {images.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {images.map((url, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={url} 
                      alt={`Photo ${index + 1}`} 
                      className="h-20 w-20 object-cover rounded-lg border border-border"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading || images.length >= 4}
            >
              <Camera className="h-4 w-4 mr-2" />
              {uploading ? 'Upload...' : 'Ajouter des photos'}
            </Button>
            <Button type="submit" className="w-full" disabled={submitting}>
              <Send className="h-4 w-4 mr-2" />
              {submitting ? 'Envoi...' : 'Envoyer le signalement'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function NewTicket() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!profile) {
    return null;
  }

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <NewTicketContent />
    </AppLayout>
  );
}
