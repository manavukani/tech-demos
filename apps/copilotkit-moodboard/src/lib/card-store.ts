import { useCallback, useSyncExternalStore } from "react";
import type { MoodCard } from "./cards";

/**
 * Minimal session-scoped store for the board. Backed by sessionStorage so a
 * refresh keeps the cards, but nothing survives closing the tab (persistence
 * beyond the session is out of scope for this demo).
 */
const STORAGE_KEY = "copilotkit-moodboard.cards.v1";
const EMPTY: MoodCard[] = [];

let snapshot: MoodCard[] | null = null;
const listeners = new Set<() => void>();

export function readCards(): MoodCard[] {
  if (snapshot === null) {
    try {
      const raw = typeof window !== "undefined" ? window.sessionStorage.getItem(STORAGE_KEY) : null;
      snapshot = raw ? (JSON.parse(raw) as MoodCard[]) : EMPTY;
    } catch {
      snapshot = EMPTY;
    }
  }
  return snapshot;
}

export function writeCards(next: MoodCard[]) {
  snapshot = next;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage full or unavailable — keep in-memory only */
  }
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCards() {
  const cards = useSyncExternalStore(subscribe, readCards, () => EMPTY);
  const update = useCallback((fn: (prev: MoodCard[]) => MoodCard[]) => writeCards(fn(readCards())), []);
  return [cards, update] as const;
}
