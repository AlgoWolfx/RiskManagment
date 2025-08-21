import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, ExternalLink, FileText } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Trade } from '@/lib/domain/types';
import { formatCurrency, formatPercentage } from '@/lib/domain/risk';

interface TradeListProps {
  accountId: string;
  trades: Trade[];
  isLoading: boolean;
}

export default function TradeList({ accountId, trades, isLoading }: TradeListProps) {
  const [visibleTrades, setVisibleTrades] = useState(10);

  const loadMoreTrades = () => {
    setVisibleTrades(prev => prev + 10);
  };

  const getTradeSideColor = (side: 'LONG' | 'SHORT') => {
    return side === 'LONG' ? 'text-profit' : 'text-info';
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'profit-text' : 'loss-text';
  };

  if (isLoading) {
    return (
      <Card className="gradient-card shadow-trading">
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-12" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (trades.length === 0) {
    return (
      <Card className="gradient-card shadow-trading">
        <CardHeader>
          <CardTitle>İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">
            Henüz İşlem Yok
          </h3>
          <p className="text-muted-foreground">
            İlk işleminizi eklemek için "İşlem Ekle" butonunu kullanın
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedTrades = trades.slice(0, visibleTrades);
  const hasMoreTrades = trades.length > visibleTrades;

  return (
    <Card className="gradient-card shadow-trading">
      <CardHeader>
        <CardTitle>İşlem Geçmişi ({trades.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {displayedTrades.map((trade, index) => (
          <motion.div
            key={trade.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-lg border border-border/50 hover:border-border transition-smooth gradient-card"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono">
                    {trade.symbol}
                  </Badge>
                  <Badge 
                    variant={trade.side === 'LONG' ? 'default' : 'secondary'}
                    className={getTradeSideColor(trade.side)}
                  >
                    {trade.side}
                  </Badge>
                </div>
                
                <div className="hidden sm:block text-sm text-muted-foreground">
                  {trade.entry_price} → {trade.exit_price}
                  {trade.position_size && (
                    <span className="ml-2">({trade.position_size} lot)</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-4">
                <div className="text-right">
                  <div className={`text-lg font-bold flex items-center gap-1 ${getPnLColor(trade.pnl_amount)}`}>
                    {trade.pnl_amount >= 0 ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    {formatCurrency(trade.pnl_amount)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {trade.pnl_pct && formatPercentage(trade.pnl_pct)} • Risk: {formatPercentage(trade.risk_used_pct)}
                  </div>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  <div>
                    {format(new Date(trade.closed_at), 'dd MMM yyyy', { locale: tr })}
                  </div>
                  <div>
                    {format(new Date(trade.closed_at), 'HH:mm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile layout for entry/exit prices */}
            <div className="sm:hidden mt-3 text-sm text-muted-foreground">
              {trade.entry_price} → {trade.exit_price}
              {trade.position_size && (
                <span className="ml-2">({trade.position_size} lot)</span>
              )}
            </div>

            {/* Note and screenshot */}
            {(trade.note || trade.screenshot_url) && (
              <div className="mt-3 pt-3 border-t border-border/30">
                {trade.note && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {trade.note}
                  </p>
                )}
                {trade.screenshot_url && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="h-auto p-0 text-primary hover:text-primary/80"
                  >
                    <a 
                      href={trade.screenshot_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Chart'ı Görüntüle
                    </a>
                  </Button>
                )}
              </div>
            )}
          </motion.div>
        ))}

        {hasMoreTrades && (
          <div className="text-center pt-4">
            <Button
              variant="outline"
              onClick={loadMoreTrades}
              className="w-full sm:w-auto"
            >
              Daha Fazla Yükle ({trades.length - visibleTrades} kaldı)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}