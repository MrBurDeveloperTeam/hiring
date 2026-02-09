import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Button } from '../../components/ui/button';
import { Toast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error, role } = await signIn(email, password);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setShowToast(true);
      // Redirect based on redirect parameter, user role, or default to jobs
      setTimeout(() => {
        if (redirectTo === 'apply') {
          navigate('/jobs');
          return;
        }

        if (redirectTo) {
          navigate(redirectTo);
          return;
        }

        if (role === 'employer') {
          navigate('/employers');
          return;
        }

        navigate('/seekers');
      }, 1000);
    }
  };

  return (
    <AppShell background="muted">
      <div className="mx-auto max-w-md">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Sign in</h1>
          <p className="text-sm text-gray-600 mt-1">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button variant="primary" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand hover:text-brand-hover">
              Sign up
            </Link>
          </div>
        </Card>
      </div>

      <Toast
        open={showToast}
        onClose={() => setShowToast(false)}
        title="Signed in successfully"
        description="Redirecting..."
        variant="success"
      />
    </AppShell>
  );
}
