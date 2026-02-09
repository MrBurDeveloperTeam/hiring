import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { DashboardShell } from '../../layouts/DashboardShell';

import ConversationList from './ConversationList';
import ChatWindow from './ChatWindow';
import { cn } from '../../lib/utils';

export default function MessagesPage() {
    const { userRole, user } = useAuth();
    const { openChat, activeConversation } = useChat();
    const [searchParams] = useSearchParams();
    const orgId = searchParams.get('orgId');
    const seekerId = searchParams.get('seekerId');
    const jobId = searchParams.get('jobId');

    // Handle deep linking/query params
    useEffect(() => {
        if (orgId && user) {
            const targetSeekerId = userRole === 'seeker' ? user.id : (seekerId as string);
            const targetOrgId = userRole === 'employer' ? orgId : (orgId as string);

            // If I am employer, I must have seekerId to open chat
            if (userRole === 'employer' && !seekerId) return;

            // If I am seeker, I need orgId.
            // Wait, params are usually passed for "Start Chat".
            if (userRole === 'seeker') {
                openChat(orgId, user.id, jobId || undefined);
            } else if (userRole === 'employer' && seekerId) {
                // Employer viewing candidate
                openChat(orgId, seekerId, jobId || undefined);
            }
        }
    }, [orgId, seekerId, jobId, userRole, user?.id]);

    // Use default sidebar links depending on role, typically managed by shell, but we can override or just pass empty if we want custom look.
    // However, DashboardShell usually handles navigation.
    // The user requested previously to hide navigation for employers in MessagePage.



    return (
        // Main Messages Layout 
        <DashboardShell title="" sidebarLinks={[]} hideNavigation padded={false}>
            <div className="fixed inset-x-0 bottom-0 top-[74px] bg-white border-t border-gray-200">
                <div className="container mx-auto h-full max-w-7xl px-4">
                    <div className="grid h-full grid-cols-1 overflow-hidden bg-white border-x border-gray-200 shadow-sm md:grid-cols-12">
                        {/* Sidebar - Hidden on mobile if chat is active */}
                        <div className={cn(
                            "h-full border-r border-gray-200 md:col-span-4 lg:col-span-3",
                            activeConversation ? "hidden md:block" : "block"
                        )}>
                            <ConversationList />
                        </div>

                        {/* Chat Window - Hidden on mobile if no chat is active */}
                        <div className={cn(
                            "h-full overflow-hidden md:col-span-8 lg:col-span-9",
                            activeConversation ? "block" : "hidden md:block"
                        )}>
                            <ChatWindow />
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    );
}
