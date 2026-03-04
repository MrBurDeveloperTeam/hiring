import { FormEvent, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { PasswordInput } from './ui/PasswordInput';
import { Modal } from './ui/modal';
import { Toast } from './ui/toast';
import { Checkbox } from './ui/checkbox';
import { useAuth } from '../contexts/AuthContext';

const SAVED_EMAIL_KEY = 'hiring-saved-email';

export function AuthModal() {
  const {
    authModalOpen,
    authModalMode,
    authModalRedirectPath,
    closeAuthModal,
    openAuthModal,
    signIn,
    signUp,
  } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  // Employer specific fields
  // Clinic fields removed
  // const [clinicName, setClinicName] = useState('');
  // const [city, setCity] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    if (authModalOpen) {
      const savedEmail = localStorage.getItem(SAVED_EMAIL_KEY);
      if (savedEmail && authModalMode === 'login') {
        setEmail(savedEmail);
      }
    } else {
      setEmail('');
      setPassword('');
      setFullName('');
      setRole('seeker');
      // Clinic fields removed
      // setClinicName('');
      // setCity('');
      setError(null);
      setLoading(false);
      setShowSuccessToast(false);
      setRememberMe(true);
    }
  }, [authModalOpen, authModalMode]);

  const handleClose = () => {
    closeAuthModal();
  };

  const goToDefault = (userRole: string | null) => {
    if (userRole === 'admin') {
      navigate('/admin');
      closeAuthModal();
      return;
    }
    const fallback = userRole === 'employer' ? '/employers' : '/seekers';
    const redirectPath = authModalRedirectPath ?? fallback;
    navigate(redirectPath);
    closeAuthModal();
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError, role: loggedRole } = await signIn(email, password, rememberMe);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    // Save or clear remembered email
    if (rememberMe) {
      localStorage.setItem(SAVED_EMAIL_KEY, email);
    } else {
      localStorage.removeItem(SAVED_EMAIL_KEY);
    }

    setShowSuccessToast(true);
    // Delay navigation slightly to let user see toast
    setTimeout(() => {
      goToDefault(loggedRole ?? 'seeker');
      setLoading(false);
    }, 1500);
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const metadata: Record<string, any> = {};
    if (role === 'employer') {
      // No employer data needed for initial signup
    }

    const { error: authError } = await signUp(email, password, fullName, role, metadata);
    if (authError) {
      setError(authError.message);
      setLoading(false);
      return;
    }

    goToDefault(role);
    setLoading(false);
  };

  return (
    <>
      <Modal open={authModalOpen} onClose={handleClose} title={authModalMode === 'login' ? 'Sign in' : 'Create account'}>
        <div className="space-y-4">
          <div className="flex gap-2">
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${authModalMode === 'login'
                ? 'bg-brand text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-brand hover:text-brand'
                }`}
              onClick={() => openAuthModal('login', authModalRedirectPath)}
            >
              Sign in
            </button>
            <button
              type="button"
              className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${authModalMode === 'register'
                ? 'bg-brand text-white'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-brand hover:text-brand'
                }`}
              onClick={() => openAuthModal('register', authModalRedirectPath)}
            >
              Sign up
            </button>
          </div>

          <form onSubmit={authModalMode === 'login' ? handleLogin : handleRegister} className="space-y-4">
            {authModalMode === 'register' && (
              <Input
                label="Full name"
                placeholder="Your name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Enter a secure password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            {authModalMode === 'login' && (
              <Checkbox
                label="Remember me"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="border-none p-0 bg-transparent"
              />
            )}
            {/* Clinic fields removed for decoupled signup */}

            {authModalMode === 'register' && (
              <div>
                <label className="text-sm font-semibold text-gray-700">Role</label>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${role === 'seeker'
                      ? 'bg-brand text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:border-brand hover:text-brand'
                      }`}
                    onClick={() => setRole('seeker')}
                  >
                    Seeker
                  </button>
                  <button
                    type="button"
                    className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold transition ${role === 'employer'
                      ? 'bg-brand text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:border-brand hover:text-brand'
                      }`}
                    onClick={() => setRole('employer')}
                  >
                    Employer
                  </button>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button variant="primary" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Working...' : authModalMode === 'login' ? 'Sign in' : 'Create account'}
            </Button>
          </form>

          <p className="text-xs text-center text-gray-500">
            By continuing you agree to the platform&apos;s <span className="text-brand font-semibold">terms</span> and{' '}
            <span className="text-brand font-semibold">privacy policy</span>.
          </p>
        </div>
      </Modal>

      <Toast
        open={showSuccessToast}
        onClose={() => setShowSuccessToast(false)}
        title="Welcome back!"
        description="You have successfully signed in."
        variant="success"
      />
    </>
  );
}
