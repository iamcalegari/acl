const API_BASE = ""; // com proxy do Vite, caminho relativo (/api/...)

export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function setAccessToken(token: string) {
  localStorage.setItem("accessToken", token);
}

export function clearAccessToken() {
  localStorage.removeItem("accessToken");
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const token = getAccessToken();

  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");

  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    credentials: "include", // caso use cookie em algum momento
  });

  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      msg = data?.message ?? data?.error ?? msg;
    } catch { console.log(msg) }
    throw new Error(msg);
  }

  return (await res.json()) as T;
}
