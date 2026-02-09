
import { useState, useEffect } from 'react';
import { DashboardShell } from '../../layouts/DashboardShell';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Toast } from '../../components/ui/toast';
import { Modal } from '../../components/ui/modal';

import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Breadcrumbs } from '../../components/Breadcrumbs';

export default function EmployerProfile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const handleConfirmSignOut = async () => {
        await signOut();
        navigate('/');
    };

    // User Profile API not fully established, so we'll likely fetch from 'profiles' or 'auth.users' metadata?
    // Usually standard pattern is a 'profiles' table.
    // Standard pattern is a 'profiles' table.

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    useEffect(() => {
        if (!user) return;
        setEmail(user.email || '');

        async function loadProfile() {
            try {
                // Fetch from PUBLIC 'profiles' table if it exists and RLS allows.
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('user_id', user!.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error loading profile:", error);
                }

                if (data) {
                    setName(data.name || '');
                    setPhone(data.phone || '');
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadProfile();
    }, [user, supabase]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const updates = {
                user_id: user.id,
                name: name,
                phone: phone,
                email: user.email!, // Required by schema
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);
            if (error) throw error;

            setToastMessage("Profile updated successfully");
            setToastOpen(true);
        } catch (error: any) {
            console.error(error);
            setToastMessage("Failed to update profile: " + error.message);
            setToastOpen(true);
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <DashboardShell
            sidebarLinks={[]}
            title="Account Profile"
            subtitle="Manage your personal account settings"
            hideNavigation
        >
            {/* <Breadcrumbs items={[{ label: 'Employer Home', to: '/employers' }, { label: 'Account Profile' }]} /> */}

            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-6">
                <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                        <Input
                            label="Email Address"
                            value={email}
                            disabled
                            className="bg-gray-50 text-gray-500"
                        />
                    </div>
                    <Input
                        label="Full Name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your full name"
                    />
                    <Input
                        label="Phone Number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+60..."
                    />

                    <div className="md:col-span-2 flex justify-end items-center gap-2 pt-4 border-t border-gray-100 mt-2">
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setShowSignOutConfirm(true)}
                        >
                            Sign Out
                        </Button>
                    </div>
                </form>
            </div>

            <Toast
                open={toastOpen}
                onClose={() => setToastOpen(false)}
                title={toastMessage.includes('Success') ? 'Success' : 'Notification'}
                description={toastMessage}
                variant={toastMessage.includes('Failed') ? 'error' : 'success'}
            />

            <Modal
                open={showSignOutConfirm}
                onClose={() => setShowSignOutConfirm(false)}
                title="Sign Out Assessment"
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-gray-600">Are you sure you want to sign out of your account?</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="ghost" onClick={() => setShowSignOutConfirm(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleConfirmSignOut}
                            className="bg-red-600 hover:bg-red-700 border-red-600 from-red-600 to-red-700"
                        >
                            Sign Out
                        </Button>
                    </div>
                </div>
            </Modal>
        </DashboardShell>
    );
}
