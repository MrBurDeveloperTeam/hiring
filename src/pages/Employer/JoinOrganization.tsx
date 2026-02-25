import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { acceptInviteLink, getInviteDetails } from '../../lib/api/organization_members';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';

export default function JoinOrganization() {
    const { shortCode } = useParams();
    const [searchParams] = useSearchParams();
    const tokenParam = searchParams.get('token');
    const orgParam = searchParams.get('org');
    const navigate = useNavigate();
    const { user, openAuthModal } = useAuth();

    const [inviteDetails, setInviteDetails] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [joining, setJoining] = useState(false);

    const [token, setToken] = useState<string | null>(tokenParam);
    const [resolvedOrgName, setResolvedOrgName] = useState<string | null>(orgParam);

    // Initial effect to handle token or shortCode
    useEffect(() => {
        if (tokenParam) {
            setToken(tokenParam);
            return;
        }

        if (shortCode) {
            const resolve = async () => {
                setLoading(true);
                try {
                    const { resolveShortCode } = await import('../../lib/api/organization_members');
                    const data = await resolveShortCode(shortCode);
                    if (data && data.token) {
                        setToken(data.token);
                        if (data.org_name) setResolvedOrgName(data.org_name);
                    } else {
                        setError('Invalid short link.');
                        setLoading(false);
                    }
                } catch (err: any) {
                    setError('Failed to resolve short link.');
                    setLoading(false);
                }
            };
            resolve();
        } else {
            setError('Invalid invite link.');
            setLoading(false);
        }
    }, [shortCode, tokenParam]);

    // Fetch details once we have a token
    useEffect(() => {
        if (!token) return;

        async function fetchDetails() {
            try {
                const details = await getInviteDetails(token!);
                if (!details || !details.is_valid) {
                    setError('This invite link is invalid or has expired.');
                } else {
                    setInviteDetails(details);
                    // Update resolved name from official details if needed
                    if (details.org_name) setResolvedOrgName(details.org_name);
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load invite details.');
            } finally {
                setLoading(false);
            }
        }

        // Only fetch if we haven't already fetched or if loading is true (to avoid double fetch if shortcode set token)
        /* Actually, fetchDetails is needed to get full details like inviter name, etc. 
           The short code resolution might define token but we still need `inviteDetails` state populated. 
        */
        fetchDetails();
    }, [token]);


    const handleJoin = async () => {
        if (!token) return;
        setJoining(true);
        setError(null); // Clear previous errors
        try {
            // Check if user already has an org
            if (user) {
                const { getUsersOrganizations } = await import('../../lib/api/organizations');
                const orgs = await getUsersOrganizations(user.id);
                if (orgs && orgs.length > 0) {
                    throw new Error("You are already a member of an organization. You cannot join another one.");
                }
            }

            const result = await acceptInviteLink(token);

            // Check if the acceptance succeeded
            if (result && result.data && result.data.success === false) {
                throw new Error(result.data.error || 'Failed to join organization.');
            }

            // Redirect to dashboard
            navigate('/employer/dashboard');
        } catch (err: any) {
            setError(err.message || 'Failed to join organization.');
        } finally {
            setJoining(false);
        }
    };

    const getRedirectPath = () => {
        if (shortCode) return `/join/${shortCode}`;
        return `/join?token=${token}${resolvedOrgName ? `&org=${encodeURIComponent(resolvedOrgName)}` : ''}`;
    };

    if (loading) {
        return <div className="flex h-screen items-center justify-center">Loading invite details{resolvedOrgName ? ` for ${resolvedOrgName}` : ''}...</div>;
    }

    if (error) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="text-red-600">Invitation Error</CardTitle>
                        <CardDescription>{error}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button variant="outline" className="w-full" onClick={() => navigate('/')}>
                            Return to Home
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg">
                <CardHeader className="text-center flex flex-col items-center">
                    <CardTitle className="text-2xl font-bold">Join Organization</CardTitle>
                    <CardDescription>
                        You have been invited to join <span className="font-semibold text-gray-900">{inviteDetails?.org_name || resolvedOrgName}</span>
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {inviteDetails?.logo_url && (
                        <div className="flex justify-center mb-4">
                            <img
                                src={inviteDetails.logo_url}
                                alt={`${inviteDetails.org_name} logo`}
                                className="max-h-24 w-auto max-w-full object-contain p-4"
                            />
                        </div>
                    )}
                    <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg text-blue-700">
                        <p className="font-medium text-lg">{inviteDetails?.role === 'owner' ? 'Owner' : 'Team Member'} Role</p>
                        <p className="text-sm opacity-80">Invited by {inviteDetails?.inviter_name || 'Organization Admin'}</p>
                    </div>

                    {user ? (
                        <div className="space-y-3">
                            <div className="text-sm text-center text-gray-500">
                                You are signed in as <span className="font-medium text-gray-900">{user.email}</span>
                            </div>
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                onClick={handleJoin}
                                disabled={joining}
                            >
                                {joining ? 'Joining...' : 'Accept Invitation'}
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <Button
                                variant="primary"
                                size="lg"
                                className="w-full"
                                onClick={() => openAuthModal('register', getRedirectPath())}
                            >
                                Create Account to Join
                            </Button>
                            <Button
                                variant="outline"
                                size="lg"
                                className="w-full"
                                onClick={() => openAuthModal('login', getRedirectPath())}
                            >
                                Log In
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
