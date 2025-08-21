import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

interface MinimumRiskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContinue: () => void;
  onRemindLater: () => void;
}

export default function MinimumRiskDialog({
  open,
  onOpenChange,
  onContinue,
  onRemindLater,
}: MinimumRiskDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-warning" />
            Risk %0,25
          </AlertDialogTitle>
          <AlertDialogDescription>
            Stratejini gözden geçir. Devam etmek istiyor musun?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onRemindLater}>
            Sonra Hatırlat
          </AlertDialogCancel>
          <AlertDialogAction onClick={onContinue}>
            Evet
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}