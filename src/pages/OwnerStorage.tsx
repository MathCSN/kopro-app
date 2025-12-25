import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Database, Upload, Trash2, FileText, Image, Video, File, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/hooks/useAuth";
import { OwnerLayout } from "@/components/layout/OwnerLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StorageStats = {
  totalDocuments: number;
  totalSize: number;
  byType: {
    documents: number;
    images: number;
    videos: number;
    others: number;
  };
  recentFiles: {
    id: string;
    title: string;
    file_name: string;
    file_size: number | null;
    category: string | null;
    created_at: string;
  }[];
};

const MAX_STORAGE_GB = 100;

export default function OwnerStorage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StorageStats>({
    totalDocuments: 0,
    totalSize: 0,
    byType: { documents: 0, images: 0, videos: 0, others: 0 },
    recentFiles: [],
  });

  useEffect(() => {
    fetchStorageStats();
  }, []);

  const fetchStorageStats = async () => {
    try {
      setIsLoading(true);
      
      const { data: documents, error } = await supabase
        .from('documents')
        .select('id, title, file_name, file_size, category, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const docs = documents || [];
      const totalSize = docs.reduce((sum, d) => sum + (d.file_size || 0), 0);
      
      // Categorize by file extension
      let images = 0, videos = 0, docCount = 0, others = 0;
      docs.forEach(d => {
        const ext = (d.file_name || '').split('.').pop()?.toLowerCase() || '';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
          images++;
        } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
          videos++;
        } else if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'].includes(ext)) {
          docCount++;
        } else {
          others++;
        }
      });

      setStats({
        totalDocuments: docs.length,
        totalSize,
        byType: {
          documents: docCount,
          images,
          videos,
          others,
        },
        recentFiles: docs.slice(0, 10),
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques de stockage.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 o';
    const k = 1024;
    const sizes = ['o', 'Ko', 'Mo', 'Go', 'To'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = (): number => {
    const usedGB = stats.totalSize / (1024 * 1024 * 1024);
    return Math.min((usedGB / MAX_STORAGE_GB) * 100, 100);
  };

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  if (!user) return null;

  if (isLoading) {
    return (
      <OwnerLayout onLogout={handleLogout}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </OwnerLayout>
    );
  }

  return (
    <OwnerLayout onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold">Stockage</h1>
            <p className="text-muted-foreground mt-1">Gérez l'espace de stockage de la plateforme</p>
          </div>
          <Button variant="outline" onClick={() => toast({ title: "Nettoyage", description: "Fonctionnalité de nettoyage à venir." })}>
            <Trash2 className="h-4 w-4 mr-2" />
            Nettoyer
          </Button>
        </div>

        {/* Storage overview */}
        <Card className="shadow-soft">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-semibold">Espace utilisé</p>
                <p className="text-sm text-muted-foreground">
                  {formatBytes(stats.totalSize)} sur {MAX_STORAGE_GB} Go
                </p>
              </div>
              <p className="text-2xl font-bold">{getStoragePercentage().toFixed(1)}%</p>
            </div>
            <Progress value={getStoragePercentage()} className="h-2" />
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byType.documents}</p>
                  <p className="text-sm text-muted-foreground">Documents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-secondary/50">
                  <Image className="h-5 w-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byType.images}</p>
                  <p className="text-sm text-muted-foreground">Images</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-accent/50">
                  <Video className="h-5 w-5 text-accent-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byType.videos}</p>
                  <p className="text-sm text-muted-foreground">Vidéos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <File className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats.byType.others}</p>
                  <p className="text-sm text-muted-foreground">Autres</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent files or empty state */}
        {stats.recentFiles.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Database className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-semibold text-lg mb-2">Stockage vide</h3>
              <p className="text-muted-foreground">
                Les fichiers de vos résidences apparaîtront ici.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fichier</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentFiles.map((file) => (
                    <TableRow key={file.id}>
                      <TableCell className="font-medium">{file.title}</TableCell>
                      <TableCell className="text-muted-foreground">{file.category || 'Général'}</TableCell>
                      <TableCell className="text-muted-foreground">{formatBytes(file.file_size || 0)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(file.created_at).toLocaleDateString('fr-FR')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </OwnerLayout>
  );
}
