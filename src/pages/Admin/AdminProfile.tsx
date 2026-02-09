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
import { User2 } from 'lucide-react';

export default function AdminProfile() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);

    const handleConfirmSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');

    const [toastOpen, setToastOpen] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success');

    useEffect(() => {
        if (!user) return;
        setEmail(user.email || '');

        async function loadProfile() {
            try {
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
    }, [user]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setSaving(true);

        try {
            const updates = {
                user_id: user.id,
                name: name,
                phone: phone,
                email: user.email!,
                updated_at: new Date().toISOString(),
            };

            const { error } = await supabase.from('profiles').upsert(updates as any);
            if (error) throw error;

            setToastMessage("Profile updated successfully");
            setToastVariant('success');
            setToastOpen(true);
        } catch (error: any) {
            console.error(error);
            setToastMessage("Failed to update profile: " + error.message);
            setToastVariant('error');
            setToastOpen(true);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <DashboardShell
                sidebarLinks={[]}
                title="Admin Profile"
                hideNavigation
            >
                <div className="flex h-64 items-center justify-center">
                    <p className="text-gray-500">Loading...</p>
                </div>
            </DashboardShell>
        );
    }

    return (
        <DashboardShell
            sidebarLinks={[]}
            title="Admin Profile"
            subtitle="Manage your admin account settings"
            hideNavigation
        >
            {/* <Breadcrumbs items={[{ label: 'Admin', to: '/admin' }, { label: 'Profile' }]} /> */}

            <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
                {/* Profile Header */}
                <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-md">
                        <User2 className="h-8 w-8" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900">{name || 'System Admin'}</h2>
                        <p className="text-sm text-gray-500">{email}</p>
                    </div>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Input
                                label="Email Address"
                                value={email}
                                disabled
                                className="bg-gray-50 text-gray-500"
                            />
                            <p className="mt-1 text-xs text-gray-400">Email address cannot be changed</p>
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
                    </div>

                    <div className="flex justify-end items-center gap-3 pt-4 border-t border-gray-100">
                        <Button
                            type="button"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={() => setShowSignOutConfirm(true)}
                        >
                            Sign Out
                        </Button>
                        <Button type="submit" variant="primary" disabled={saving}>
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </div>
                </form>
            </div>

            <Toast
                open={toastOpen}
                onClose={() => setToastOpen(false)}
                title={toastVariant === 'success' ? 'Success' : 'Error'}
                description={toastMessage}
                variant={toastVariant}
            />

            <Modal
                open={showSignOutConfirm}
                onClose={() => setShowSignOutConfirm(false)}
                title="Sign Out"
                maxWidth="max-w-sm"
            >
                <div className="flex flex-col gap-4">
                    <p className="text-gray-600">Are you sure you want to sign out of your admin account?</p>
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
