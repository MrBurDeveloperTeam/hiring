import { supabase } from '../supabase';
import type { Database } from '../database.types';
import type { Resume } from '../types';

export async function uploadResumeFile(file: File, userId: string): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error } = await supabase.storage
        .from('resumes')
        .upload(filePath, file);

    if (error) {
        throw error;
    }

    return filePath;
}

export async function createDocument(
    document: Database['public']['Tables']['seeker_documents']['Insert']
): Promise<Database['public']['Tables']['seeker_documents']['Row']> {
    const { data, error } = await supabase
        .from('seeker_documents')
        .insert(document)
        .select()
        .single();

    if (error) {
        throw error;
    }

    return data;
}

export async function getUserDocuments(userId: string): Promise<Resume[]> {
    const { data, error } = await supabase
        .from('seeker_documents')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching documents:', error);
        return [];
    }

    return data.map((doc) => ({
        id: doc.id,
        name: doc.title,
        uploadedAt: doc.created_at,
        category: doc.doc_type === 'resume' ? 'Resume' :
            doc.doc_type === 'certificate' ? 'Certificate' : 'Other',
        url: doc.storage_path,
        isDefault: doc.is_default,
    }));
}

export async function getProfile(userId: string): Promise<Database['public']['Tables']['profiles']['Row'] | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return null;
    }

    return data;
}

export async function getSeekerProfile(userId: string): Promise<Database['public']['Tables']['seeker_profiles']['Row'] | null> {
    const { data, error } = await supabase
        .from('seeker_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        console.error('Error fetching seeker profile:', error);
        return null;
    }

    return data;
}
