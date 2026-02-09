import { supabase } from '../supabase';
import { Conversation, Message } from '../types';
import { Database } from '../database.types';

type DbConversation = Database['public']['Tables']['conversations']['Row'];
type DbMessage = Database['public']['Tables']['messages']['Row'];

export async function getConversations(userId: string, role: 'seeker' | 'employer' | 'admin'): Promise<Conversation[]> {
    try {
        let query = supabase.from('conversations').select(`
      *,
      organizations:org_id (
        org_name,
        logo_url
      ),
      seeker:seeker_id (
        name,
        avatar_url
      ),
      job:job_id (
        title
      )
    `);

        const { data, error } = await query.order('last_message_at', { ascending: false });

        if (error) throw error;

        // Fetch last message for each conversation
        const conversationsWithLastMessage = await Promise.all(
            (data || []).map(async (conv) => {
                const { data: messages } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conv.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                // Fetch unread count
                const { count: unreadCount } = await supabase
                    .from('messages')
                    .select('*', { count: 'exact', head: true })
                    .eq('conversation_id', conv.id)
                    .is('read_at', null)
                    .neq('sender_id', userId);

                return {
                    id: conv.id,
                    orgId: conv.org_id,
                    seekerId: conv.seeker_id,
                    jobId: conv.job_id,
                    createdAt: conv.created_at,
                    lastMessageAt: conv.last_message_at,
                    organization: conv.organizations as any,
                    seeker: conv.seeker as any,
                    job: conv.job as any,
                    lastMessage: messages ? {
                        id: messages.id,
                        conversationId: messages.conversation_id,
                        senderId: messages.sender_id,
                        content: messages.content,
                        createdAt: messages.created_at,
                        readAt: messages.read_at,
                        attachmentUrl: messages.attachment_url,
                        attachmentName: messages.attachment_name,
                        attachmentSize: messages.attachment_size
                    } : undefined,
                    unreadCount: unreadCount || 0
                } as Conversation;
            })
        );

        return conversationsWithLastMessage;
    } catch (error) {
        console.error('Error fetching conversations:', error);
        return [];
    }
}

export async function getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        return [];
    }

    return data.map((msg: DbMessage) => ({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.content,
        createdAt: msg.created_at,
        readAt: msg.read_at,
        attachmentUrl: msg.attachment_url,
        attachmentName: msg.attachment_name,
        attachmentSize: msg.attachment_size
    }));
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

    // Upload file if provided
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

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(fileName);

        attachmentUrl = publicUrl;
        attachmentName = file.name;
        attachmentSize = file.size;
    }

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content: content,
            attachment_url: attachmentUrl,
            attachment_name: attachmentName,
            attachment_size: attachmentSize
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    // Update conversation last_message_at
    await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

    return {
        id: data.id,
        conversationId: data.conversation_id,
        senderId: data.sender_id,
        content: data.content,
        createdAt: data.created_at,
        readAt: data.read_at,
        attachmentUrl: data.attachment_url,
        attachmentName: data.attachment_name,
        attachmentSize: data.attachment_size
    };
}

export async function getOrCreateConversation(orgId: string, seekerId: string, jobId?: string): Promise<Conversation | null> {
    // First, check if exists
    const { data: existing, error: fetchError } = await supabase
        .from('conversations')
        .select('id')
        .eq('org_id', orgId)
        .eq('seeker_id', seekerId)
        .maybeSingle();

    if (fetchError) {
        console.error('Error checking conversation:', fetchError);
        return null;
    }

    if (existing) {
        return fetchConversationById(existing.id);
    }

    // Create new
    const { data: newConv, error: createError } = await supabase
        .from('conversations')
        .insert({
            org_id: orgId,
            seeker_id: seekerId,
            job_id: jobId || null
        })
        .select()
        .single();

    if (createError) {
        console.error('Error creating conversation:', createError);
        return null;
    }

    return fetchConversationById(newConv.id);
}

async function fetchConversationById(id: string): Promise<Conversation | null> {
    const { data, error } = await supabase
        .from('conversations')
        .select(`
      *,
      organizations:org_id (
        org_name,
        logo_url
      ),
      seeker:seeker_id (
        name,
        avatar_url
      ),
       job:job_id (
        title
      )
    `)
        .eq('id', id)
        .single();

    if (error || !data) return null;

    return {
        id: data.id,
        orgId: data.org_id,
        seekerId: data.seeker_id,
        jobId: data.job_id,
        createdAt: data.created_at,
        lastMessageAt: data.last_message_at,
        organization: data.organizations as any,
        seeker: data.seeker as any,
        job: data.job as any
    } as Conversation;
}

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

export async function markMessagesAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('conversation_id', conversationId)
        .is('read_at', null)
        .neq('sender_id', userId);

    if (error) {
        console.error('Error marking messages as read:', error);
    }
}

export async function deleteMessage(messageId: string, userId: string): Promise<boolean> {
    // First verify the user owns this message
    const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('sender_id, attachment_url')
        .eq('id', messageId)
        .single();

    if (fetchError || !message) {
        console.error('Error fetching message:', fetchError);
        return false;
    }

    if (message.sender_id !== userId) {
        console.error('User does not own this message');
        return false;
    }

    // Delete attachment from storage if exists
    if (message.attachment_url) {
        try {
            const urlParts = message.attachment_url.split('/');
            const fileName = urlParts.slice(-2).join('/'); // Get conversationId/filename
            await supabase.storage
                .from('chat-attachments')
                .remove([fileName]);
        } catch (error) {
            console.error('Error deleting attachment:', error);
            // Continue with message deletion even if file deletion fails
        }
    }

    // Delete the message
    const { error: deleteError } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId);

    if (deleteError) {
        console.error('Error deleting message:', deleteError);
        return false;
    }

    return true;
}
