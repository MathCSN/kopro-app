import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  Filter,
  Download,
  Eye,
  FolderOpen,
  File,
  Clock,
  ChevronRight,
  Upload,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { AppLayout } from "@/components/layout/AppLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Document {
  id: string;
  name: string;
  category: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  version: number;
}

const categories = [
  { id: "pv", name: "Procès-verbaux AG", icon: FileText, count: 12 },
  { id: "reglement", name: "Règlement & Statuts", icon: FileText, count: 4 },
  { id: "contrats", name: "Contrats & Assurances", icon: File, count: 8 },
  { id: "travaux", name: "Travaux & Devis", icon: File, count: 15 },
  { id: "comptes", name: "Comptes & Budgets", icon: File, count: 6 },
  { id: "divers", name: "Documents divers", icon: FolderOpen, count: 23 },
];

const sampleDocuments: Document[] = [
  {
    id: "1",
    name: "PV AG Ordinaire 2024",
    category: "pv",
    type: "PDF",
    size: "2.4 MB",
    uploadedAt: "15 déc. 2024",
    uploadedBy: "Syndic Gestion Plus",
    version: 1,
  },
  {
    id: "2",
    name: "Règlement intérieur 2024",
    category: "reglement",
    type: "PDF",
    size: "1.2 MB",
    uploadedAt: "10 déc. 2024",
    uploadedBy: "Conseil Syndical",
    version: 3,
  },
  {
    id: "3",
    name: "Contrat assurance multirisques",
    category: "contrats",
    type: "PDF",
    size: "3.1 MB",
    uploadedAt: "1 jan. 2024",
    uploadedBy: "Syndic Gestion Plus",
    version: 1,
  },
  {
    id: "4",
    name: "Devis ravalement façade",
    category: "travaux",
    type: "PDF",
    size: "5.8 MB",
    uploadedAt: "20 nov. 2024",
    uploadedBy: "Syndic Gestion Plus",
    version: 2,
  },
  {
    id: "5",
    name: "Budget prévisionnel 2025",
    category: "comptes",
    type: "PDF",
    size: "890 KB",
    uploadedAt: "5 déc. 2024",
    uploadedBy: "Syndic Gestion Plus",
    version: 1,
  },
  {
    id: "6",
    name: "PV AG Extraordinaire Oct 2024",
    category: "pv",
    type: "PDF",
    size: "1.8 MB",
    uploadedAt: "25 oct. 2024",
    uploadedBy: "Syndic Gestion Plus",
    version: 1,
  },
];

export default function Documents() {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem("kopro_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("kopro_user");
    navigate("/auth");
  };

  const filteredDocuments = sampleDocuments.filter(doc => {
    const matchSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = !selectedCategory || doc.category === selectedCategory;
    return matchSearch && matchCategory;
  });

  const recentDocuments = [...sampleDocuments]
    .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())
    .slice(0, 5);

  if (!user) return null;

  const isManager = user.role === "manager" || user.role === "admin";

  return (
    <AppLayout userRole={user.role} onLogout={handleLogout}>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl font-bold text-foreground">Documents</h1>
            <p className="text-muted-foreground mt-1">Bibliothèque documentaire de la copropriété</p>
          </div>
          {isManager && (
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
              <Badge variant="secondary">{sampleDocuments.length}</Badge>
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
                <Badge variant="secondary">{category.count}</Badge>
              </Button>
            ))}
          </div>

          {/* Documents Grid */}
          <div className="lg:col-span-3 space-y-6">
            {/* Recent Documents */}
            {!selectedCategory && !searchQuery && (
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
                          {doc.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {doc.type} · {doc.size}
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
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {doc.name}
                          </h4>
                          {doc.version > 1 && (
                            <Badge variant="secondary" className="text-[10px] px-1.5">
                              v{doc.version}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {doc.type} · {doc.size} · Ajouté le {doc.uploadedAt}
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
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}