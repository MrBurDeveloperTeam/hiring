import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/PasswordInput';
import { Select } from '../../components/ui/select';
import { Button } from '../../components/ui/button';
import { Tabs } from '../../components/ui/tabs';
import { Toast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';

export default function Register() {
  const [role, setRole] = useState<'seeker' | 'employer'>('seeker');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('Malaysia');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate password match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    if (role === 'seeker' && (!school || !graduationYear)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (role === 'employer' && (!clinicName || !city)) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    const metadata: any = {
      phone: phone || null,
    };

    if (role === 'seeker') {
      metadata.seekerData = {
        school,
        graduationDate: `${graduationYear}-12-31`,
        seekerType: 'student',
      };
    } else {
      metadata.employerData = {
        clinicName,
        city,
        country,
      };
    }

    const { error } = await signUp(email, password, fullName, role, metadata);

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setShowToast(true);
      setTimeout(() => {
        navigate('/jobs');
      }, 1500);
    }
  };

  return (
    <AppShell background="muted">
      <div className="mx-auto max-w-3xl">
        <Card className="p-6">
          <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
          <p className="text-sm text-gray-600 mt-1">Sign up to get started</p>

          <div className="mt-4">
            <Tabs
              tabs={[
                { id: 'seeker', label: 'Student/Seeker' },
                { id: 'employer', label: 'Employer' }
              ]}
              active={role}
              onChange={(value) => setRole(value as 'seeker' | 'employer')}
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-5 grid gap-4">
            <Input
              label="Full name"
              placeholder="Alex Dental"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Phone"
              placeholder="+60"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <PasswordInput
              label="Confirm Password"
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
            {role === 'seeker' ? (
              <>
                <Input
                  label="School"
                  placeholder="Mahsa University"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  required
                />
                <Select
                  label="Graduation year"
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  <option>2024</option>
                  <option>2025</option>
                  <option>2026</option>
                  <option>2027</option>
                  <option>2028</option>
                </Select>
              </>
            ) : (
              <>
                <Input
                  label="Clinic name"
                  placeholder="Bright Dental"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  required
                />
                <Input
                  label="City"
                  placeholder="Kuala Lumpur"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  required
                />
                <Select
                  label="Country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  <option>Malaysia</option>
                  <option>Singapore</option>
                </Select>
              </>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button variant="primary" type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Sign up'}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:text-brand-hover">
              Sign in
            </Link>
          </div>
        </Card>
      </div>

      <Toast
        open={showToast}
        onClose={() => setShowToast(false)}
        title="Account created successfully"
        description="Please check your email to verify your account"
        variant="success"
      />
    </AppShell>
  );
}
