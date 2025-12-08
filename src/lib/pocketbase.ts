import PocketBase from 'pocketbase';

// Server-side PocketBase instance
export function getPocketBase() {
  const url = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL;
  if (!url) {
    throw new Error(
      'POCKETBASE_URL or NEXT_PUBLIC_POCKETBASE_URL environment variable is not set. ' +
      'Please set it in your .env.local file.'
    );
  }
  return new PocketBase(url);
}

// Client-side PocketBase instance (singleton)
let pbInstance: PocketBase | null = null;

export function getPocketBaseClient(): PocketBase {
  if (typeof window === 'undefined') {
    throw new Error('getPocketBaseClient can only be used on the client side. Use getPocketBase() on the server.');
  }

  if (!pbInstance) {
    const url = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090';
    pbInstance = new PocketBase(url);
    
    // Load auth from localStorage if available
    const authData = localStorage.getItem('pocketbase_auth');
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        pbInstance.authStore.save(parsed.token, parsed.model);
      } catch (e) {
        // Invalid auth data, clear it
        localStorage.removeItem('pocketbase_auth');
      }
    }
  }

  return pbInstance;
}

// Helper to persist auth to localStorage
export function persistAuth(pb: PocketBase) {
  if (typeof window !== 'undefined' && pb.authStore.isValid) {
    localStorage.setItem('pocketbase_auth', JSON.stringify({
      token: pb.authStore.token,
      model: pb.authStore.model,
    }));
  }
}

// Helper to clear auth
export function clearAuth() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('pocketbase_auth');
  }
}
