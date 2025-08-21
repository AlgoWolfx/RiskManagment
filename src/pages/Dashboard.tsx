import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, TrendingUp, LogOut, Database } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AccountCard from '@/components/accounts/AccountCard';
import AddAccountModal from '@/components/accounts/AddAccountModal';
import MinimumRiskDialog from '@/components/accounts/MinimumRiskDialog';
import DataMigration from '@/components/admin/DataMigration';
import { useModalStore } from '@/store/ui-store';
import { useMinimumRiskDialog } from '@/store/ui-store';
import { accountRepository, tradeRepository } from '@/lib/repo';
import { formatCurrency } from '@/lib/domain/risk';
import { useToast } from '@/hooks/use-toast';

export default function Dashboard() {
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [riskDialogAccountId, setRiskDialogAccountId] = useState<string | null>(null);
  const [showMigration, setShowMigration] = useState(false);
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { setAddAccountOpen } = useModalStore();
  const { shouldShow, setDismissed } = useMinimumRiskDialog();

  // Fetch accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountRepository.getAll(),
  });

  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: (accountId: string) => accountRepository.delete(accountId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['accounts'] });
      toast({
        title: 'Hesap silindi',
        description: 'Hesap başarıyla silindi.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Hata',
        description: error?.message || 'Hesap silinirken bir hata oluştu.',
        variant: 'destructive',
      });
    },
  });

  // Calculate dashboard metrics
  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const totalProfit = accounts.reduce((sum, account) => sum + (account.current_balance - account.starting_balance), 0);
  const fundedAccounts = accounts.filter(account => account.type === 'Funded').length;
  const prefundedAccounts = accounts.filter(account => account.type === 'PreFunded').length;

  // Check for minimum risk dialogs
  useEffect(() => {
    const accountsAtMinRisk = accounts.filter(account => 
      account.risk_current_pct === 0.25 && shouldShow(account.risk_current_pct)
    );
    
    if (accountsAtMinRisk.length > 0) {
      setRiskDialogAccountId(accountsAtMinRisk[0].id);
      setShowRiskDialog(true);
    }
  }, [accounts, shouldShow]);

  const handleRiskDialogContinue = () => {
    setShowRiskDialog(false);
    setRiskDialogAccountId(null);
  };

  const handleRiskDialogRemindLater = () => {
    setDismissed(new Date().toISOString());
    setShowRiskDialog(false);
    setRiskDialogAccountId(null);
  };

  const handleDeleteAccount = (accountId: string) => {
    if (window.confirm('Bu hesabı silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.')) {
      deleteAccountMutation.mutate(accountId);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (accountsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse-subtle">
          <TrendingUp className="h-12 w-12 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 gradient-card">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
        >
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Yönetimi Paneli</h1>
            <p className="text-white/80 font-medium">
              Trading hesaplarınızı yönetin ve risklerinizi takip edin
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="ghost"
              onClick={() => setShowMigration(!showMigration)}
              className="flex-1 sm:flex-none text-white/80 hover:bg-white/10"
              title="Veri Migration"
            >
              <Database className="h-4 w-4" />
              Migration
            </Button>
            <Button
              variant="trading-primary"
              onClick={() => setAddAccountOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              Hesap Ekle
            </Button>
            <Button
              variant="trading"
              onClick={handleLogout}
              className="flex-1 sm:flex-none text-white border-white/20 hover:bg-white/10"
            >
              <LogOut className="h-4 w-4" />
              Çıkış
            </Button>
          </div>
        </motion.div>

        {/* Data Migration Panel */}
        {showMigration && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <DataMigration />
          </motion.div>
        )}

        {/* Dashboard Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="gradient-card shadow-elevated border-border/30 hover:border-primary/30 transition-glow group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">
                Toplam Bakiye
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cosmic group-hover:animate-glow">
                {formatCurrency(totalBalance)}
              </div>
              <div className="text-sm text-profit mt-1 font-medium">💰 Portföy Değeri</div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-elevated border-border/30 hover:border-profit/30 transition-glow group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">
                Toplam Kâr
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold group-hover:animate-glow ${
                totalProfit > 0 ? 'text-profit' : totalProfit < 0 ? 'text-loss' : 'text-white'
              }`}>
                {formatCurrency(totalProfit)}
              </div>
              <div className="text-sm text-white/80 mt-1 font-medium">💰 Toplam Kazanç</div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-elevated border-border/30 hover:border-info/30 transition-glow group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-white">
                Hesap Durumu
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-info group-hover:animate-glow">
                {fundedAccounts + prefundedAccounts}
              </div>
              <div className="text-sm text-white/80 mt-1 font-medium">
                🚀 {fundedAccounts} Funded • {prefundedAccounts} PreFunded
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Accounts Grid */}
        {accounts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="text-center py-12 gradient-card shadow-elevated border-border/30">
              <CardContent>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                >
                  <TrendingUp className="h-20 w-20 text-primary mx-auto mb-6 animate-glow" />
                </motion.div>
                <h3 className="text-2xl font-bold mb-3 text-cosmic">
                  İlk Hesabınızı Oluşturun
                </h3>
                <p className="text-muted-foreground mb-8 text-lg">
                  Uzayın derinliklerinde trading maceranıza başlayın
                </p>
                <Button
                  variant="cosmic"
                  onClick={() => setAddAccountOpen(true)}
                  size="lg"
                  className="px-8"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Yolculuğa Başla 🚀
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"
          >
            {accounts.map((account, index) => (
              <motion.div
                key={account.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
              >
                <AccountCard 
                  account={account} 
                  trades={[]} 
                  onDelete={handleDeleteAccount}
                />
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Modals */}
        <AddAccountModal />

        {/* Minimum Risk Dialog */}
        <MinimumRiskDialog
          open={showRiskDialog}
          onOpenChange={setShowRiskDialog}
          onContinue={handleRiskDialogContinue}
          onRemindLater={handleRiskDialogRemindLater}
        />
      </div>
    </div>
  );
}