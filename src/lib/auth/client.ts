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
    
    // Validation
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (password !== passwordConfirm) {
      throw new Error('Passwords do not match');
    }
    
    const data: Record<string, unknown> = {
      email,
      password,
      passwordConfirm,
    };
    if (name) {
      data.name = name;
    }
    
    try {
      const record = await pb.collection('users').create(data);
      await pb.collection('users').authWithPassword(email, password);
      persistAuth(pb);
      return record;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to sign up';
      throw new Error(message);
    }
  },

  /**
   * Sign in with email and password
   */
  async signIn(email: string, password: string) {
    const pb = getPocketBaseClient();
    
    // Validation
    if (!email || !email.includes('@')) {
      throw new Error('Valid email is required');
    }
    if (!password) {
      throw new Error('Password is required');
    }
    
    try {
      const authData = await pb.collection('users').authWithPassword(email, password);
      persistAuth(pb);
      return authData;
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Invalid email or password';
      throw new Error(message);
    }
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
    try {
      const pb = getPocketBaseClient();
      return pb.authStore.model;
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    try {
      const pb = getPocketBaseClient();
      return pb.authStore.isValid;
    } catch {
      return false;
    }
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
