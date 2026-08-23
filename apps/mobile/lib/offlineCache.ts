import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "picacho_cache_";

export interface CachedResult<T> {
  data: T;
  fromCache: boolean;
}

// Intenta la petición real primero; si falla (sin conexión), sirve la última
// respuesta exitosa guardada para esa misma key. Si nunca hubo una respuesta
// exitosa guardada, deja que el error original se propague.
export async function fetchWithCache<T>(
  key: string,
  fetcher: () => Promise<T>,
): Promise<CachedResult<T>> {
  try {
    const data = await fetcher();
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(data)).catch(() => {});
    return { data, fromCache: false };
  } catch (err) {
    const cached = await AsyncStorage.getItem(PREFIX + key);
    if (cached) return { data: JSON.parse(cached) as T, fromCache: true };
    throw err;
  }
}
