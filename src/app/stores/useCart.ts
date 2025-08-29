'use client';
import { create } from 'zustand';

type State = { count: number };
type Actions = { add: () => void };

export const useCart = create<State & Actions>((set) => ({
    count: 0,
    add: () => set((s) => ({ count: s.count + 1 })),
}));
