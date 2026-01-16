import { useState } from 'react';
import { Bug, MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { BugReportModal } from './BugReportModal';
import { useAuth } from '@/hooks/useAuth';

export function BugReportButton() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  // Don't show if not logged in
  if (!user) return null;

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-[9999] rounded-full shadow-lg h-12 w-12 p-0 bg-amber-500 hover:bg-amber-600 text-white"
        title="Signaler un problème"
      >
        <Bug className="h-5 w-5" />
      </Button>

      <BugReportModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
