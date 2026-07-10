import { create } from "zustand";
import { fetchProgress, refillHearts as apiRefillHearts, UserProgressData, logout as apiLogout, getStoredToken, selectCourse as apiSelectCourse } from "./api";

export interface UserProgressState {
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  hearts: number;
  maxHearts: number;
  gems: number;
  dailyXpGoal: number;
  xpToday: number;
  streakFreezeCount: number;
  activeCourseId: number;
  isAuthenticated: boolean;
  
  // Actions
  setProgress: (progress: Partial<UserProgressState>) => void;
  syncWithProgressData: (data: UserProgressData) => void;
  fetchProgressData: () => Promise<void>;
  refillHeartsOptimistic: () => Promise<void>;
  decrementHeartsOptimistic: () => void;
  addXpOptimistic: (xp: number) => void;
  selectCourse: (courseId: number) => Promise<void>;
  logout: () => void;
}

export const useStore = create<UserProgressState>((set, get) => ({
  totalXp: 0,
  currentStreak: 0,
  longestStreak: 0,
  hearts: 5,
  maxHearts: 5,
  gems: 0,
  dailyXpGoal: 50,
  xpToday: 0,
  streakFreezeCount: 0,
  activeCourseId: 1,
  isAuthenticated: false,

  setProgress: (progress) => set((state) => ({ ...state, ...progress })),

  syncWithProgressData: (data) => set({
    totalXp: data.total_xp,
    currentStreak: data.current_streak,
    longestStreak: data.longest_streak,
    hearts: data.hearts,
    maxHearts: data.max_hearts,
    gems: data.gems,
    dailyXpGoal: data.daily_xp_goal,
    xpToday: data.xp_today,
    streakFreezeCount: data.streak_freeze_count,
    activeCourseId: data.active_course_id || 1,
    isAuthenticated: true
  }),

  fetchProgressData: async () => {
    const token = getStoredToken();
    if (!token) {
      set({ isAuthenticated: false });
      return;
    }

    try {
      const data = await fetchProgress();
      get().syncWithProgressData(data);
    } catch (err) {
      console.error("Failed to fetch progress in store", err);
      get().logout();
    }
  },
  
  refillHeartsOptimistic: async () => {
    const previousGems = get().gems;
    const previousHearts = get().hearts;
    set((state) => ({
      hearts: state.maxHearts,
      gems: Math.max(0, state.gems - 100)
    }));

    try {
      const data = await apiRefillHearts();
      get().syncWithProgressData(data);
    } catch (err) {
      set({ gems: previousGems, hearts: previousHearts });
      console.error("Failed to refill hearts in store", err);
    }
  },

  decrementHeartsOptimistic: () => set((state) => ({
    hearts: Math.max(0, state.hearts - 1)
  })),

  addXpOptimistic: (xp) => set((state) => ({
    totalXp: state.totalXp + xp,
    xpToday: state.xpToday + xp
  })),

  selectCourse: async (courseId: number) => {
    const prevCourseId = get().activeCourseId;
    set({ activeCourseId: courseId });
    try {
      const data = await apiSelectCourse(courseId);
      get().syncWithProgressData(data);
    } catch (err) {
      set({ activeCourseId: prevCourseId });
      console.error("Failed to select course", err);
    }
  },

  logout: () => {
    apiLogout();
    set({
      totalXp: 0,
      currentStreak: 0,
      longestStreak: 0,
      hearts: 5,
      maxHearts: 5,
      gems: 0,
      xpToday: 0,
      activeCourseId: 1,
      isAuthenticated: false
    });
  }
}));
