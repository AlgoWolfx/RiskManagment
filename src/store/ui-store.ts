// UI state management with Zustand

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MinimumRiskDialogState {
  dismissed_at?: string;
  setDismissed: (timestamp: string) => void;
  shouldShow: (riskPct: number) => boolean;
}

interface ModalState {
  isAddAccountOpen: boolean;
  isAddTradeOpen: boolean;
  isCalendarOpen: boolean;
  selectedAccountId?: string;
  
  setAddAccountOpen: (open: boolean) => void;
  setAddTradeOpen: (open: boolean, accountId?: string) => void;
  setCalendarOpen: (open: boolean, accountId?: string) => void;
}

// Minimum risk dialog store
export const useMinimumRiskDialog = create<MinimumRiskDialogState>()(
  persist(
    (set, get) => ({
      dismissed_at: undefined,
      
      setDismissed: (timestamp: string) => {
        set({ dismissed_at: timestamp });
      },
      
      shouldShow: (riskPct: number) => {
        if (riskPct !== 0.25) return false;
        
        const { dismissed_at } = get();
        if (!dismissed_at) return true;
        
        // Don't show again for 24 hours after dismissal
        const dismissedTime = new Date(dismissed_at).getTime();
        const now = new Date().getTime();
        const hoursElapsed = (now - dismissedTime) / (1000 * 60 * 60);
        
        return hoursElapsed >= 24;
      },
    }),
    {
      name: 'minimum-risk-dialog',
    }
  )
);

// Modal state store
export const useModalStore = create<ModalState>((set) => ({
  isAddAccountOpen: false,
  isAddTradeOpen: false,
  isCalendarOpen: false,
  selectedAccountId: undefined,
  
  setAddAccountOpen: (open: boolean) => {
    set({ isAddAccountOpen: open });
  },
  
  setAddTradeOpen: (open: boolean, accountId?: string) => {
    set({ 
      isAddTradeOpen: open, 
      selectedAccountId: open ? accountId : undefined 
    });
  },
  
  setCalendarOpen: (open: boolean, accountId?: string) => {
    set({ 
      isCalendarOpen: open, 
      selectedAccountId: open ? accountId : undefined 
    });
  },
}));