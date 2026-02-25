import { createContext, useContext, useEffect, useState, useMemo, useCallback, ReactNode } from 'react';
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
        if (user?.id && userRole) {
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
    }, [user?.id, userRole]);

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

    const loadConversations = useCallback(async () => {
        if (!user || !userRole) return;
        setLoading(true);
        const data = await getConversations(user.id, userRole as 'seeker' | 'employer');
        setConversations(data);
        setLoading(false);
    }, [user?.id, userRole]);

    const loadMessages = useCallback(async (conversationId: string) => {
        setMessagesLoading(true);
        const data = await getMessages(conversationId);
        setMessages(data);
        setMessagesLoading(false);
    }, []);

    const setActiveConversationId = useCallback((id: string | null) => {
        if (!id) {
            setActiveConversation(null);
            return;
        }
        setConversations((currentConversations) => {
            const conv = currentConversations.find((c) => c.id === id);
            if (conv) {
                setActiveConversation(conv);
            }
            return currentConversations;
        });
    }, []);

    const sendMessage = useCallback(async (content: string, file?: File) => {
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
    }, [activeConversation, user?.id]);

    const deleteMessage = useCallback(async (messageId: string) => {
        if (!user) return;

        const success = await apiDeleteMessage(messageId, user.id);
        if (success) {
            // Remove message from state
            setMessages((prev) => prev.filter(m => m.id !== messageId));
        }
    }, [user?.id]);

    const openChat = useCallback(async (orgId: string, seekerId: string, jobId?: string) => {
        // Check local list first
        // We need to use functional update or ref to get latest conversations if we don't want to depend on confirm
        // But for openChat, depending on conversations is usually fine as it's not called often
        // However, to be safe inside useMemo, we should probably rely on state setter or a ref?
        // Let's just use the current conversations state as dependency, it changes every 10s anyway.
        // Actually that defeats the purpose.
        // Let's use getConversations from API if we want to be safe, but we want to avoid API call if possible.
        // Let's check `conversations` in dependency.

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
    }, [conversations]);

    // Calculate total unread count
    const unreadTotal = conversations.reduce((acc, curr) => acc + (curr.unreadCount || 0), 0);

    const value = useMemo(() => ({
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
    }), [
        conversations,
        activeConversation,
        messages,
        loading,
        messagesLoading,
        unreadTotal,
        loadConversations,
        setActiveConversationId,
        sendMessage,
        deleteMessage,
        openChat
    ]);

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
    const context = useContext(ChatContext);
    if (context === undefined) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
}
