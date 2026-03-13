import { create } from 'zustand';

interface AppState {
  theme: 'dark' | 'light';
  sidebarCollapsed: boolean;
  insightsPanelOpen: boolean;
  selectedYear: number;
  toggleTheme: () => void;
  toggleSidebar: () => void;
  toggleInsights: () => void;
  setYear: (year: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
  theme: 'dark',
  sidebarCollapsed: false,
  insightsPanelOpen: false,
  selectedYear: 2024,
  toggleTheme: () =>
    set((s) => {
      const next = s.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.classList.toggle('light', next === 'light');
      return { theme: next };
    }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleInsights: () => set((s) => ({ insightsPanelOpen: !s.insightsPanelOpen })),
  setYear: (year) => set({ selectedYear: year }),
}));
