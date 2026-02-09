import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { Conversation, Message } from '../lib/types';
import {
    getConversations,
    getMessages,
    sendMessage as apiSendMessage,
    getOrCreateConversation,
    subscribeToMessages,
    markMessagesAsRead,
    deleteMessage as apiDeleteMessage
} from '../lib/api/chat';
import { RealtimeChannel } from '@supabase/supabase-js';

interface ChatContextType {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    loading: boolean;
    messagesLoading: boolean;
    loadConversations: () => Promise<void>;
    setActiveConversationId: (id: string | null) => void;
    sendMessage: (content: string, file?: File) => Promise<void>;
    deleteMessage: (messageId: string) => Promise<void>;
    openChat: (orgId: string, seekerId: string, jobId?: string) => Promise<void>;
    unreadTotal: number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
    const { user, userRole } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [messagesLoading, setMessagesLoading] = useState(false);
    const [subscription, setSubscription] = useState<RealtimeChannel | null>(null);

    // Load conversations on mount or user change
    useEffect(() => {
        if (user && userRole) {
            loadConversations();

            // Poll for new conversations/messages every 15 seconds to keep unread counts fresh
            const interval = setInterval(() => {
                // Silent refresh (don't set loading)
                getConversations(user.id, userRole as 'seeker' | 'employer').then(data => {
                    // Merge/Update logic could be smarter, but replacing is safest for sync
                    // We just update the list.
                    setConversations(data);
                });
            }, 10000);

            return () => clearInterval(interval);
        } else {
            setConversations([]);
            setActiveConversation(null);
        }
    }, [user, userRole]);

    // Load messages when active conversation changes
    useEffect(() => {
        if (activeConversation && user) {
            loadMessages(activeConversation.id);

            // Mark as read immediately when opening
            if ((activeConversation.unreadCount || 0) > 0) {
                markMessagesAsRead(activeConversation.id, user.id);
                // Optimistically update local state
                setConversations(prev => prev.map(c =>
                    c.id === activeConversation.id ? { ...c, unreadCount: 0 } : c
                ));
            }

            // Subscribe to new messages
            if (subscription) subscription.unsubscribe();

            const sub = subscribeToMessages(activeConversation.id, (payload) => {
                const newMessage = payload.new as any; // Cast to avoid TS issues with generic payload

                // Transform to our Message type matches DB exactly usually, but let's be safe
                const transformedMsg: Message = {
                    id: newMessage.id,
                    conversationId: newMessage.conversation_id,
                    senderId: newMessage.sender_id,
                    content: newMessage.content,
                    createdAt: newMessage.created_at,
                    readAt: newMessage.read_at
                };

                setMessages((prev) => [...prev, transformedMsg]);

                // Also update the conversation list lastMessage
                // If the message is from the other person AND we are in the conversation, mark it as read?
                // For simplicity, if we are active, we assume it's read or will be read.
                if (newMessage.sender_id !== user.id) {
                    markMessagesAsRead(activeConversation.id, user.id);
                }

                setConversations((prev) =>
                    prev.map(c =>
                        c.id === newMessage.conversation_id
                            ? { ...c, lastMessage: transformedMsg, lastMessageAt: newMessage.created_at, unreadCount: 0 }
                            : c
                    ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
                );
            });
            setSubscription(sub);

            return () => {
                sub.unsubscribe();
            };
        } else {
            setMessages([]);
            if (subscription) subscription.unsubscribe();
            setSubscription(null);
        }
    }, [activeConversation?.id]);

    async function loadConversations() {
        if (!user || !userRole) return;
        setLoading(true);
        const data = await getConversations(user.id, userRole as 'seeker' | 'employer');
        setConversations(data);
        setLoading(false);
    }

    async function loadMessages(conversationId: string) {
        setMessagesLoading(true);
        const data = await getMessages(conversationId);
        setMessages(data);
        setMessagesLoading(false);
    }

    function setActiveConversationId(id: string | null) {
        if (!id) {
            setActiveConversation(null);
            return;
        }
        const conv = conversations.find((c) => c.id === id);
        if (conv) {
            setActiveConversation(conv);
        }
    }

    async function sendMessage(content: string, file?: File) {
        if (!activeConversation || !user) return;

        // Optimistic update? Or wait? Let's wait for now to keep it simple and consistent
        const msg = await apiSendMessage(activeConversation.id, user.id, content, file);
        if (msg) {
            setMessages((prev) => {
                if (prev.some((m) => m.id === msg.id)) return prev;
                return [...prev, msg];
            });

            setConversations((prev) =>
                prev.map(c =>
                    c.id === activeConversation.id
                        ? { ...c, lastMessage: msg, lastMessageAt: msg.createdAt, unreadCount: 0 }
                        : c
                ).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime())
            );
        }
    }

    async function deleteMessage(messageId: string) {
        if (!user) return;

        const success = await apiDeleteMessage(messageId, user.id);
        if (success) {
            // Remove message from state
            setMessages((prev) => prev.filter(m => m.id !== messageId));
        }
    }

    async function openChat(orgId: string, seekerId: string, jobId?: string) {
        // Check local list first
        const existing = conversations.find(c => c.orgId === orgId && c.seekerId === seekerId);
        if (existing) {
            setActiveConversation(existing);
            return;
        }

        // specific API call to get or create
        setLoading(true);
        const conv = await getOrCreateConversation(orgId, seekerId, jobId);
        if (conv) {
            setConversations(prev => {
                // Ensure no duplicates
                const filtered = prev.filter(c => c.id !== conv.id);
                return [conv, ...filtered];
            });
            setActiveConversation(conv);
        }
        setLoading(false);
    }

    // Calculate total unread count
    const unreadTotal = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

    const value = {
        conversations,
        activeConversation,
        messages,
        loading,
        messagesLoading,
        loadConversations,
        setActiveConversationId,
        sendMessage,
        deleteMessage,
        openChat,
        unreadTotal
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
