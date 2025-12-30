import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Mail, Send, FileText, Receipt, TrendingUp, Copy, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useSendEmail } from "@/hooks/useSendEmail";

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  type: string;
  variables: string[];
}

interface TenantInfo {
  name: string;
  email: string;
  lot_number?: string;
  rent_amount?: number;
  charges_amount?: number;
}

interface EmailTemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateType: "document_reminder" | "rent_receipt" | "rent_revision";
  tenant: TenantInfo;
  residenceId: string;
  onSend?: (subject: string, body: string) => void;
}

const TEMPLATE_ICONS = {
  document_reminder: FileText,
  rent_receipt: Receipt,
  rent_revision: TrendingUp,
};

const TEMPLATE_TITLES = {
  document_reminder: "Demande de document",
  rent_receipt: "Quittance de loyer",
  rent_revision: "Révision de loyer",
};

export function EmailTemplateEditor({
  open,
  onOpenChange,
  templateType,
  tenant,
  residenceId,
  onSend,
}: EmailTemplateEditorProps) {
  const { sendEmail, isSending } = useSendEmail();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [loading, setLoading] = useState(false);

  // For rent revision
  const [newRent, setNewRent] = useState("");
  const [percentage, setPercentage] = useState("");

  // For rent receipt
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");

  useEffect(() => {
    if (open) {
      fetchTemplates();
    }
  }, [open, templateType]);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .or(`residence_id.eq.${residenceId},residence_id.is.null`)
        .eq("type", templateType);

      if (error) throw error;

      const parsedTemplates = (data || []).map(t => ({
        ...t,
        variables: Array.isArray(t.variables) ? t.variables : JSON.parse(t.variables as string || "[]"),
      }));

      setTemplates(parsedTemplates);
      
      if (parsedTemplates.length > 0) {
        selectTemplate(parsedTemplates[0]);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setSubject(template.subject);
    setBody(template.body);
  };

  const replaceVariables = (text: string): string => {
    let result = text;
    
    result = result.replace(/{tenant_name}/g, tenant.name);
    result = result.replace(/{document_type}/g, documentType);
    result = result.replace(/{manager_name}/g, "L'équipe de gestion");
    result = result.replace(/{residence_name}/g, "");
    
    // Rent receipt variables
    result = result.replace(/{period_start}/g, periodStart);
    result = result.replace(/{period_end}/g, periodEnd);
    result = result.replace(/{period}/g, `${periodStart} - ${periodEnd}`);
    result = result.replace(/{rent_amount}/g, (tenant.rent_amount || 0).toString());
    result = result.replace(/{charges_amount}/g, (tenant.charges_amount || 0).toString());
    result = result.replace(/{total_amount}/g, ((tenant.rent_amount || 0) + (tenant.charges_amount || 0)).toString());
    result = result.replace(/{bank_info}/g, "[Informations bancaires]");

    // Rent revision variables
    result = result.replace(/{old_rent}/g, (tenant.rent_amount || 0).toString());
    result = result.replace(/{new_rent}/g, newRent);
    result = result.replace(/{new_total}/g, (parseFloat(newRent || "0") + (tenant.charges_amount || 0)).toString());
    result = result.replace(/{percentage}/g, percentage);
    result = result.replace(/{effective_date}/g, "");

    return result;
  };

  const handleSend = async () => {
    if (!tenant.email) {
      toast.error("Le locataire n'a pas d'adresse email");
      return;
    }

    const finalSubject = replaceVariables(subject);
    const finalBody = replaceVariables(body);

    const success = await sendEmail({
      to: tenant.email,
      subject: finalSubject,
      body: finalBody,
      templateId: selectedTemplate?.id,
      variables: {
        tenant_name: tenant.name,
        document_type: documentType,
        period_start: periodStart,
        period_end: periodEnd,
        rent_amount: String(tenant.rent_amount || 0),
        charges_amount: String(tenant.charges_amount || 0),
        new_rent: newRent,
        percentage,
      },
    });

    if (success) {
      if (onSend) {
        onSend(finalSubject, finalBody);
      }
      onOpenChange(false);
    }
  };

  const copyToClipboard = () => {
    const finalBody = replaceVariables(body);
    navigator.clipboard.writeText(finalBody);
    toast.success("Copié dans le presse-papier");
  };

  const Icon = TEMPLATE_ICONS[templateType];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {TEMPLATE_TITLES[templateType]}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          {templates.length > 1 && (
            <div className="space-y-2">
              <Label>Modèle</Label>
              <Select
                value={selectedTemplate?.id}
                onValueChange={(id) => {
                  const t = templates.find(t => t.id === id);
                  if (t) selectTemplate(t);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un modèle" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Document Type for reminders */}
          {templateType === "document_reminder" && (
            <div className="space-y-2">
              <Label>Type de document demandé</Label>
              <Select value={documentType} onValueChange={setDocumentType}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner le document" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Assurance habitation">Assurance habitation</SelectItem>
                  <SelectItem value="Pièce d'identité">Pièce d'identité</SelectItem>
                  <SelectItem value="Justificatif de domicile">Justificatif de domicile</SelectItem>
                  <SelectItem value="Attestation employeur">Attestation employeur</SelectItem>
                  <SelectItem value="Bulletins de salaire">Bulletins de salaire</SelectItem>
                  <SelectItem value="Avis d'imposition">Avis d'imposition</SelectItem>
                  <SelectItem value="RIB">RIB</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Rent Receipt Fields */}
          {templateType === "rent_receipt" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Début de période</Label>
                <Input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Fin de période</Label>
                <Input
                  type="date"
                  value={periodEnd}
                  onChange={(e) => setPeriodEnd(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Rent Revision Fields */}
          {templateType === "rent_revision" && (
            <Card className="bg-muted/50">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nouveau loyer (€)</Label>
                    <Input
                      type="number"
                      value={newRent}
                      onChange={(e) => {
                        setNewRent(e.target.value);
                        if (tenant.rent_amount && parseFloat(e.target.value) > 0) {
                          const pct = ((parseFloat(e.target.value) - tenant.rent_amount) / tenant.rent_amount * 100).toFixed(2);
                          setPercentage(pct);
                        }
                      }}
                      placeholder="Nouveau montant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Pourcentage d'augmentation</Label>
                    <Input
                      type="number"
                      value={percentage}
                      onChange={(e) => {
                        setPercentage(e.target.value);
                        if (tenant.rent_amount && parseFloat(e.target.value) >= 0) {
                          const newAmount = (tenant.rent_amount * (1 + parseFloat(e.target.value) / 100)).toFixed(2);
                          setNewRent(newAmount);
                        }
                      }}
                      placeholder="%"
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                  <span className="text-sm text-muted-foreground">Aperçu du nouveau total</span>
                  <span className="font-semibold text-lg">
                    {(parseFloat(newRent || "0") + (tenant.charges_amount || 0)).toFixed(2)} €
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recipient */}
          <div className="space-y-2">
            <Label>Destinataire</Label>
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{tenant.name}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">{tenant.email || "Pas d'email"}</span>
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label>Objet</Label>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Objet du mail"
            />
          </div>

          {/* Body */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Contenu</Label>
              <div className="flex gap-1">
                {selectedTemplate?.variables.map((v) => (
                  <Badge key={v} variant="outline" className="text-xs">
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
          </div>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Aperçu</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-background rounded-lg border text-sm whitespace-pre-wrap">
                {replaceVariables(body)}
              </div>
            </CardContent>
          </Card>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={copyToClipboard}>
            <Copy className="h-4 w-4 mr-2" />
            Copier
          </Button>
          <Button onClick={handleSend} disabled={isSending || !tenant.email}>
            {isSending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Send className="h-4 w-4 mr-2" />
            {isSending ? "Envoi..." : "Envoyer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
