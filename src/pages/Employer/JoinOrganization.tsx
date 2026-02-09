import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { acceptInviteLink, getInviteDetails } from '../../lib/api/organization_members';
import { Button } from '../../components/ui/button';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function JoinOrganization() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get('token');
    const navigate = useNavigate();
    const { user, openAuthModal } = useAuth();

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);

    useEffect(() => {
        if (!token) {
            setError('Invalid invite link.');
            setLoading(false);
            return;
        }

        async function fetchDetails() {
            try {
                const details = await getInviteDetails(token!);
                if (!details || !details.is_valid) {
                    setError('This invite link is invalid or has expired.');
                } else {
                    setInviteDetails(details);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load invite details.');
            } finally {
                setLoading(false);
            }
        }

        fetchDetails();
    }, [token]);

    const handleJoin = async () => {
        if (!token) return;
        setJoining(true);
        try {
            // Check if user already has an org
            if (user) {
                // We need to fetch user's orgs. 
                // Since this is inside a function, we might not have them loaded.
                // We can use the API directly.
                // Dynamic import or just relying on imports.
                // Using API:
                const { getUsersOrganizations } = await import('../../lib/api/organizations');
                const orgs = await getUsersOrganizations(user.id);
                if (orgs && orgs.length > 0) {
                    throw new Error("You are already a member of an organization. You cannot join another one.");
                }
            }

            await acceptInviteLink(token);
            // Redirect to dashboard
            navigate('/employer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to join organization.');
        } finally {
            setJoining(false);
        }
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading invite details...</div>;
    }

    if (error) {
        return (
            <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md text-center">
                    <XCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Join</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button onClick={() => navigate('/')}>Go Home</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-gray-50 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden p-8 text-center space-y-6">
                <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center mx-auto text-brand">
                    <CheckCircle2 className="h-8 w-8" />
                </div>

                <div>
                    <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">You've been invited to join</h2>
                    <h1 className="text-3xl font-bold text-gray-900">{inviteDetails?.org_name}</h1>
                    {inviteDetails?.inviter_name && (
                        <p className="text-sm text-gray-500 mt-2">Invited by <span className="font-medium text-gray-900">{inviteDetails.inviter_name}</span></p>
                    )}
                </div>

                <div className="bg-gray-50 rounded-xl p-4 text-left">
                    <div className="flex justify-between items-center text-sm py-2 border-b border-gray-200">
                        <span className="text-gray-500">Role</span>
                        <span className="font-medium capitalize">{inviteDetails?.role}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm py-2">
                        <span className="text-gray-500">Expiration</span>
                        <span className="font-medium text-brand">Valid</span>
                    </div>
                </div>

                <div className="pt-4">
                    {user ? (
                        <Button
                            variant="primary"
                            size="lg"
                            className="w-full"
                            onClick={handleJoin}
                            disabled={joining}
                        >
                            {joining ? 'Joining Team...' : 'Join Team Now'}
                        </Button>
                    ) : (
                        <div className="space-y-3">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full"
                                onClick={() => openAuthModal('register', `/join?token=${token}`)}
                            >
                                Create Account to Join
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                onClick={() => openAuthModal('login', `/join?token=${token}`)}
                            >
                                Log In
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
