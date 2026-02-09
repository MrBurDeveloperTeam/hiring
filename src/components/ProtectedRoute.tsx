import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../contexts/AuthContext';
import type { Database } from '../lib/database.types';

type UserRole = Database['public']['Enums']['user_role'];

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole;
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, userRole, session, openAuthModal } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand/10 via-white to-sky-50 px-4">
        {/* Decorative background elements matching landing page */}
        <div className="absolute -left-10 -top-12 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl opacity-60" />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-brand/20 border-t-brand" />
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">Loading...</div>
            <div className="text-sm text-gray-600">Please wait</div>
          </div>
        </div>
      </div>
    );
  }

  if (session === null && !user) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-brand/10 via-white to-sky-50 px-4">
        {/* Decorative background elements matching landing page */}
        <div className="absolute -left-10 -top-12 h-64 w-64 rounded-full bg-brand/20 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-sky-200/40 blur-3xl opacity-60" />

        <div className="relative w-full max-w-md space-y-8 rounded-3xl bg-white/80 p-10 text-center shadow-2xl backdrop-blur-xl ring-1 ring-white/50">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand/10 ring-8 ring-brand/5">
            <Lock className="h-10 w-10 text-brand" />
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              Authentication Required
            </h2>
            <p className="text-base text-gray-600">
              Please sign in or create an account to access this exclusive section.
            </p>
          </div>

          <div className="pt-4">
            <Button
              variant="primary"
              className="w-full justify-center py-6 text-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              onClick={() => openAuthModal('login', location.pathname)}
            >
              Sign in / Create Account
            </Button>
            <p className="mt-6 text-xs font-medium text-gray-400 uppercase tracking-widest">
              MR.BUR Dental Jobs • Secure Access
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (requiredRole && userRole !== requiredRole) {
    if (userRole === 'employer') {
      return <Navigate to="/employer/dashboard" replace />;
    }
    if (userRole === 'seeker') {
      return <Navigate to="/seekers/dashboard" replace />;
    }
    return <Navigate to="/jobs" replace />;
  }

  return <>{children}</>;
}
