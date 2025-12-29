import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Lock, FileText, Download, Trash2, FolderOpen } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout/AppLayout";
import { VaultUploadDialog } from "@/components/vault/VaultUploadDialog";
import { toast } from "sonner";

const sampleVaultFiles = [
  {
    id: "1",
    name: "Acte de propriété.pdf",
    category: "Propriété",
    size: "2.4 MB",
    uploadedAt: "15 oct. 2024",
  },
  {
    id: "2",
    name: "Attestation assurance habitation.pdf",
    category: "Assurance",
    size: "1.1 MB",
    uploadedAt: "3 jan. 2025",
  },
  {
    id: "3",
    name: "Contrat de bail.pdf",
    category: "Location",
    size: "856 KB",
    uploadedAt: "1 sept. 2024",
  },
];

export default function Vault() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  return (
    <AppLayout userRole={user.role} onLogout={logout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Coffre-fort Personnel</h1>
            <p className="text-muted-foreground mt-1">Vos documents privés et sécurisés</p>
          </div>
          <VaultUploadDialog onUploaded={() => toast.success("Document ajouté")} />
        </div>

        <Card className="shadow-soft border-primary/20 bg-primary/5">
          <CardContent className="flex items-center gap-4 p-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Espace sécurisé</h3>
              <p className="text-sm text-muted-foreground">
                Seul vous avez accès à ces documents. Ils sont chiffrés et protégés.
              </p>
            </div>
          </CardContent>
        </Card>

        {sampleVaultFiles.length > 0 ? (
          <div className="grid gap-4">
            {sampleVaultFiles.map((file) => (
              <Card key={file.id} className="shadow-soft hover:shadow-medium transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                      <FileText className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{file.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {file.category} · {file.size} · Ajouté le {file.uploadedAt}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <FolderOpen className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="font-semibold text-foreground mb-2">Votre coffre-fort est vide</h3>
              <p className="text-muted-foreground mb-4">
                Commencez à sauvegarder vos documents importants en toute sécurité.
              </p>
              <VaultUploadDialog onUploaded={() => {}} />
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
