import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';
import { workerPostPublic } from '../lib/api/apiClient';
import { api } from '../lib/api/api';

type UserRole = Database['public']['Enums']['user_role'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;

  // Modal State
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  authModalRedirectPath: string | undefined;

  // Methods
  openAuthModal: (mode: 'login' | 'register', redirectPath?: string) => void;
  closeAuthModal: () => void;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null; role: UserRole | null }>;
  signUp: (email: string, password: string, fullName: string, role: 'seeker' | 'employer', metadata?: any) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);

  // Modal State
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalRedirectPath, setAuthModalRedirectPath] = useState<string | undefined>(undefined);

  const checkSession = async () => {
    try {
      const sso = await api.get('/sso/exchange');
      if (sso.data?.access_token) {
        const { error } = await supabase.auth.setSession({
          access_token: sso.data.access_token,
          refresh_token: sso.data.refresh_token
        });
        if (error) throw error;
        return true;
      }
    } catch (error: any) {
      // 401 is expected for unauthenticated users
      if (error.message?.includes('401') || error.message?.includes('Not authenticated') || error.message?.includes('missing_sso')) {
        console.info('SSO: No active session found (guest user)');
      } else {
        console.warn('SSO Exchange failed (Cloudflare worker unavailable or error). Falling back to Supabase directly.', error);
      }
    }
    return false;
  };

  useEffect(() => {
    const initializeAuth = async () => {
      // 1. Try to exchange SSO token from Odoo/Cloudflare
      await checkSession();

      // 2. Check for an active session (from SSO success above or local storage fallback)
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchUserRole(currentSession.user.id);
      } else {
        setLoading(false);
      }
    };

    initializeAuth();

    // 3. Listen for subsequent auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      // Try to get role from user_roles first
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        setUserRole(data.role);
      } else {
        // Fallback: Check profiles table for account_type
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', userId)
          .single();

        if (profile) {
          let fallbackRole: UserRole = 'seeker';
          if (profile.account_type === 'company') fallbackRole = 'employer';
          if (profile.account_type === 'admin') fallbackRole = 'admin';

          // Info only: this user hasn't been migrated to the new user_roles table yet
          console.info(`Profile fallback: account_type '${profile.account_type}' -> role '${fallbackRole}'`);
          setUserRole(fallbackRole);
        } else {
          console.error('Error fetching user role:', error || profileError);
        }
      }
    } catch (err) {
      console.error('Unexpected error fetching role:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAuthModal = (mode: 'login' | 'register', redirectPath?: string) => {
    setAuthModalMode(mode);
    setAuthModalRedirectPath(redirectPath);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    setAuthModalRedirectPath(undefined);
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    let role: UserRole | null = null;
    if (data.user) {
      // Quick fetch for return value
      const { data: userRoleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();
      role = userRoleData?.role ?? null;

      if (!role) {
        // Fallback: Check profiles table for account_type
        const { data: profile } = await supabase
          .from('profiles')
          .select('account_type')
          .eq('user_id', data.user.id)
          .maybeSingle();

        if (profile) {
          if (profile.account_type === 'company') role = 'employer';
          else if (profile.account_type === 'admin') role = 'admin';
          else role = 'seeker';
        }
      }
    }

    return { error, role };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'seeker' | 'employer', metadata: any = {}) => {
    // Step 1: Create user in Odoo via Cloudflare Worker (proxies to SSO)
    try {
      const odooPayload: any = {
        email,
        password,
        name: fullName,
      };

      if (role === 'employer') {
        odooPayload.company_name = metadata?.employerData?.clinicName || fullName;
      }

      const odooData = await workerPostPublic('/api/hiring/sign-up', odooPayload);

      if (!odooData?.ok) {
        return {
          error: {
            message: odooData?.error || 'Failed to create account in Odoo',
            name: 'OdooSignUpError',
            status: 500,
          } as unknown as AuthError,
        };
      }
    } catch (err: any) {
      return {
        error: {
          message: err?.message || 'Failed to connect to sign-up service',
          name: 'OdooSignUpError',
          status: 500,
        } as unknown as AuthError,
      };
    }

    // Step 2: Create user in Supabase (only if Odoo succeeded)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role,
          ...metadata,
        },
      },
    });

    return { error };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setUserRole(null);
    setAuthModalOpen(false);
  };

  const value = {
    user,
    session,
    loading,
    userRole,
    authModalOpen,
    authModalMode,
    authModalRedirectPath,
    openAuthModal,
    closeAuthModal,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
