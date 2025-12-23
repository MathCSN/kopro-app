import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Download,
  Eye,
  FolderOpen,
  File,
  Clock,
  Upload,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Document {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  created_at: string;
}

const categories = [
  { id: "pv", name: "Procès-verbaux AG", icon: FileText },
  { id: "reglement", name: "Règlement & Statuts", icon: FileText },
  { id: "contrats", name: "Contrats & Assurances", icon: File },
  { id: "travaux", name: "Travaux & Devis", icon: File },
  { id: "comptes", name: "Comptes & Budgets", icon: File },
  { id: "general", name: "Documents divers", icon: FolderOpen },
];

export default function Documents() {
  const { user, profile, logout, isManager } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchDocuments();
    }
  }, [user]);

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/auth");
  };

  const filteredDocuments = documents.filter(doc => {
    const matchSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || doc.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const recentDocuments = [...documents]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  const getCategoryCount = (categoryId: string) => {
    return documents.filter(d => d.category === categoryId).length;
  };

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  if (!user || !profile) return null;

  return (
    <AppLayout userRole={profile.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-1">Bibliothèque documentaire de la copropriété</p>
          </div>
          {isManager() && (
            <Button>
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un document..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1 space-y-2">
            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider mb-3">
              Catégories
            </h3>
            <Button
              variant={selectedCategory === null ? "secondary" : "ghost"}
              className="w-full justify-between"
              onClick={() => setSelectedCategory(null)}
            >
              <div className="flex items-center gap-2">
                <FolderOpen className="h-4 w-4" />
                <span>Tous les documents</span>
              </div>
              <Badge variant="secondary">{documents.length}</Badge>
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "secondary" : "ghost"}
                className="w-full justify-between"
                onClick={() => setSelectedCategory(category.id)}
              >
                <div className="flex items-center gap-2">
                  <category.icon className="h-4 w-4" />
                  <span className="truncate">{category.name}</span>
                </div>
                <Badge variant="secondary">{getCategoryCount(category.id)}</Badge>
              </Button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recent Documents */}
            {!selectedCategory && !searchQuery && recentDocuments.length > 0 && (
              <Card className="shadow-soft">
                <CardHeader className="pb-3">
                  <CardTitle className="font-display text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    Documents récents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {recentDocuments.slice(0, 3).map((doc) => (
                      <div
                        key={doc.id}
                        className="p-4 rounded-xl border border-border hover:shadow-soft transition-all cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                          {doc.title}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.file_name?.split('.').pop()?.toUpperCase() || 'PDF'} · {formatFileSize(doc.file_size)}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* All Documents List */}
            <Card className="shadow-soft">
              <CardHeader className="pb-3">
                <CardTitle className="font-display text-lg">
                  {selectedCategory 
                    ? categories.find(c => c.id === selectedCategory)?.name 
                    : "Tous les documents"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-center text-muted-foreground py-8">Chargement...</p>
                ) : (
                  <div className="space-y-2">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-secondary/50 transition-colors cursor-pointer group"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {doc.title}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {doc.file_name?.split('.').pop()?.toUpperCase() || 'PDF'} · {formatFileSize(doc.file_size)} · Ajouté le {formatDate(doc.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon-sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon-sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredDocuments.length === 0 && (
                      <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                        <p className="text-muted-foreground">Aucun document trouvé</p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
