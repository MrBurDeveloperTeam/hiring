import { workerGet, workerPost, workerPatch } from './apiClient';

export interface AdminStats {
    totalJobs: number;
    jobsThisWeek: number;
    totalSeekers: number;
    totalEmployers: number;
}

export async function getAdminStats(): Promise<AdminStats> {
    const result = await workerGet('/api/admin/stats');
    if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch admin stats');
    }
    return result.data;
}

export interface PlatformNote {
    id: string;
    content: string;
    is_done: boolean;
    created_at: string;
    created_by: string;
    profiles?: {
        name: string;
    };
}

export async function getPlatformNotes(): Promise<PlatformNote[]> {
    const result = await workerGet('/api/admin/notes');
    if (!result.ok) {
        throw new Error(result.error || 'Failed to fetch platform notes');
    }
    return result.data || [];
}

export async function createPlatformNote(content: string): Promise<PlatformNote> {
    const result = await workerPost('/api/admin/notes', { content });
    if (!result.ok) {
        throw new Error(result.error || 'Failed to save note');
    }
    return result.data;
}

export async function togglePlatformNote(noteId: string, isDone: boolean): Promise<PlatformNote> {
    const result = await workerPatch(`/api/admin/notes/${noteId}`, { is_done: isDone });
    if (!result.ok) {
        throw new Error(result.error || 'Failed to update note');
    }
    return result.data;
}

