import { createSignal } from "solid-js";
import { isServer } from "solid-js/web";

/** Minimal college info needed for the compare tray and to build /compare URLs. */
export interface CompareItem {
  id: number;
  slug: string;
  name: string;
  logo?: string | null;
  city?: string | null;
  type?: string | null;
}

export const MAX_COMPARE = 4;
const STORAGE_KEY = "acl_compare";

// Module-level signal = a single shared, reactive store across the app. Starts
// empty on the server; hydrated from localStorage on the client (loadCompare()).
const [items, setItems] = createSignal<CompareItem[]>([]);

export { items };

function persist(next: CompareItem[]) {
  setItems(next);
  if (isServer) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage may be unavailable; non-fatal */
  }
}

/** Load the saved selection from localStorage. Call once on the client (onMount). */
export function loadCompare() {
  if (isServer) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      setItems(parsed.filter((x) => x && typeof x.id === "number").slice(0, MAX_COMPARE));
    }
  } catch {
    /* ignore malformed storage */
  }
}

export const isInCompare = (id: number) => items().some((c) => c.id === id);
export const isCompareFull = () => items().length >= MAX_COMPARE;
export const compareCount = () => items().length;

/** Add a college if there is room and it is not already selected. */
export function addToCompare(item: CompareItem): boolean {
  if (isInCompare(item.id) || isCompareFull()) return false;
  persist([...items(), item]);
  return true;
}

export function removeFromCompare(id: number) {
  persist(items().filter((c) => c.id !== id));
}

/** Toggle membership; returns the new membership state. */
export function toggleCompare(item: CompareItem): boolean {
  if (isInCompare(item.id)) {
    removeFromCompare(item.id);
    return false;
  }
  return addToCompare(item);
}

export function clearCompare() {
  persist([]);
}

/** Replace the whole selection (used to sync the tray with the compare page URL). */
export function setCompareItems(next: CompareItem[]) {
  persist(next.slice(0, MAX_COMPARE));
}
