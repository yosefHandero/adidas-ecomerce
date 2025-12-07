import { getPocketBase } from '../pocketbase';
import { cookies } from 'next/headers';

/**
 * Get PocketBase instance for server-side use
 * Automatically loads auth from cookies
 */
export async function getServerPocketBase() {
  const pb = getPocketBase();
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('pb_auth');

  if (authCookie?.value) {
    try {
      pb.authStore.loadFromCookie(authCookie.value);
    } catch (e) {
      // Invalid cookie, ignore
    }
  }

  return pb;
}

/**
 * Set auth cookie for the user
 */
export async function setAuthCookie(token: string, model: any) {
  const pb = getPocketBase();
  pb.authStore.save(token, model);
  const cookieStore = await cookies();
  cookieStore.set('pb_auth', pb.authStore.exportToCookie(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

/**
 * Clear auth cookie
 */
export async function clearAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.delete('pb_auth');
}

/**
 * Get current user from server
 */
export async function getCurrentUser() {
  const pb = await getServerPocketBase();
  if (pb.authStore.isValid) {
    return pb.authStore.model;
  }
  return null;
}
