import { supabase } from '../supabase';

/**
 * Get the current authenticated user ID
 */
export async function getCurrentUserId(): Promise<string | null> {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const userId = await getCurrentUserId();
  return userId !== null;
}
