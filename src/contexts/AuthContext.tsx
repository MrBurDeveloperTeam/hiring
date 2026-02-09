import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User, AuthError } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

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

  useEffect(() => {
    // 1. Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    // 2. Listen for changes
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
          const fallbackRole: UserRole = profile.account_type === 'company' ? 'employer' : 'seeker';
          console.warn(`No user_role found, falling back to account_type: ${profile.account_type} -> ${fallbackRole}`);
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
          role = profile.account_type === 'company' ? 'employer' : 'seeker';
        }
      }
    }

    return { error, role };
  };

  const signUp = async (email: string, password: string, fullName: string, role: 'seeker' | 'employer', metadata: any = {}) => {
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
