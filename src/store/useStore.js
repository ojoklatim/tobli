import { create } from 'zustand';

export const useStore = create((set) => ({
  userLocation: null,
  setUserLocation: (location) => set({ userLocation: location }),
  
  selectedBusiness: null,
  setSelectedBusiness: (business) => set({ selectedBusiness: business }),
  
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),

  // search results from backend (mocked for now)
  searchResults: [],
  setSearchResults: (results) => set({ searchResults: results }),

  currentIndex: 0,
  setCurrentIndex: (i) => set({ currentIndex: i }),

  // Theme management
  theme: localStorage.getItem('tobli-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
  setTheme: (theme) => {
    localStorage.setItem('tobli-theme', theme);
    set({ theme });
  },

  // directions mode
  showDirections: false,
  setShowDirections: (v) => set({ showDirections: v }),
  // Presence tracking for live users on the map
  liveUsers: {}, // user_id -> presence data
  setLiveUsers: (usersOrUpdater) => set((state) => ({
    liveUsers: typeof usersOrUpdater === 'function'
      ? usersOrUpdater(state.liveUsers)
      : usersOrUpdater,
  })),
}));
