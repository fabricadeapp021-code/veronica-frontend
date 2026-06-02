let cachedApiUrl = null;
// Singleton promise to avoid multiple concurrent /api/config calls on page load
let resolvingPromise = null;

async function fetchRuntimeConfig() {
  try {
    const res = await fetch('/api/config', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.apiUrl || null;
  } catch {
    return null;
  }
}

export async function resolveApiBaseUrl() {
  if (cachedApiUrl) return cachedApiUrl;

  // Reuse in-flight resolution to prevent concurrent /api/config calls
  if (resolvingPromise) return resolvingPromise;

  resolvingPromise = (async () => {
    if (typeof window !== 'undefined') {
      const runtimeUrl = await fetchRuntimeConfig();
      if (runtimeUrl) {
        cachedApiUrl = runtimeUrl;
        resolvingPromise = null;
        return cachedApiUrl;
      }
    }

    cachedApiUrl =
      process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3010';
    resolvingPromise = null;
    return cachedApiUrl;
  })();

  return resolvingPromise;
}

// Compat: se algum lugar ainda chamar a função antiga
export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_URL || cachedApiUrl || 'http://127.0.0.1:3010';
}
