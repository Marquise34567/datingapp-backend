const API = (process.env.NEXT_PUBLIC_API_URL as string) || "https://api.sparkdd.live";

export function apiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${API}/api${p}`;
}

export function apiFetch(path: string, opts?: RequestInit) {
  const url = apiUrl(path);
  const init = { credentials: 'include', ...opts } as RequestInit;
  return fetch(url, init);
}
