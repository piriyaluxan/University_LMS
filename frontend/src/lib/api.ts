export const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || "http://localhost:5000";

export function getAuthToken(): string | null {
  return localStorage.getItem("token");
}

export async function apiFetch<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data?.success === false) {
    const message = (data && (data.error || data.message)) || res.statusText;
    throw new Error(message);
  }
  return data as T;
}

export async function apiFetchForm<T = any>(
  path: string,
  formData: FormData,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: HeadersInit = {
    ...(options.headers || {}),
  };
  if (token) {
    (headers as any).Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || "POST",
    body: formData,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || (data && data.success === false)) {
    const message = (data && (data.error || data.message)) || res.statusText;
    throw new Error(message);
  }
  return data as T;
}
