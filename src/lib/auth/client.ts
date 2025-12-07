'use client';

import { getPocketBaseClient, persistAuth, clearAuth } from '../pocketbase';

/**
 * Client-side auth utilities
 */
export const authClient = {
  /**
   * Sign up a new user
   */
  async signUp(email: string, password: string, passwordConfirm: string, name?: string) {
    const pb = getPocketBaseClient();
    const data: any = {
      email,
      password,
      passwordConfirm,
    };
    if (name) {
      data.name = name;
    }
    const record = await pb.collection('users').create(data);
    await pb.collection('users').authWithPassword(email, password);
    persistAuth(pb);
    return record;
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const pb = getPocketBaseClient();
    const authData = await pb.collection('users').authWithPassword(email, password);
    persistAuth(pb);
    return authData;
  },

  /**
   * Sign out
   */
  async signOut() {
    const pb = getPocketBaseClient();
    pb.authStore.clear();
    clearAuth();
    // Also clear server cookie via API
    await fetch('/api/auth/logout', { method: 'POST' });
  },

  /**
   * Get current user
   */
  getCurrentUser() {
    const pb = getPocketBaseClient();
    return pb.authStore.model;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const pb = getPocketBaseClient();
    return pb.authStore.isValid;
  },

  /**
   * Refresh auth token
   */
  async refresh() {
    const pb = getPocketBaseClient();
    if (pb.authStore.isValid) {
      await pb.collection('users').authRefresh();
      persistAuth(pb);
    }
  },
};
