import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Select } from '../../components/ui/select';
import { Toast } from '../../components/ui/toast';
import { useAuth } from '../../contexts/AuthContext';
import { getOrganization, updateOrganization, createOrganization, getUsersOrganizations, leaveOrganization, requestVerification } from '../../lib/api/organizations';
import { Database } from '../../lib/database.types';
import { Tabs } from '../../components/ui/tabs';
import { supabase } from '../../lib/supabase';
import { Breadcrumbs } from '../../components/Breadcrumbs';

const sidebarLinks = [
    { to: '/employer/dashboard', label: 'Overview' },
    { to: '/employer/post-job', label: 'Post job' },
    { to: '/employer/applicants', label: 'Applicants' },
    { to: '/employer/team', label: 'Team' },
    { to: '/employer/organization', label: 'Organization Profile' },
    { to: '/jobs', label: 'Job board' }
];

import { Badge } from '../../components/ui/badge';

type OrgType = Database['public']['Enums']['org_type'];
type VerifiedStatus = Database['public']['Enums']['verified_status'];

export default function OrganizationProfile() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [orgId, setOrgId] = useState<string | null>(null);
    const [logoFile, setLogoFile] = useState<File | null>(null);
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState('profile');

    // Form State
    const [orgName, setOrgName] = useState('');
    const [orgType, setOrgType] = useState<OrgType>('clinic');
    const [verifiedStatus, setVerifiedStatus] = useState<VerifiedStatus>('unverified');
    const [description, setDescription] = useState('');
    const [websiteUrl, setWebsiteUrl] = useState('');

    // Address State
    const [address1, setAddress1] = useState('');
    const [address2, setAddress2] = useState('');
    const [city, setCity] = useState('');
    const [state, setState] = useState('');
    const [postcode, setPostcode] = useState('');
    const [country, setCountry] = useState('Malaysia');

    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const [canEdit, setCanEdit] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        async function loadData() {
            if (!user) return;
            try {
                const orgs: any[] = await getUsersOrganizations(user.id);
                if (orgs && orgs.length > 0) {
                    const org = orgs[0];
                    setOrgId(org.id);
                    setOrgName(org.org_name);
                    setOrgType(org.org_type);
                    setVerifiedStatus(org.verified_status);
                    setDescription(org.description || '');
                    setWebsiteUrl(org.website_url || '');
                    setWebsiteUrl(org.website_url || '');

                    // Split address column into address1 and address2
                    const rawAddress = org.address || '';
                    const addressParts = rawAddress.split('\n');
                    setAddress1(addressParts[0] || '');
                    setAddress2(addressParts[1] || '');

                    setCity(org.city || '');
                    setState(org.state || '');
                    setPostcode(org.postcode || '');
                    setCountry(org.country || 'Malaysia');
                    setLogoPreview(org.logo_url || null);

                    // Check permissions
                    // Admin or Owner can edit
                    const isOwner = org.membership_type === 'owner' || org.member_role === 'owner';
                    const isAdmin = org.member_role === 'admin';
                    setCanEdit(isOwner || isAdmin);
                } else {
                    // No organization found
                    setOrgId(null);
                    setCanEdit(true); // Allow editing if creating new
                }
            } catch (error) {
                console.error('Error loading organization:', error);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [user]);

    const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (file.size > 5 * 1024 * 1024) { // 5MB limit
                setToastMessage('Image size must be less than 5MB');
                setToastOpen(true);
                return;
            }
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleRequestVerification = async () => {
        if (!orgId) return;
        try {
            setSaving(true);
            await requestVerification(orgId);
            setVerifiedStatus('pending');
            setToastMessage('Verification requested successfully');
            setToastOpen(true);
        } catch (error) {
            console.error('Error requesting verification:', error);
            setToastMessage('Failed to request verification');
            setToastOpen(true);
        } finally {
            setSaving(false);
        }
    };

    const handleSubmit = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            let logoUrl = logoPreview;

            // Upload Logo if new file selected
            if (logoFile) {
                const fileExt = logoFile.name.split('.').pop();
                const fileName = `logos/${user.id}-${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('organizations')
                    .upload(fileName, logoFile, {
                        upsert: true
                    });

                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('organizations')
                    .getPublicUrl(fileName);

                logoUrl = publicUrl;
            }

            const orgData = {
                org_name: orgName,
                org_type: orgType,
                description,
                website_url: websiteUrl,
                address: [address1, address2].filter(Boolean).join('\n'), // Combine address lines
                city,
                state,
                postcode,
                country,
                logo_url: logoUrl
            };

            if (orgId) {
                if (!canEdit) {
                    setToastMessage('You do not have permission to edit this organization.');
                    setToastOpen(true);
                    return;
                }
                await updateOrganization(orgId, orgData);
            } else {
                const newOrg = await createOrganization({
                    owner_user_id: user.id,
                    ...orgData
                });
                setOrgId(newOrg.id);
                // Refresh permissions to owner after creation
                setCanEdit(true);
            }

            setToastMessage('Organization profile saved successfully');
            setToastOpen(true);
        } catch (error) {
            console.error('Error saving profile:', error);
            setToastMessage('Failed to save profile');
            setToastOpen(true);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardShell sidebarLinks={sidebarLinks} title="Organization Profile" subtitle="Loading..." hideNavigation>
                <div className="flex h-64 items-center justify-center">Loading...</div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            sidebarLinks={sidebarLinks}
            title="Organization Profile"
            subtitle="Manage your clinic or organization details."
            hideNavigation
        >
            {/* <Breadcrumbs items={[{ label: 'Employer Home', to: '/employers' }, { label: 'Organization Profile' }]} /> */}

            {/* <Tabs
                tabs={[
                    { id: 'profile', label: 'Organization Details' }
                ]}
                active={activeTab}
                onChange={setActiveTab}
            /> */}

            {activeTab === 'profile' && (
                <>
                    {!orgId && !isCreating ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
                            <div
                                className="mx-auto mb-4 flex h-48 w-full max-w-md items-center justify-center rounded-lg bg-blue-50 relative group cursor-pointer overflow-hidden border-2 border-dashed border-blue-200 hover:border-blue-500 transition-all"
                                onClick={() => canEdit && document.getElementById('logo-upload')?.click()}
                            >
                                {logoPreview ? (
                                    <img
                                        src={logoPreview}
                                        alt="Organization Logo"
                                        className="h-full w-full object-contain p-1"
                                    />
                                ) : (
                                    <Building2 className="h-10 w-10 text-blue-600" />
                                )}

                                {canEdit && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <span className="text-white text-xs font-medium">Change</span>
                                    </div>
                                )}
                            </div>
                            <input
                                type="file"
                                id="logo-upload"
                                hidden
                                accept="image/*"
                                onChange={handleLogoChange}
                                disabled={!canEdit}
                            />
                            <h2 className="mb-2 text-xl font-semibold text-gray-900">No Organization Found</h2>
                            <p className="mb-6 text-gray-500 max-w-md mx-auto">
                                You haven't created or joined an organization yet. Create a new organization profile or join an existing team.
                            </p>
                            <div className="flex justify-center gap-4">
                                <Button variant="primary" onClick={() => setIsCreating(true)}>
                                    Create Organization
                                </Button>
                                <Button variant="outline" asChild>
                                    <Link to="/employer/dashboard">Join Existing Team</Link>
                                </Button>
                            </div>
                            <p className="mt-4 text-xs text-gray-400">
                                To join a team, ask an administrator to send you an invite link.
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-6">
                            {!canEdit && (
                                <div className="bg-yellow-50 text-yellow-800 p-4 rounded-lg text-sm border border-yellow-100 mb-4">
                                    <span className="font-semibold">View Only:</span> You need to be an Admin or Owner to edit organization details.
                                </div>
                            )}

                            <div className="flex flex-col items-center mb-6">
                                <div
                                    className="relative group h-48 w-full max-w-md rounded-lg overflow-hidden bg-blue-50 border-2 border-dashed border-blue-200 flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                                    onClick={() => canEdit && document.getElementById('logo-upload-edit')?.click()}
                                >
                                    {logoPreview ? (
                                        <img
                                            src={logoPreview}
                                            alt="Organization Logo"
                                            className="h-full w-full object-contain p-1"
                                        />
                                    ) : (
                                        <Building2 className="h-10 w-10 text-blue-400" />
                                    )}

                                    {canEdit && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-white text-xs font-medium">Change</span>
                                        </div>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    id="logo-upload-edit"
                                    hidden
                                    accept="image/*"
                                    onChange={handleLogoChange}
                                    disabled={!canEdit}
                                />
                                <p className="mt-2 text-xs text-gray-500">Click to upload logo (max 5MB)</p>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <Input
                                    label="Organization Name"
                                    value={orgName}
                                    onChange={(e) => setOrgName(e.target.value)}
                                    required
                                    placeholder="e.g. Happy Teeth Dental"
                                    disabled={!canEdit}
                                />
                                {orgId && (
                                    <div className="flex items-center justify-between bg-gray-50 px-4 py-2 rounded-lg border border-gray-100 h-[42px] mt-6">
                                        <div className="flex items-center gap-3">
                                            <span className="text-sm font-medium text-gray-700">Verification Status:</span>
                                            {verifiedStatus === 'verified' && <Badge variant="success">Verified</Badge>}
                                            {verifiedStatus === 'pending' && <Badge variant="warning">Pending Verification</Badge>}
                                            {verifiedStatus === 'rejected' && <Badge variant="danger">Rejected</Badge>}
                                            {verifiedStatus === 'unverified' && <Badge variant="outline">Unverified</Badge>}
                                        </div>
                                        {canEdit && (verifiedStatus === 'unverified' || verifiedStatus === 'rejected') && (
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={handleRequestVerification}
                                                disabled={saving}
                                            >
                                                Request Verification
                                            </Button>
                                        )}
                                    </div>
                                )}
                                <Select
                                    label="Organization Type"
                                    value={orgType}
                                    onChange={(e) => setOrgType(e.target.value as OrgType)}
                                    disabled={!canEdit}
                                >
                                    <option value="clinic">Dental Clinic</option>
                                    <option value="lab">Dental Lab</option>
                                    <option value="dental_group">Dental Group</option>
                                    <option value="supplier">Supplier</option>
                                    <option value="other">Other</option>
                                </Select>

                                <Input
                                    label="Website URL"
                                    value={websiteUrl}
                                    onChange={(e) => setWebsiteUrl(e.target.value)}
                                    placeholder="https://example.com"
                                    disabled={!canEdit}
                                />
                                <div className="md:col-span-2">
                                    <Textarea
                                        label="About the Organization"
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="Tell candidates about your practice, culture, and values..."
                                        rows={4}
                                        disabled={!canEdit}
                                    />
                                </div>

                                <div className="md:col-span-2 pt-2 border-t border-gray-100 mt-2">
                                    <h3 className="text-sm font-semibold text-gray-800 mb-4">Location</h3>
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Address Line 1"
                                                value={address1}
                                                onChange={(e) => setAddress1(e.target.value)}
                                                placeholder="Street address"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <Input
                                                label="Address Line 2"
                                                value={address2}
                                                onChange={(e) => setAddress2(e.target.value)}
                                                placeholder="Suite, unit, building, etc. (optional)"
                                                disabled={!canEdit}
                                            />
                                        </div>
                                        <Input
                                            label="City"
                                            value={city}
                                            onChange={(e) => setCity(e.target.value)}
                                            placeholder="e.g. Kuala Lumpur"
                                            disabled={!canEdit}
                                        />
                                        <Input
                                            label="State"
                                            value={state}
                                            onChange={(e) => setState(e.target.value)}
                                            placeholder="e.g. Selangor"
                                            disabled={!canEdit}
                                        />
                                        <Input
                                            label="Postcode"
                                            value={postcode}
                                            onChange={(e) => setPostcode(e.target.value)}
                                            placeholder="e.g. 50000"
                                            disabled={!canEdit}
                                        />
                                        <Select
                                            label="Country"
                                            value={country}
                                            onChange={(e) => setCountry(e.target.value)}
                                            disabled={!canEdit}
                                        >
                                            <option value="Malaysia">Malaysia</option>
                                            <option value="Singapore">Singapore</option>
                                        </Select>
                                    </div>
                                </div>

                                <div className="md:col-span-2 flex justify-end items-center gap-2 mt-6 pt-4 border-t border-gray-100">
                                    {isCreating && (
                                        <Button variant="ghost" onClick={() => setIsCreating(false)}>
                                            Cancel
                                        </Button>
                                    )}
                                    {canEdit && (
                                        <Button variant="primary" onClick={() => handleSubmit()} disabled={saving}>
                                            {saving ? 'Saving...' : 'Save Profile'}
                                        </Button>
                                    )}

                                    {/* Leave Button */}
                                    {!isCreating && orgId && (
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                                            onClick={async () => {
                                                if (confirm('Are you sure you want to leave this organization?')) {
                                                    try {
                                                        setSaving(true);
                                                        await leaveOrganization(user.id, orgId);
                                                        window.location.reload();
                                                    } catch (err: any) {
                                                        setToastMessage(err.message || 'Failed to leave organization');
                                                        setToastOpen(true);
                                                        setSaving(false);
                                                    }
                                                }
                                            }}
                                            disabled={saving}
                                        >
                                            Leave Organization
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {activeTab === 'settings' && (
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm min-h-[200px] flex items-center justify-center">
                    <p className="text-gray-500">Account settings coming soon.</p>
                </div>
            )}

            <Toast
                open={toastOpen}
                onClose={() => setToastOpen(false)}
                title={toastMessage.includes('success') ? 'Success' : 'Error'}
                description={toastMessage}
                variant={toastMessage.includes('success') ? 'success' : 'error'}
            />
        </DashboardShell>
    );
}
