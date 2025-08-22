import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { TrendingUp, TrendingDown, ExternalLink, FileText, Edit, Trash2, Filter, CheckCircle, XCircle, Target } from 'lucide-react';

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
import EditTradeModal from './EditTradeModal';

interface TradeListProps {
  accountId: string;
  trades: Trade[];
  isLoading: boolean;
  onEditTrade?: (trade: Trade) => void;
  onDeleteTrade?: (trade: Trade) => void;
}

type FilterType = 'all' | 'TP' | 'SL' | 'ENTRY';

export default function TradeList({ accountId, trades, isLoading, onEditTrade, onDeleteTrade }: TradeListProps) {
  const [visibleTrades, setVisibleTrades] = useState(10);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [editingTrade, setEditingTrade] = useState<Trade | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const loadMoreTrades = () => {
    setVisibleTrades(prev => prev + 10);
  };

  // Filtreleme fonksiyonu
  const filteredTrades = useMemo(() => {
    if (activeFilter === 'all') {
      return trades;
    }
    return trades.filter(trade => trade.trade_type === activeFilter);
  }, [trades, activeFilter]);

  const getTradeSideColor = (side: 'LONG' | 'SHORT') => {
    return side === 'LONG' ? 'text-green-500' : 'text-blue-500';
  };

  const getTradeSideBgColor = (side: 'LONG' | 'SHORT') => {
    return side === 'LONG' ? 'bg-green-500/20 border-green-500/30' : 'bg-blue-500/20 border-blue-500/30';
  };

  const getPnLColor = (pnl: number) => {
    return pnl >= 0 ? 'text-green-500' : 'text-red-500';
  };

  const getPnLBgColor = (pnl: number) => {
    return pnl >= 0 ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30';
  };

  const getTradeTypeColor = (tradeType: 'ENTRY' | 'TP' | 'SL') => {
    switch (tradeType) {
      case 'TP':
        return 'text-green-600 bg-green-500/20 border-green-500/30';
      case 'SL':
        return 'text-red-600 bg-red-500/20 border-red-500/30';
      case 'ENTRY':
      default:
        return 'text-yellow-600 bg-yellow-500/20 border-yellow-500/30';
    }
  };

  const handleTradeClick = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  const handleEdit = () => {
    if (selectedTrade) {
      setEditingTrade(selectedTrade);
      setIsEditModalOpen(true);
      setSelectedTrade(null);
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingTrade(null);
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
          <CardTitle className="text-white text-xl font-bold">İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-lg border border-white/20 bg-white/5">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 bg-white/20" />
                <Skeleton className="h-3 w-32 bg-white/20" />
              </div>
              <div className="space-y-2 text-right">
                <Skeleton className="h-4 w-16 bg-white/20" />
                <Skeleton className="h-3 w-12 bg-white/20" />
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
          <CardTitle className="text-white text-xl font-bold">İşlem Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12">
          <FileText className="h-16 w-16 text-white/60 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-white">
            Henüz İşlem Yok
          </h3>
          <p className="text-white/70">
            İlk işleminizi eklemek için "İşlem Ekle" butonunu kullanın
          </p>
        </CardContent>
      </Card>
    );
  }

  const displayedTrades = filteredTrades.slice(0, visibleTrades);
  const hasMoreTrades = filteredTrades.length > visibleTrades;

  // İstatistikler
  const stats = {
    all: trades.length,
    TP: trades.filter(t => t.trade_type === 'TP').length,
    SL: trades.filter(t => t.trade_type === 'SL').length,
    ENTRY: trades.filter(t => t.trade_type === 'ENTRY').length,
  };

  return (
    <>
      <Card className="gradient-card shadow-trading">
        <CardHeader>
          <div className="flex flex-col gap-4">
            <CardTitle className="text-white text-xl font-bold">
              İşlem Geçmişi ({filteredTrades.length}/{trades.length})
            </CardTitle>
            
                         {/* Filtre Butonları */}
             <div className="flex flex-wrap gap-2">
               <Button
                 variant={activeFilter === 'all' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setActiveFilter('all')}
                 className={`${
                   activeFilter === 'all' 
                     ? 'bg-blue-600 text-white hover:bg-blue-700 border-blue-500' 
                     : 'border-blue-500/50 text-blue-300 hover:bg-blue-500/20'
                 } transition-all duration-200 font-semibold`}
               >
                 <Filter className="h-4 w-4 mr-2" />
                 Tümü ({stats.all})
               </Button>
               
               <Button
                 variant={activeFilter === 'TP' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setActiveFilter('TP')}
                 className={`${
                   activeFilter === 'TP' 
                     ? 'bg-green-600 text-white hover:bg-green-700 border-green-500' 
                     : 'border-green-500/50 text-green-300 hover:bg-green-500/20'
                 } transition-all duration-200 font-semibold`}
               >
                 <CheckCircle className="h-4 w-4 mr-2" />
                 TP ({stats.TP})
               </Button>
               
               <Button
                 variant={activeFilter === 'SL' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setActiveFilter('SL')}
                 className={`${
                   activeFilter === 'SL' 
                     ? 'bg-red-600 text-white hover:bg-red-700 border-red-500' 
                     : 'border-red-500/50 text-red-300 hover:bg-red-500/20'
                 } transition-all duration-200 font-semibold`}
               >
                 <XCircle className="h-4 w-4 mr-2" />
                 SL ({stats.SL})
               </Button>
               
               <Button
                 variant={activeFilter === 'ENTRY' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setActiveFilter('ENTRY')}
                 className={`${
                   activeFilter === 'ENTRY' 
                     ? 'bg-yellow-600 text-white hover:bg-yellow-700 border-yellow-500' 
                     : 'border-yellow-500/50 text-yellow-300 hover:bg-yellow-500/20'
                 } transition-all duration-200 font-semibold`}
               >
                 <Target className="h-4 w-4 mr-2" />
                 ENTRY ({stats.ENTRY})
               </Button>
             </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {displayedTrades.map((trade, index) => (
            <motion.div
              key={trade.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30 transition-all duration-200 cursor-pointer"
              onClick={() => handleTradeClick(trade)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                {/* Sol taraf - İşlem bilgileri */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-white border-white/30 bg-white/10">
                      {trade.symbol}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`${getTradeSideBgColor(trade.side)} ${getTradeSideColor(trade.side)} font-semibold`}
                    >
                      {trade.side}
                    </Badge>
                    <Badge 
                      variant="outline"
                      className={`${getTradeTypeColor(trade.trade_type)} font-semibold`}
                    >
                      {trade.trade_type}
                    </Badge>
                  </div>
                  
                  <div className="hidden sm:block text-sm text-white/80 font-medium">
                    <span className="font-mono">{trade.entry_price}</span>
                    <span className="mx-2">→</span>
                    <span className="font-mono">{trade.exit_price}</span>
                    {trade.position_size && (
                      <span className="ml-2 text-white/70">({trade.position_size} lot)</span>
                    )}
                  </div>
                </div>

                {/* Sağ taraf - P&L ve tarih */}
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
                    <div className="text-sm text-white/70 font-medium">
                      {trade.pnl_pct && `${formatPercentage(trade.pnl_pct)} • `}Risk: {formatPercentage(trade.risk_used_pct)}
                    </div>
                  </div>

                  <div className="text-right text-sm text-white/70 font-medium">
                    <div>
                      {format(new Date(trade.closed_at), 'dd MMM yyyy', { locale: tr })}
                    </div>
                    <div className="font-mono">
                      {format(new Date(trade.closed_at), 'HH:mm')}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobil için fiyat bilgileri */}
              <div className="sm:hidden mt-3 text-sm text-white/80 font-medium">
                <span className="font-mono">{trade.entry_price}</span>
                <span className="mx-2">→</span>
                <span className="font-mono">{trade.exit_price}</span>
                {trade.position_size && (
                  <span className="ml-2 text-white/70">({trade.position_size} lot)</span>
                )}
              </div>

              {/* Not ve screenshot */}
              {(trade.note || trade.screenshot_url) && (
                <div className="mt-3 pt-3 border-t border-white/20">
                  {trade.note && (
                    <p className="text-sm text-white/80 mb-2 italic">
                      "{trade.note}"
                    </p>
                  )}
                  {trade.screenshot_url && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="h-auto p-0 text-blue-400 hover:text-blue-300"
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

          {displayedTrades.length === 0 && activeFilter !== 'all' && (
            <div className="text-center py-12">
              <Filter className="h-16 w-16 text-white/60 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2 text-white">
                {activeFilter} İşlemi Bulunamadı
              </h3>
              <p className="text-white/70 mb-4">
                Bu tipte henüz işlem bulunmuyor.
              </p>
              <Button
                variant="outline"
                onClick={() => setActiveFilter('all')}
                className="border-white/30 text-white hover:bg-white/10"
              >
                Tüm İşlemleri Göster
              </Button>
            </div>
          )}

          {hasMoreTrades && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={loadMoreTrades}
                className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10"
              >
                Daha Fazla Yükle ({filteredTrades.length - visibleTrades} kaldı)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* İşlem Detay Modal */}
      <Dialog open={!!selectedTrade} onOpenChange={(open) => !open && setSelectedTrade(null)}>
        <DialogContent className="sm:max-w-lg bg-gray-900 border-white/20">
          <DialogHeader>
            <DialogTitle className="text-white text-lg font-bold">İşlem Detayları</DialogTitle>
            <DialogDescription className="text-white/70">
              İşlem bilgilerini görüntüleyin ve düzenleyin
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedTrade && (
              <div className="p-6 rounded-lg border border-white/20 bg-gradient-to-br from-gray-800/50 to-gray-900/50 backdrop-blur-sm">
                <div className="flex items-center gap-2 mb-4">
                  <Badge variant="outline" className="font-mono text-white border-white/30 bg-white/10 px-3 py-1">
                    {selectedTrade.symbol}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`${getTradeSideBgColor(selectedTrade.side)} ${getTradeSideColor(selectedTrade.side)} font-semibold px-3 py-1`}
                  >
                    {selectedTrade.side}
                  </Badge>
                  <Badge 
                    variant="outline"
                    className={`${getTradeTypeColor(selectedTrade.trade_type)} font-semibold px-3 py-1`}
                  >
                    {selectedTrade.trade_type}
                  </Badge>
                </div>
                
                <div className="space-y-3 text-white/90">
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium">Giriş Fiyatı:</span>
                    <span className="font-mono font-bold text-white text-lg">{selectedTrade.entry_price}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium">Çıkış Fiyatı:</span>
                    <span className="font-mono font-bold text-white text-lg">{selectedTrade.exit_price}</span>
                  </div>
                  {selectedTrade.position_size && (
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="font-medium">Pozisyon Büyüklüğü:</span>
                      <span className="font-bold text-white text-lg">{selectedTrade.position_size} lot</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium">Risk Kullanımı:</span>
                    <span className="font-bold text-yellow-400 text-lg">{formatPercentage(selectedTrade.risk_used_pct)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-white/10">
                    <span className="font-medium">P&L:</span>
                    <span className={`font-bold text-lg ${getPnLColor(selectedTrade.pnl_amount)}`}>
                      {formatCurrency(selectedTrade.pnl_amount)}
                    </span>
                  </div>
                  {selectedTrade.pnl_pct && (
                    <div className="flex justify-between items-center py-2 border-b border-white/10">
                      <span className="font-medium">P&L %:</span>
                      <span className={`font-bold text-lg ${getPnLColor(selectedTrade.pnl_amount)}`}>
                        {formatPercentage(selectedTrade.pnl_pct)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2">
                    <span className="font-medium">Tarih:</span>
                    <span className="font-medium text-white">
                      {format(new Date(selectedTrade.closed_at), 'dd MMMM yyyy, HH:mm', { locale: tr })}
                    </span>
                  </div>
                </div>

                {selectedTrade.note && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <div className="text-sm text-white/70 mb-2 font-medium">Not:</div>
                    <p className="text-white italic bg-white/5 p-3 rounded-lg border border-white/10">"{selectedTrade.note}"</p>
                  </div>
                )}

                {selectedTrade.screenshot_url && (
                  <div className="mt-4 pt-4 border-t border-white/20">
                    <Button
                      variant="outline"
                      asChild
                      className="w-full border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300 transition-colors"
                    >
                      <a 
                        href={selectedTrade.screenshot_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 py-3"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Chart'ı Yeni Sekmede Aç
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setSelectedTrade(null)}
                className="flex-1 border-gray-500/50 text-gray-700 hover:bg-gray-700/50 hover:text-white hover:border-gray-400/50 transition-all duration-200 font-medium"
              >
                Kapat
              </Button>
              <Button
                variant="default"
                onClick={handleEdit}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors"
              >
                <Edit className="h-4 w-4 mr-2" />
                Düzenle
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Sil
              </Button>
            </div>
          </div>
        </DialogContent>
             </Dialog>

       {/* İşlem Düzenleme Modal */}
       <EditTradeModal
         trade={editingTrade}
         isOpen={isEditModalOpen}
         onClose={handleEditModalClose}
       />
     </>
   );
 }