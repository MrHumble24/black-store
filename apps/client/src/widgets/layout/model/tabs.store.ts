import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Tab {
  id: string;
  label: string;
  path: string;
  isActive: boolean;
}

interface TabsState {
  tabs: Tab[];
  activeTabId: string | null;
  addTab: (tab: Omit<Tab, "isActive">) => void;
  removeTab: (id: string) => void;
  setActiveTab: (id: string) => void;
  clearTabs: () => void;
}

export const useTabsStore = create<TabsState>()(
  persist(
    (set) => ({
      tabs: [],
      activeTabId: null,

      addTab: (newTab) =>
        set((state) => {
          const tabExists = state.tabs.find((t) => t.path === newTab.path);
          if (tabExists) {
            return { activeTabId: tabExists.id };
          }
          const updatedTabs = [...state.tabs, { ...newTab, isActive: true }];
          return {
            tabs: updatedTabs,
            activeTabId: newTab.id,
          };
        }),

      removeTab: (id) =>
        set((state) => {
          const tabIndex = state.tabs.findIndex((t) => t.id === id);
          const updatedTabs = state.tabs.filter((t) => t.id !== id);

          let nextActiveId = state.activeTabId;
          if (state.activeTabId === id) {
            if (updatedTabs.length > 0) {
              const nextIndex = Math.min(tabIndex, updatedTabs.length - 1);
              nextActiveId = updatedTabs[nextIndex].id;
            } else {
              nextActiveId = null;
            }
          }

          return {
            tabs: updatedTabs,
            activeTabId: nextActiveId,
          };
        }),

      setActiveTab: (id) => set({ activeTabId: id }),

      clearTabs: () => set({ tabs: [], activeTabId: null }),
    }),
    {
      name: "app-work-tabs",
    },
  ),
);
