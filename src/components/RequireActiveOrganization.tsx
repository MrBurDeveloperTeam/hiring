import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getUsersOrganizations } from '../lib/api/organizations';
import AcceptInvite from '../pages/Employer/AcceptInvite';
import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RequireActiveOrganizationProps {
    children: ReactNode;
}

export function RequireActiveOrganization({ children }: RequireActiveOrganizationProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [activeOrg, setActiveOrg] = useState<any>(null);
    const [checking, setChecking] = useState(true); // Extra state to prevent flicker
    const navigate = useNavigate();

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        async function checkOrgStatus() {
            // setLoading(true); // Don't reset loading on every check to avoid UI flash
            try {
                const orgs = await getUsersOrganizations(user!.id);
                const storedOrgId = localStorage.getItem('activeOrgId');

                let current = null;
                // Debug logs
                console.log("RequireActiveOrganization check:", { orgs, storedOrgId });

                if (storedOrgId && orgs) {
                    current = orgs.find(o => o.id === storedOrgId);
                }

                // If no stored org but we have orgs, typically dashboard picks first. 
                // But here we want to ensure if we ARE accessing an org context, it is checked.
                // If the App architecture relies on EmployerDashboard to pick the default, this wrapper might be too early 
                // UNLESS we enforce "Active Org" concept globally.
                // For now, let's sync with what EmployerDashboard does: picks stored or first.

                if (!current && orgs && orgs.length > 0) {
                    current = orgs[0];
                    // Do NOT auto-set localStorage here to avoid side effects if not intended, 
                    // but for "Require" context it makes sense to validate *some* org.
                }


                // Block access if status is NOT active or owner
                // This catches 'invited', 'pending', 'suspended', etc.
                if (current &&
                    current.member_status !== 'active' &&
                    current.member_status !== 'owner' &&
                    // Ensure we don't block if status is missing (legacy safety), though it should be there.
                    // If missing, we assume active? Or block? Let's check if it exists.
                    current.member_status
                ) {

                    setActiveOrg(current);
                } else {
                    setActiveOrg(null);
                }

            } catch (err) {
                console.error("Error checking org status", err);
            } finally {
                setLoading(false);
                setChecking(false);
            }
        }

        checkOrgStatus();
    }, [user, navigate]); // Add dependency on storage event if we want cross-tab sync, but simple for now

    const handleAccept = () => {
        // Reload to refresh full state/context
        window.location.reload();
    };

    const handleClose = () => {
        // Clear active org to "unselect" it (simulating ignore)
        localStorage.removeItem('activeOrgId');
        // Reload or redirect to clear state
        window.location.reload();
    };

    if (loading || checking) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-50">
                <Loader2 className="h-8 w-8 animate-spin text-brand" />
            </div>
        );
    }

    if (activeOrg) {
        return <AcceptInvite org={activeOrg} onAccept={handleAccept} onClose={handleClose} />;
    }

    return <>{children}</>;
}
