// aj-client/src/stores/sidebar-store.ts
import { create } from 'zustand';

interface SidebarState {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggle: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // Varsayılan durum: Masaüstünde açık, mobilde kapalı olarak ayarlanacak (Initializer ile)
  isOpen: false, 
  
  setIsOpen: (isOpen) => set({ isOpen }),
  
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));