import { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Bug, Lightbulb } from 'lucide-react';
import html2canvas from 'html2canvas';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { getDeviceInfo } from '@/hooks/useAppEnvironment';

interface BugReportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function BugReportModal({ open, onOpenChange }: BugReportModalProps) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [type, setType] = useState<'bug' | 'suggestion'>('bug');
  const [description, setDescription] = useState('');
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCaptureScreenshot = async () => {
    setIsCapturing(true);
    
    // Temporarily hide the modal
    onOpenChange(false);
    
    // Wait for modal to close
    await new Promise(resolve => setTimeout(resolve, 300));
    
    try {
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: true,
        scale: 1,
        logging: false,
      });
      
      const dataUrl = canvas.toDataURL('image/png');
      setScreenshot(dataUrl);
      
      // Reopen the modal
      onOpenChange(true);
      
      toast({
        title: "Capture réussie",
        description: "L'écran a été capturé avec succès.",
      });
    } catch (error) {
      console.error('Screenshot error:', error);
      onOpenChange(true);
      toast({
        title: "Erreur",
        description: "Impossible de capturer l'écran.",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setUploadedFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadToStorage = async (file: File | Blob, filename: string): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from('residence-documents')
      .upload(`bug-reports/${Date.now()}-${filename}`, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return null;
    }

    const { data: urlData } = supabase.storage
      .from('residence-documents')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      toast({
        title: "Description requise",
        description: "Veuillez décrire le problème ou votre suggestion.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const deviceInfo = getDeviceInfo();
      
      // Upload screenshot if exists
      let screenshotUrl: string | null = null;
      if (screenshot) {
        const blob = await fetch(screenshot).then(r => r.blob());
        screenshotUrl = await uploadToStorage(blob, 'screenshot.png');
      }

      // Upload additional files
      const attachments: string[] = [];
      for (const file of uploadedFiles) {
        const url = await uploadToStorage(file, file.name);
        if (url) attachments.push(url);
      }

      // Get user's role
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user?.id)
        .limit(1)
        .single();

      // Insert bug report
      const { error } = await supabase.from('bug_reports').insert({
        user_id: user?.id,
        type,
        description: description.trim(),
        current_url: window.location.href,
        screen_name: document.title,
        user_agent: deviceInfo.userAgent,
        device_model: deviceInfo.deviceModel,
        os_version: deviceInfo.osVersion,
        app_version: deviceInfo.appVersion,
        account_type: roleData?.role || 'unknown',
        screenshot_url: screenshotUrl,
        attachments: attachments.length > 0 ? attachments : [],
      });

      if (error) throw error;

      toast({
        title: "Merci !",
        description: type === 'bug' 
          ? "Votre signalement a été envoyé. Notre équipe va l'examiner."
          : "Votre suggestion a été envoyée. Merci de nous aider à améliorer Kopro !",
      });

      // Reset form
      setType('bug');
      setDescription('');
      setScreenshot(null);
      setUploadedFiles([]);
      onOpenChange(false);

    } catch (error) {
      console.error('Submit error:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le signalement. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5 text-amber-500" />
            Signaler un problème
          </DialogTitle>
          <DialogDescription>
            Version Bêta : Aidez-nous à améliorer Kopro en signalant les bugs ou en partageant vos suggestions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Type selection */}
          <div className="space-y-2">
            <Label>Type de signalement</Label>
            <RadioGroup
              value={type}
              onValueChange={(v) => setType(v as 'bug' | 'suggestion')}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bug" id="bug" />
                <Label htmlFor="bug" className="flex items-center gap-1 cursor-pointer">
                  <Bug className="h-4 w-4 text-red-500" />
                  Bug
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="suggestion" id="suggestion" />
                <Label htmlFor="suggestion" className="flex items-center gap-1 cursor-pointer">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  Suggestion
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {type === 'bug' ? 'Décrivez le problème rencontré' : 'Décrivez votre suggestion'}
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'bug' 
                ? "Qu'avez-vous essayé de faire ? Que s'est-il passé ?"
                : "Quelle fonctionnalité aimeriez-vous voir ?"
              }
              rows={4}
            />
          </div>

          {/* Screenshot */}
          <div className="space-y-2">
            <Label>Capture d'écran</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleCaptureScreenshot}
                disabled={isCapturing}
                className="flex-1"
              >
                {isCapturing ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4 mr-2" />
                )}
                Capturer l'écran
              </Button>
            </div>
            
            {screenshot && (
              <div className="relative mt-2">
                <img 
                  src={screenshot} 
                  alt="Screenshot" 
                  className="w-full rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={() => setScreenshot(null)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* File upload */}
          <div className="space-y-2">
            <Label>Fichiers supplémentaires (optionnel)</Label>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="h-4 w-4 mr-2" />
              Ajouter des fichiers
            </Button>
            
            {uploadedFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                {uploadedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <span className="text-sm truncate">{file.name}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !description.trim()}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Envoi en cours...
              </>
            ) : (
              'Envoyer le signalement'
            )}
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            Les informations techniques (navigateur, appareil) seront automatiquement incluses pour nous aider à résoudre le problème.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
