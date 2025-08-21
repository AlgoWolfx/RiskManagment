import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Plus, TrendingUp } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AccountCard from '@/components/accounts/AccountCard';
import AddAccountModal from '@/components/accounts/AddAccountModal';
import MinimumRiskDialog from '@/components/accounts/MinimumRiskDialog';
import { useModalStore } from '@/store/ui-store';
import { useMinimumRiskDialog } from '@/store/ui-store';
import { accountRepository, tradeRepository } from '@/lib/repo/localStorage';
import { formatCurrency } from '@/lib/domain/risk';

export default function Dashboard() {
  const [showRiskDialog, setShowRiskDialog] = useState(false);
  const [riskDialogAccountId, setRiskDialogAccountId] = useState<string | null>(null);
  
  const { setAddAccountOpen } = useModalStore();
  const { shouldShow, setDismissed } = useMinimumRiskDialog();

  // Fetch accounts
  const { data: accounts = [], isLoading: accountsLoading } = useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountRepository.getAll(),
  });

  // Calculate dashboard metrics
  const totalBalance = accounts.reduce((sum, account) => sum + account.current_balance, 0);
  const totalDailyRisk = accounts.reduce((sum, account) => {
    return sum + (account.current_balance * (account.risk_current_pct / 100));
  }, 0);
  const maxDailyLoss = accounts.reduce((sum, account) => {
    if (account.type === 'Funded' && account.daily_loss_limit) {
      return sum + account.daily_loss_limit;
    }
    return sum + (account.current_balance * 0.05); // 5% fallback
  }, 0);

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
            <h1 className="text-3xl font-bold">Risk Yönetimi Paneli</h1>
            <p className="text-muted-foreground">
              Trading hesaplarınızı yönetin ve risklerinizi takip edin
            </p>
          </div>
          
          <Button
            variant="trading-primary"
            onClick={() => setAddAccountOpen(true)}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            Hesap Ekle
          </Button>
        </motion.div>

        {/* Dashboard Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <Card className="gradient-card shadow-elevated border-border/30 hover:border-primary/30 transition-glow group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Toplam Bakiye
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cosmic group-hover:animate-glow">
                {formatCurrency(totalBalance)}
              </div>
              <div className="text-sm text-profit mt-1">💰 Portföy Değeri</div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-elevated border-border/30 hover:border-warning/30 transition-glow group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Günlük Risk Edilebilir Tutar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning group-hover:animate-glow">
                {formatCurrency(totalDailyRisk)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">⚡ Aktif Risk</div>
            </CardContent>
          </Card>

          <Card className="gradient-card shadow-elevated border-border/30 hover:border-loss/30 transition-glow group">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Maksimum Kayıp (Günlük)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-loss group-hover:animate-glow">
                {formatCurrency(maxDailyLoss)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">🛡️ Güvenlik Sınırı</div>
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
                <AccountCard account={account} trades={[]} />
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