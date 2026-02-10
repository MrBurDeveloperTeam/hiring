import { supabase } from '../supabase';
import { workerGet, workerPost, workerDelete as workerDel } from './apiClient';
import { Conversation, Message } from '../types';
import { Database } from '../database.types';

type DbMessage = Database['public']['Tables']['messages']['Row'];

function mapMessage(msg: any): Message {
    return {
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        createdAt: msg.created_at,
        readAt: msg.read_at,
        attachmentUrl: msg.attachment_url,
        attachmentName: msg.attachment_name,
        attachmentSize: msg.attachment_size,
    };
}

export async function getConversations(userId: string, role: 'seeker' | 'employer' | 'admin'): Promise<Conversation[]> {
    try {
        const result = await workerGet(`/api/chat/conversations`);
        return (result.data || []) as Conversation[];
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
    try {
        const result = await workerGet(`/api/chat/conversations/${conversationId}/messages`);
        return (result.data || []).map(mapMessage);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return [];
    }
}

export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    file?: File
): Promise<Message | null> {
    let attachmentUrl: string | null = null;
    let attachmentName: string | null = null;
    let attachmentSize: number | null = null;

    // Upload file using direct Supabase Storage (can't proxy binary uploads through Worker)
    if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${conversationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('chat-attachments')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (uploadError) {
            console.error('Error uploading file:', uploadError);
            throw new Error('Failed to upload file');
        }

        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
        attachmentName = file.name;
        attachmentSize = file.size;
    }

    // Send message via Worker
    try {
        const result = await workerPost(`/api/chat/conversations/${conversationId}/messages`, {
            senderId,
            content,
            attachmentUrl,
            attachmentName,
            attachmentSize,
        });

        return result.data ? mapMessage(result.data) : null;
    } catch (error) {
        console.error('Error sending message:', error);
        return null;
    }
}

export async function getOrCreateConversation(orgId: string, seekerId: string, jobId?: string): Promise<Conversation | null> {
    try {
        const result = await workerPost('/api/chat/conversations', {
            orgId,
            seekerId,
            jobId: jobId || null,
        });

        return result.data as Conversation || null;
    } catch (error) {
        console.error('Error getting/creating conversation:', error);
        return null;
    }
}

// Realtime subscriptions MUST use direct Supabase client (WebSocket, not HTTP)
export function subscribeToMessages(conversationId: string, callback: (payload: any) => void) {
    return supabase
        .channel(`chat:${conversationId}`)
        .on(
            'postgres_changes',
            {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            },
            callback
        )
        .subscribe();
}

export async function markMessagesAsRead(conversationId: string, _userId: string) {
    try {
        await workerPost(`/api/chat/conversations/${conversationId}/read`);
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
}

export async function deleteMessage(messageId: string, _userId: string): Promise<boolean> {
    try {
        await workerDel(`/api/chat/messages/${messageId}`);
        return true;
    } catch (error) {
        console.error('Error deleting message:', error);
        return false;
    }
}
