import type { Database } from '../database.types';
import type { Resume } from '../types';
import { workerGet, workerPost, workerUpload } from './apiClient';

export async function uploadResumeFile(file: File, userId: string): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('userId', userId);

    const result = await workerUpload('/api/documents/upload', formData);
    return (result as any).data?.filePath || '';
}

export async function createDocument(
    document: Database['public']['Tables']['seeker_documents']['Insert']
): Promise<Database['public']['Tables']['seeker_documents']['Row']> {
    const result = await workerPost('/api/documents', document);
    return result.data;
}

export async function getUserDocuments(userId: string): Promise<Resume[]> {
    const result = await workerGet(`/api/documents?userId=${userId}`);
    const data = result.data || [];

    return data.map((doc: any) => ({
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
    try {
        const result = await workerGet(`/api/seekers/${userId}`);
        return result.data?.profile || null;
    } catch {
        console.error('Error fetching profile via worker');
        return null;
    }
}

export async function getSeekerProfile(userId: string): Promise<Database['public']['Tables']['seeker_profiles']['Row'] | null> {
    try {
        const result = await workerGet(`/api/seekers/${userId}`);
        return result.data?.seekerProfile || null;
    } catch {
        console.error('Error fetching seeker profile via worker');
        return null;
    }
}
