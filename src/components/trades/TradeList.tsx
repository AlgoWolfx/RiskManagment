import { useState } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, ExternalLink, FileText, Edit, Trash2 } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Trade } from '@/lib/domain/types';
import { formatCurrency, formatPercentage } from '@/lib/domain/risk';

interface TradeListProps {
  accountId: string;
  trades: Trade[];
  isLoading: boolean;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (trade: Trade) => void;
}

export default function TradeList({ accountId, trades, isLoading, onEditTrade, onDeleteTrade }: TradeListProps) {
  const [visibleTrades, setVisibleTrades] = useState(10);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const loadMoreTrades = () => {
    setVisibleTrades(prev => prev + 10);
  };

  const getTradeSideColor = (side: 'LONG' | 'SHORT') => {
    return side === 'LONG' ? 'text-profit' : 'text-info';
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'profit-text' : 'loss-text';
  };

  const getTradeTypeColor = (tradeType: 'ENTRY' | 'TP' | 'SL') => {
    switch (tradeType) {
      case 'TP':
        return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'SL':
        return 'text-red-500 bg-red-500/10 border-red-500/20';
      case 'ENTRY':
      default:
        return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    }
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  const handleEdit = () => {
    if (selectedTrade && onEditTrade) {
      onEditTrade(selectedTrade);
    }
    setSelectedTrade(null);
  };

  const handleDelete = () => {
    if (selectedTrade && onDeleteTrade) {
      onDeleteTrade(selectedTrade);
    }
    setSelectedTrade(null);
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
    <>
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
              className="p-4 rounded-lg border border-border/50 hover:border-border transition-smooth gradient-card cursor-pointer hover:bg-accent/50"
              onClick={() => handleTradeClick(trade)}
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
                    <Badge 
                      variant="outline"
                      className={getTradeTypeColor(trade.trade_type)}
                    >
                      {trade.trade_type}
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
                      onClick={(e) => e.stopPropagation()}
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

      {/* Trade Action Modal */}
      <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İşlem İşlemleri</DialogTitle>
            <DialogDescription>
              Bu işlem için ne yapmak istiyorsunuz?
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTrade && (
              <div className="p-4 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="outline" className="font-mono">
                    {selectedTrade.symbol}
                  </Badge>
                  <Badge 
                    variant={selectedTrade.side === 'LONG' ? 'default' : 'secondary'}
                    className={getTradeSideColor(selectedTrade.side)}
                  >
                    {selectedTrade.side}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={getTradeTypeColor(selectedTrade.trade_type)}
                  >
                    {selectedTrade.trade_type}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {selectedTrade.entry_price} → {selectedTrade.exit_price}
                  {selectedTrade.position_size && (
                    <span className="ml-2">({selectedTrade.position_size} lot)</span>
                  )}
                </div>
                <div className={`text-lg font-bold mt-2 ${getPnLColor(selectedTrade.pnl_amount)}`}>
                  {formatCurrency(selectedTrade.pnl_amount)}
                </div>
              </div>
            )}
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTrade(null)}
                className="flex-1"
              >
                İptal
              </Button>
              <Button
                variant="default"
                onClick={handleEdit}
                className="flex-1"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}