import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { AppShell } from '../../layouts/AppShell';
import { Building2, MapPin, Globe, CheckCircle2, Edit } from 'lucide-react';
import { getOrganizationByName } from '../../lib/api/public_organizations';
import { getJobs, deleteJob } from '../../lib/api/jobs';
import { getApplications } from '../../lib/api/applications';
import { Job } from '../../lib/types';
import { JobCard } from '../../components/JobCard';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useAuth } from '../../contexts/AuthContext';
import { updateVerificationStatus } from '../../lib/api/organizations';
import { Toast } from '../../components/ui/toast';

export default function OrganizationProfile() {
    const { orgName } = useParams<{ orgName: string }>();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'jobs' | 'about'>('jobs');
    const [organization, setOrganization] = useState<any | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const { userRole, user } = useAuth();
    const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
    const [toast, setToast] = useState<{ open: boolean; title: string; variant: 'success' | 'error' }>({
        open: false,
        title: '',
        variant: 'success'
    });

    const handleVerification = async (status: 'verified' | 'rejected' | 'pending') => {
        if (!organization) return;
        try {
            await updateVerificationStatus(organization.id, status);
            setToast({
                open: true,
                title: `Organization ${status === 'verified' ? 'verified' : 'rejected'}`,
                variant: 'success'
            });
            // Refresh data
            setOrganization({ ...organization, verified_status: status });
        } catch (error) {
            console.error('Error updating status:', error);
            setToast({
                open: true,
                title: 'Failed to update status',
                variant: 'error'
            });
        }
    };

    const handleDeleteJob = async (job: Job) => {
        if (!window.confirm("Are you sure you want to delete this job? This action cannot be undone.")) return;

        try {
            await deleteJob(job.id);
            setJobs(prevJobs => prevJobs.filter(j => j.id !== job.id));
            setToast({
                open: true,
                title: 'Job deleted',
                variant: 'success'
            });
        } catch (error) {
            console.error('Error deleting job:', error);
            setToast({
                open: true,
                title: 'Failed to delete job',
                variant: 'error'
            });
        }
    };

    useEffect(() => {
        async function loadData() {
            if (!orgName) return;
            try {
                setLoading(true);
                // Decode URI component just in case, though react-router might handle it
                const decodedName = decodeURIComponent(orgName);
                const orgData = await getOrganizationByName(decodedName);

                if (orgData) {
                    setOrganization(orgData);
                    const { data: orgJobs } = await getJobs({
                        status: 'published',
                        orgId: orgData.id,
                        limit: 50
                    });
                    setJobs(orgJobs);

                    // Fetch applications if user is a seeker
                    if (user && userRole === 'seeker') {
                        const applications = await getApplications({
                            seeker_user_id: user.id
                        });
                        const appliedIds = new Set(applications.map(app => app.jobId));
                        setAppliedJobIds(appliedIds);
                    }
                }
            } catch (error) {
                console.error('Error loading organization profile:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [orgName, user, userRole]);

    if (loading) {
        return (
            <AppShell background="muted">
                <div className="flex h-96 items-center justify-center">
                    <p className="text-gray-500">Loading profile...</p>
                </div>
            </AppShell>
        );
    }

    if (!organization) {
        return (
            <AppShell background="muted">
                <div className="flex h-96 flex-col items-center justify-center text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">Organization not found</h2>
                    <p className="text-gray-500 mt-2">We couldn't find an organization with that name.</p>
                    <Button variant="outline" className="mt-4" asChild>
                        <Link to="/jobs">Back to Jobs</Link>
                    </Button>
                </div>
            </AppShell>
        );
    }

    return (
        <AppShell background="muted" padded>
            <div className="mb-6">
                <div className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100">
                    <div className="h-32 bg-gradient-to-r from-brand/10 to-sky-50 relative">
                        <div className="absolute -bottom-12 left-8">
                            <div className="h-24 w-24 rounded-2xl bg-white p-2 shadow-md border border-gray-100 flex items-center justify-center">
                                {organization.logo_url ? (
                                    <img
                                        src={organization.logo_url}
                                        alt={organization.org_name}
                                        className="h-full w-full object-contain"
                                    />
                                ) : (
                                    <Building2 className="h-10 w-10 text-gray-300" />
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="pt-16 pb-8 px-8">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                    {organization.org_name}
                                    {organization.verified_status === 'verified' && (
                                        <CheckCircle2 className="h-5 w-5 text-brand" />
                                    )}
                                    {organization.verified_status === 'pending' && (
                                        <Badge variant="warning" className="ml-2">Pending Verification</Badge>
                                    )}
                                </h1>
                                <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Building2 className="h-4 w-4 text-gray-400" />
                                        <span className="capitalize">{organization.org_type?.replace('_', ' ')}</span>
                                    </div>
                                    {(organization.city || organization.country) && (
                                        <div className="flex items-center gap-1">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            <span>{[organization.city, organization.state, organization.country].filter(Boolean).join(', ')}</span>
                                        </div>
                                    )}
                                    {organization.website_url && (
                                        <div className="flex items-center gap-1">
                                            <Globe className="h-4 w-4 text-gray-400" />
                                            <a href={organization.website_url} target="_blank" rel="noreferrer" className="text-brand hover:underline">
                                                Website
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-2 flex-col items-end">
                                {userRole === 'employer' && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => navigate('/employer/organization')}
                                        className="mb-2"
                                        icon={<Edit className="h-4 w-4" />}
                                    >
                                        Edit Profile
                                    </Button>
                                )}
                                {userRole === 'admin' && organization.verified_status === 'pending' && (
                                    <div className="flex gap-2 mb-2 p-2 bg-yellow-50 rounded-lg border border-yellow-100">
                                        <Button
                                            size="sm"
                                            className="bg-green-600 hover:bg-green-700 text-white"
                                            onClick={() => handleVerification('verified')}
                                        >
                                            Approve
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                            onClick={() => handleVerification('rejected')}
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                                {userRole === 'admin' && organization.verified_status === 'verified' && (
                                    <div className="flex gap-2 mb-2 p-2 rounded-lg border border-green-100">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="text-amber-600 border-amber-200 hover:bg-amber-50"
                                            onClick={() => handleVerification('pending')}
                                        >
                                            Unverify
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 px-8 py-3 bg-gray-50/50 flex gap-6">
                        <button
                            onClick={() => setActiveTab('jobs')}
                            className={`text-sm font-semibold pb-1 border-b-2 transition ${activeTab === 'jobs' ? 'text-brand border-brand' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                            Open Roles <Badge variant="outline" className="ml-1 text-xs">{jobs.length}</Badge>
                        </button>
                        <button
                            onClick={() => setActiveTab('about')}
                            className={`text-sm font-semibold pb-1 border-b-2 transition ${activeTab === 'about' ? 'text-brand border-brand' : 'text-gray-500 border-transparent hover:text-gray-700'}`}
                        >
                            About
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-[1fr,300px]">
                <div className="space-y-4">
                    {activeTab === 'jobs' ? (
                        <div className="space-y-4">
                            {jobs.length === 0 ? (
                                <div className="rounded-2xl bg-white p-8 text-center border border-dashed border-gray-200 text-gray-500">
                                    No active job openings at the moment.
                                </div>
                            ) : (
                                jobs.map(job => (
                                    <JobCard
                                        key={job.id}
                                        job={job}
                                        onDelete={handleDeleteJob}
                                        hasApplied={appliedJobIds.has(job.id)}
                                        onApply={() => navigate(`/jobs/${job.id}`)}
                                        canEdit={userRole === 'employer' && user?.id === organization.owner_user_id}
                                    />
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">About {organization.org_name}</h3>
                            <div className="prose prose-sm max-w-none text-gray-600">
                                {organization.description ? (
                                    <p className="whitespace-pre-wrap">{organization.description}</p>
                                ) : (
                                    <p className="italic text-gray-400">No description provided.</p>
                                )}
                            </div>

                            <div className="mt-8 border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Location</h4>
                                <div className="grid gap-1 text-sm text-gray-600">
                                    <p>{organization.address_line1}</p>
                                    {organization.address_line2 && <p>{organization.address_line2}</p>}
                                    <p>
                                        {[organization.postcode, organization.city].filter(Boolean).join(' ')}
                                    </p>
                                    <p>
                                        {[organization.state, organization.country].filter(Boolean).join(', ')}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4">
                    {/* Sidebar content if needed, currently empty or reused logic */}
                    <div className="rounded-2xl bg-white p-6 border border-gray-100 shadow-sm sticky top-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">Company Overview</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">Type</span>
                                <span className="font-medium text-gray-900 capitalize">{organization.org_type?.replace('_', ' ')}</span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">Verified</span>
                                <span className={`font-medium ${organization.verified_status === 'verified' ? 'text-green-600' : 'text-gray-500'}`}>
                                    {organization.verified_status === 'verified' ? 'Yes' : 'Pending'}
                                </span>
                            </div>
                            <div className="flex justify-between py-2 border-b border-gray-50">
                                <span className="text-gray-500">Location</span>
                                <span className="font-medium text-gray-900">{organization.city || '-'}</span>
                            </div>
                            <div className="flex justify-between py-2">
                                <span className="text-gray-500">Member since</span>
                                <span className="font-medium text-gray-900">{new Date(organization.created_at).getFullYear()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Toast
                open={toast.open}
                onClose={() => setToast(prev => ({ ...prev, open: false }))}
                title={toast.title}
                variant={toast.variant}
            />
        </AppShell>
    );
}
