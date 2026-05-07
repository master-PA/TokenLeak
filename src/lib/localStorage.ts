export function safeJsonParse<T>(value: string): T | undefined {
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function readLocalStorageJson<T>(key: string): T | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = window.localStorage.getItem(key);
  if (!raw) return undefined;
  return safeJsonParse<T>(raw);
}

export function writeLocalStorageJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

