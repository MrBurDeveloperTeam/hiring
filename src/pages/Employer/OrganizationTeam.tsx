import { useEffect, useState } from 'react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Toast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';
import { getOrganizationMembers, inviteMemberToOrganization, removeMember, OrganizationMember } from '../../lib/api/organization_members';
import { getOrganization, getUsersOrganizations } from '../../lib/api/organizations';
import { ArrowLeft, Plus, Trash2, UserPlus, Users, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Copy, Share2, MessageCircle, Mail } from 'lucide-react';
import { createInviteLink } from '../../lib/api/organization_members';

const sidebarLinks = [
    { to: '/employer/dashboard', label: 'Overview' },
    { to: '/employer/post-job', label: 'Post job' },
    { to: '/employer/applicants', label: 'Applicants' },
    { to: '/employer/team', label: 'Team' },
    { to: '/employer/organization', label: 'Organization Profile' },
    { to: '/jobs', label: 'Job board' }
];

export default function OrganizationTeam() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [members, setMembers] = useState<OrganizationMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [inviteValues, setInviteValues] = useState({ email: '', role: 'hr' as const });
    const [isInviting, setIsInviting] = useState(false);
    const [showInviteForm, setShowInviteForm] = useState(false);
    const [org, setOrg] = useState<any>(null);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

    // Invite Link State
    const [showLinkModal, setShowLinkModal] = useState(false);
    const [linkExpiration, setLinkExpiration] = useState(7); // Default 7 days
    const [generatedLink, setGeneratedLink] = useState<string | null>(null);
    const [isGeneratingLink, setIsGeneratingLink] = useState(false);

    const showToast = (message: string, variant: 'success' | 'error' = 'success') => {
        setToastMessage(message);
        setToastVariant(variant);
        setToastOpen(true);
    };

    // Initial load: fetch org then members.
    // NOTE: In the future, we should pass the CURRENT org ID from context or dashboard state if switching is enabled.
    // For now, we fetch the owner's org.
    useEffect(() => {
        if (!user) return;

        async function init() {
            setLoading(true);
            try {
                // Fetch Org (Support both Owner and Member)
                const orgs = await getUsersOrganizations(user!.id);

                if (!orgs || orgs.length === 0) {
                    // No org found
                    setLoading(false);
                    return;
                }

                // Since we enforce single org, take the first one
                const orgData = orgs[0];
                setOrg(orgData);

                // Fetch Members
                const membersData = await getOrganizationMembers(orgData.id);
                console.log('Fetched Members Data Full:', JSON.stringify(membersData, null, 2));
                setMembers(membersData || []);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [user?.id]);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!org) return;
        setIsInviting(true);
        setError(null);

        try {
            await inviteMemberToOrganization(org.id, inviteValues.email, inviteValues.role);
            // Refresh list
            const updatedMembers = await getOrganizationMembers(org.id);
            setMembers(updatedMembers || []);
            setInviteValues({ email: '', role: 'hr' });
            setShowInviteForm(false);
            showToast(`Invitation sent to ${inviteValues.email}`);
        } catch (err: any) {
            setError(err.message);
            showToast(err.message, 'error');
        } finally {
            setIsInviting(false);
        }
    };

    const handleRemove = async (id: string) => {
        if (!window.confirm("Are you sure you want to remove this member?")) return;
        try {
            await removeMember(id);
            setMembers(prev => prev.filter(m => m.id !== id));
            showToast('Member removed successfully');
        } catch (err: any) {
            showToast("Failed to remove member: " + err.message, 'error');
        }
    };

    const handleGenerateLink = async () => {
        if (!org) return;
        setIsGeneratingLink(true);
        try {
            const data = await createInviteLink(org.id, 'hr', linkExpiration);
            const link = `${window.location.origin}/join?token=${data.token}`;
            setGeneratedLink(link);
            showToast('Link generated successfully!');
        } catch (err: any) {
            showToast(err.message, 'error');
        } finally {
            setIsGeneratingLink(false);
        }
    };

    const copyToClipboard = () => {
        if (generatedLink) {
            navigator.clipboard.writeText(generatedLink);
            showToast('Link copied to clipboard');
        }
    };

    if (loading) {
        return (
            <DashboardShell sidebarLinks={sidebarLinks} title="Team Management" subtitle="Loading..." hideNavigation>
                <div className="flex justify-center p-12">Loading...</div>
            </DashboardShell>
        );
    }

    if (!org) {
        return (
            <DashboardShell sidebarLinks={sidebarLinks} title="Team Management" subtitle="Manage your team">
                <div className="p-8 text-center bg-white rounded-xl border border-gray-100 shadow-sm">
                    <p className="text-gray-500 mb-4">No active organization profile found.</p>
                    <Button variant="primary" asChild><Link to="/employer/profile">Create Profile</Link></Button>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            sidebarLinks={[]}
            title="Team Management"
            subtitle={`Manage members for ${org.org_name}`}
            hideNavigation
        >
            <div className="space-y-6">

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-700 text-sm rounded-lg flex items-center gap-2">
                        <span className="font-bold">Error:</span> {error}
                    </div>
                )}

                {/* Invite Section */}
                {showInviteForm && (
                    <div className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">Invite new member</h3>
                                <p className="text-sm text-gray-500">Send an invitation to a colleague.</p>
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => setShowInviteForm(false)}><X className="h-4 w-4" /></Button>
                        </div>
                        <form onSubmit={handleInvite} className="flex flex-col gap-4 max-w-md">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                                    placeholder="colleague@example.com"
                                    value={inviteValues.email}
                                    onChange={e => setInviteValues({ ...inviteValues, email: e.target.value })}
                                />
                                <p className="text-xs text-gray-500 mt-1">User must have an existing employer account.</p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <Button type="button" variant="ghost" onClick={() => setShowInviteForm(false)}>Cancel</Button>
                                <Button type="submit" variant="primary" disabled={isInviting}>
                                    {isInviting ? 'Sending...' : 'Send Invitation'}
                                </Button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Invite Link Modal */}
                {showLinkModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Invite via Link</h3>
                                <button onClick={() => { setShowLinkModal(false); setGeneratedLink(null); }} className="text-gray-400 hover:text-gray-600">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-6 space-y-4">
                                {!generatedLink ? (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Link Expiration</label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[1, 3, 7].map(days => (
                                                    <button
                                                        key={days}
                                                        onClick={() => setLinkExpiration(days)}
                                                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition-colors ${linkExpiration === days
                                                            ? 'bg-brand/10 border-brand text-brand'
                                                            : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                                                            }`}
                                                    >
                                                        {days} Day{days > 1 ? 's' : ''}
                                                    </button>
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Links expire automatically for security.</p>
                                        </div>
                                        <Button
                                            variant="primary"
                                            className="w-full"
                                            onClick={handleGenerateLink}
                                            disabled={isGeneratingLink}
                                        >
                                            {isGeneratingLink ? 'Generating...' : 'Generate Link'}
                                        </Button>
                                    </>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 break-all text-sm text-gray-600 font-mono">
                                            <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="text-brand hover:underline">
                                                {generatedLink}
                                            </a>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <Button variant="outline" onClick={copyToClipboard} className="w-full gap-2">
                                                <Copy className="h-4 w-4" /> Copy Link
                                            </Button>
                                            <div className="grid grid-cols-2 gap-2">
                                                <a
                                                    href={`https://wa.me/?text=${encodeURIComponent(`Join my team on Mr. Bur: ${generatedLink}`)}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#25D366] text-white font-medium text-sm hover:brightness-95 transition"
                                                >
                                                    <MessageCircle className="h-4 w-4" /> WhatsApp
                                                </a>
                                                <a
                                                    href={`mailto:?subject=Join my team&body=${encodeURIComponent(`Click here to join: ${generatedLink}`)}`}
                                                    className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-gray-100 text-gray-700 font-medium text-sm hover:bg-gray-200 transition"
                                                >
                                                    <Mail className="h-4 w-4" /> Email
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3">
                    <Button variant="outline" onClick={() => setShowLinkModal(true)} icon={<Share2 className="h-4 w-4" />}>
                        Invite via Link
                    </Button>
                    <Button variant="primary" onClick={() => setShowInviteForm(true)} icon={<UserPlus className="h-4 w-4" />}>
                        Invite via Email
                    </Button>
                </div>

                {/* Members List */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            Current Members
                            <Badge variant="outline" className="ml-2">{members.length}</Badge>
                        </h3>
                    </div>

                    {members.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                            <p>No other members in this team yet.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {members.map(member => (
                                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-brand-light flex items-center justify-center text-brand font-bold text-sm">
                                            {member.profile?.name?.charAt(0) || member.invited_email?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">
                                                {member.profile?.name || 'Pending User'}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {member.invited_email || member.profile?.email || 'Email not found'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <Badge variant={member.status === 'active' ? 'success' : 'warning'}>
                                            {member.status}
                                        </Badge>
                                        <span className="text-sm text-gray-500 capitalize">{member.member_role}</span>
                                        {/* Don't allow removing yourself (owner check needed properly, but simplistic check here) */}
                                        {member.user_id !== user?.id && (
                                            <button
                                                onClick={() => handleRemove(member.id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                                title="Remove member"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>


            <Toast
                open={toastOpen}
                onClose={() => setToastOpen(false)}
                title={toastVariant === 'success' ? 'Success' : 'Error'}
                description={toastMessage}
                variant={toastVariant === 'success' ? 'success' : 'error'}
            />
        </DashboardShell>
    );
}
