import { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../../components/ui/card';
import { acceptInvitation } from '../../lib/api/organization_members';
import { Building2, X } from 'lucide-react';
import { Toast } from '../../components/ui/toast';

interface AcceptInviteProps {
    org: any; // Using any for now to match strict usage, ideally typed
    onAccept: () => void;
    onClose: () => void;
}

export default function AcceptInvite({ org, onAccept, onClose }: AcceptInviteProps) {
    const [loading, setLoading] = useState(false);
    const [toastOpen, setToastOpen] = useState(false);
    const [toastState, setToastState] = useState<{ title: string; description: string; variant: 'success' | 'error' }>({
        title: '',
        description: '',
        variant: 'success'
    });

    const showToast = (title: string, description: string, variant: 'success' | 'error') => {
        setToastState({ title, description, variant });
        setToastOpen(true);
    };

    const handleAccept = async () => {
        setLoading(true);
        try {
            await acceptInvitation(org.member_record_id);
            showToast("Invitation Accepted", `You are now a member of ${org.org_name}.`, "success");
            // Delay onAccept to let toast show? Or just call it.
            // If we call onAccept immediately, the component might unmount.
            // Let's delay slightly or depend on parent to handle transition (layout reload).
            setTimeout(() => {
                onAccept();
            }, 1000);
        } catch (error: any) {
            showToast("Error", error.message || "Failed to accept invitation.", "error");
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-lg relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Close invitation and return to dashboard"
                >
                    <X className="h-5 w-5" />
                </button>

                <CardHeader className="text-center flex flex-col items-center pb-2">
                    {org.logo_url ? (
                        <img src={org.logo_url} alt={org.org_name} className="h-24 w-auto max-w-full object-contain mb-4 p-4" />
                    ) : (
                        <div className="h-16 w-16 bg-brand/10 rounded-full flex items-center justify-center mb-4">
                            <Building2 className="h-8 w-8 text-brand" />
                        </div>
                    )}
                    <CardTitle className="text-2xl font-bold">You're Invited!</CardTitle>
                    <CardDescription className="text-lg mt-2">
                        You have been invited to join <span className="font-semibold text-gray-900">{org.org_name}</span>
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 text-center">
                    <p className="text-gray-600">
                        Join the team to start collaborating on job postings and candidate management.
                    </p>
                    <div className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium capitalize">
                        Role: {org.member_role.replace('_', ' ')}
                    </div>
                </CardContent>

                <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button
                        className="w-full"
                        variant="primary"
                        onClick={handleAccept}
                        disabled={loading}
                    >
                        {loading ? 'Joining...' : 'Accept Invitation'}
                    </Button>
                </CardFooter>
            </Card>

            <Toast
                open={toastOpen}
                onClose={() => setToastOpen(false)}
                title={toastState.title}
                description={toastState.description}
                variant={toastState.variant === 'error' ? 'error' : 'success'}
            />
        </div>
    );
}
