import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { tr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModalStore } from '@/store/ui-store';
import { tradeRepository } from '@/lib/repo/localStorage';
import { formatCurrency } from '@/lib/domain/risk';
import { DailyTradeData } from '@/lib/domain/types';

interface CalendarModalProps {
  accountId: string;
}

export default function CalendarModal({ accountId }: CalendarModalProps) {
  const { isCalendarOpen, selectedAccountId, setCalendarOpen } = useModalStore();
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const isOpen = isCalendarOpen && selectedAccountId === accountId;

  // Fetch trades for the current month
  const { data: monthlyTrades = [] } = useQuery({
    queryKey: ['trades-calendar', accountId, format(currentMonth, 'yyyy-MM')],
    queryFn: () => {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      return tradeRepository.getTradesByDateRange(
        accountId,
        start.toISOString(),
        end.toISOString()
      );
    },
    enabled: isOpen,
  });

  // Process trades into daily data
  const dailyData: Record<string, DailyTradeData> = {};
  
  monthlyTrades.forEach(trade => {
    const dateKey = format(new Date(trade.closed_at), 'yyyy-MM-dd');
    
    if (!dailyData[dateKey]) {
      dailyData[dateKey] = {
        date: dateKey,
        trade_count: 0,
        net_pnl: 0,
      };
    }
    
    dailyData[dateKey].trade_count += 1;
    dailyData[dateKey].net_pnl += trade.pnl_amount;
  });

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const getDayData = (day: Date): DailyTradeData | null => {
    const dateKey = format(day, 'yyyy-MM-dd');
    return dailyData[dateKey] || null;
  };

  const getDayClasses = (day: Date) => {
    const isCurrentMonth = isSameDay(startOfMonth(day), monthStart) || 
                           (day >= monthStart && day <= monthEnd);
    const dayData = getDayData(day);
    
    let classes = "min-h-[80px] p-2 rounded-lg border transition-smooth cursor-pointer ";
    
    if (!isCurrentMonth) {
      classes += "text-muted-foreground bg-muted/30 ";
    } else {
      classes += "hover:border-border ";
      
      if (dayData) {
        if (dayData.net_pnl > 0) {
          classes += "border-profit/30 bg-profit/5 hover:bg-profit/10 ";
        } else if (dayData.net_pnl < 0) {
          classes += "border-loss/30 bg-loss/5 hover:bg-loss/10 ";
        } else {
          classes += "border-muted bg-muted/20 ";
        }
      } else {
        classes += "border-border/30 hover:bg-accent/50 ";
      }
    }
    
    return classes;
  };

  const weekDays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setCalendarOpen(false)}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            İşlem Takvimi
          </DialogTitle>
          <DialogDescription>
            Aylık işlem geçmişinizi ve performansınızı görüntüleyin
          </DialogDescription>
        </DialogHeader>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: tr })}
            </h3>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('prev')}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigateMonth('next')}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="space-y-2">
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-sm font-medium text-muted-foreground p-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map(day => {
                const dayData = getDayData(day);
                const isCurrentMonth = day >= monthStart && day <= monthEnd;
                
                return (
                  <div
                    key={day.toString()}
                    className={getDayClasses(day)}
                  >
                    <div className="text-sm font-medium mb-1">
                      {format(day, 'd')}
                    </div>
                    
                    {dayData && isCurrentMonth && (
                      <div className="space-y-1">
                        <Badge 
                          variant="outline" 
                          className="text-xs px-1 py-0"
                        >
                          {dayData.trade_count} işlem
                        </Badge>
                        <div className={`text-xs font-medium ${
                          dayData.net_pnl >= 0 ? 'profit-text' : 'loss-text'
                        }`}>
                          {formatCurrency(dayData.net_pnl)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border/30">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Object.values(dailyData).reduce((sum, day) => sum + day.trade_count, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Toplam İşlem</div>
            </div>
            
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                Object.values(dailyData).reduce((sum, day) => sum + day.net_pnl, 0) >= 0 
                  ? 'profit-text' : 'loss-text'
              }`}>
                {formatCurrency(Object.values(dailyData).reduce((sum, day) => sum + day.net_pnl, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Net P&L</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold">
                {Object.keys(dailyData).length}
              </div>
              <div className="text-sm text-muted-foreground">Aktif Gün</div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setCalendarOpen(false)}
            >
              Kapat
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}