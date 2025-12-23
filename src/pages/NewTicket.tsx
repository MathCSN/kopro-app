import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Ticket, ArrowLeft, Camera, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppLayout } from "@/components/layout/AppLayout";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function NewTicket() {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  if (!user || !profile) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Incident signalé", description: "Votre signalement a été envoyé." });
    navigate("/tickets");
  };

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
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
              <div className="space-y-2">
                <Label htmlFor="title">Titre</Label>
                <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Fuite robinet cuisine" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="plomberie">Plomberie</SelectItem>
                    <SelectItem value="electricite">Électricité</SelectItem>
                    <SelectItem value="parties_communes">Parties communes</SelectItem>
                    <SelectItem value="structure">Structure</SelectItem>
                    <SelectItem value="autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Décrivez le problème..." rows={4} required />
              </div>
              <Button type="button" variant="outline" className="w-full">
                <Camera className="h-4 w-4 mr-2" />Ajouter des photos
              </Button>
              <Button type="submit" className="w-full">
                <Send className="h-4 w-4 mr-2" />Envoyer le signalement
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
