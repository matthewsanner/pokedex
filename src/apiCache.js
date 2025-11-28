// IndexedDB API cache with TTL (Time To Live)
// Cache key: API URL
// Value: { data, timestamp }
// TTL: 7 days (configurable)

const CACHE_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
const DB_NAME = "pokeapi_cache_db";
const DB_VERSION = 1;
const STORE_NAME = "cache";

let dbPromise = null;

// Initialize IndexedDB
function initDB() {
  if (dbPromise) {
    return dbPromise;
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });

  return dbPromise;
}

// Check if cache entry is expired
function isExpired(timestamp) {
  return Date.now() - timestamp > CACHE_TTL;
}

// Check if URL is an individual Pokemon endpoint
function isPokemonEndpoint(url) {
  return /\/pokemon\/\d+\/?$/.test(url);
}

// Compress Pokemon data to only essential fields we use
function compressPokemon(pokemon) {
  return {
    id: pokemon.id,
    name: pokemon.name,
    types: pokemon.types.map((t) => ({ type: { name: t.type.name } })),
    sprites: {
      front_default: pokemon.sprites?.front_default || null,
    },
  };
}

// Decompress Pokemon data (reconstructs the structure)
function decompressPokemon(compressed) {
  // The compressed format already matches what we need, but we ensure structure
  return {
    id: compressed.id,
    name: compressed.name,
    types: compressed.types,
    sprites: compressed.sprites,
  };
}

// Get cached data if valid
export async function getCached(url) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(url);

      request.onerror = () => {
        console.warn("Cache read error:", request.error);
        resolve(null);
      };

      request.onsuccess = () => {
        const result = request.result;
        if (!result) {
          resolve(null);
          return;
        }

        const { data, timestamp, compressed } = result;

        // Check if expired
        if (isExpired(timestamp)) {
          // Lazy eviction: remove expired entry
          deleteCached(url);
          resolve(null);
          return;
        }

        // Decompress if it's a compressed Pokemon entry
        if (compressed && isPokemonEndpoint(url)) {
          resolve(decompressPokemon(data));
        } else {
          resolve(data);
        }
      };
    });
  } catch (error) {
    console.warn("Cache read error:", error);
    return null;
  }
}

// Store data in cache
export async function setCached(url, data) {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);

      // Compress Pokemon data if it's an individual Pokemon endpoint
      let dataToCache = data;
      let isCompressed = false;
      if (isPokemonEndpoint(url)) {
        dataToCache = compressPokemon(data);
        isCompressed = true;
      }

      const cacheEntry = {
        data: dataToCache,
        timestamp: Date.now(),
        compressed: isCompressed,
      };
      const request = store.put(cacheEntry, url);

      request.onerror = () => {
        console.warn("Cache write error:", request.error);
        resolve(); // Don't reject, just log and continue
      };

      request.onsuccess = () => {
        resolve();
      };
    });
  } catch (error) {
    console.warn("Cache write error:", error);
  }
}

// Delete cached entry
async function deleteCached(url) {
  try {
    const db = await initDB();
    return new Promise((resolve) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(url);

      request.onerror = () => resolve();
      request.onsuccess = () => resolve();
    });
  } catch (error) {
    // Ignore delete errors
  }
}

// Cached fetch wrapper with retry logic
export async function cachedFetch(url, retries = 3) {
  // Try to get from cache first
  const cached = await getCached(url);
  if (cached !== null) {
    return cached;
  }

  // Retry logic for API calls
  let lastError;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url);

      // Check if response is OK
      if (!response.ok) {
        // If it's a server error (5xx), retry
        if (response.status >= 500 && attempt < retries - 1) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff: 1s, 2s, 4s
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        // For other errors, throw immediately
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Try to parse JSON
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, it might be a timeout or error page
        throw new Error(`Invalid JSON response: ${response.statusText}`);
      }

      // Store in cache (will be compressed if it's a Pokemon endpoint)
      await setCached(url, data);

      return data;
    } catch (error) {
      lastError = error;
      // If it's a network error and we have retries left, wait and retry
      if (
        attempt < retries - 1 &&
        (error.name === "TypeError" || error.message.includes("fetch"))
      ) {
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      // If we're out of retries or it's a non-retryable error, throw
      throw error;
    }
  }

  // If we exhausted all retries, throw the last error
  throw lastError || new Error("Failed to fetch after retries");
}
