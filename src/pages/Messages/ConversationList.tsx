import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { cn } from '../../lib/utils';
import { Search } from 'lucide-react';
import { useState } from 'react';

export default function ConversationList() {
    const { userRole, user } = useAuth();
    const { conversations, activeConversation, setActiveConversationId, loading } = useChat();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredConversations = conversations.filter((c) => {
        const name = userRole === 'seeker' ? c.organization?.org_name : c.seeker?.name;
        return name?.toLowerCase().includes(searchTerm.toLowerCase());
    });

    if (loading && conversations.length === 0) {
        return <div className="p-4 text-center text-gray-500">Loading chats...</div>;
    }

    return (
        <div className="flex h-full flex-col border-r border-gray-200 bg-white">
            <div className="p-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900 mb-3">Messages</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {filteredConversations.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">
                        No conversations found.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filteredConversations.map((conv) => {
                            const isActive = activeConversation?.id === conv.id;
                            const name = userRole === 'seeker' ? conv.organization?.org_name : conv.seeker?.name;
                            const avatar = userRole === 'seeker' ? conv.organization?.logo_url : conv.seeker?.avatar_url;
                            const subtitle = conv.job?.title || 'General Inquiry';
                            const lastMsg = conv.lastMessage?.content || 'Started a conversation';

                            return (
                                <button
                                    key={conv.id}
                                    onClick={() => setActiveConversationId(conv.id)}
                                    className={cn(
                                        "flex w-full items-start gap-3 p-4 text-left transition hover:bg-gray-50",
                                        isActive && "bg-brand/5 hover:bg-brand/10"
                                    )}
                                >
                                    <div className="relative h-10 w-10 flex-shrink-0">
                                        {avatar ? (
                                            <img
                                                src={avatar}
                                                alt={name}
                                                className="h-full w-full rounded-lg object-contain border border-gray-100 bg-white p-0.5"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center rounded-lg bg-gray-100 text-gray-500 font-semibold border border-gray-200">
                                                {name?.[0]?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between mb-0.5">
                                            <span className={cn("font-medium truncate text-base", isActive ? "text-brand" : "text-gray-900")}>
                                                {name || 'Unknown User'}
                                            </span>
                                            <div className="flex items-center gap-2 ml-2">
                                                {conv.lastMessageAt && (
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">
                                                        {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                                                    </span>
                                                )}
                                                {(conv.unreadCount || 0) > 0 && (
                                                    <span className="flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {conv.job?.title && (
                                            <p className="text-sm text-brand/80 font-medium truncate mb-0.5">
                                                {conv.job.title}
                                            </p>
                                        )}
                                        <p className="truncate text-sm text-gray-500 line-clamp-1">
                                            {conv.lastMessage?.senderId === user?.id && 'You: '}
                                            {lastMsg}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
