"use client";

import { create } from "zustand";

export type UserRole = "teacher" | "student" | null;

interface AppState {
  // Hydrated by the app layout after auth; null while loading.
  userId: string | null;
  role: UserRole;
  displayName: string | null;
  setUser: (user: {
    userId: string;
    role: Exclude<UserRole, null>;
    displayName: string | null;
  }) => void;
  clearUser: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  userId: null,
  role: null,
  displayName: null,
  setUser: ({ userId, role, displayName }) =>
    set({ userId, role, displayName }),
  clearUser: () => set({ userId: null, role: null, displayName: null }),
}));
