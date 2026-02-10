import { supabase } from '../supabase';
import { env } from '../env';

/**
 * Shared HTTP client for calling the Cloudflare Worker API.
 * Automatically attaches the Supabase session access token as a Bearer token.
 */

const WORKER_URL = env.workerUrl.replace(/\/$/, '');

async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ?? null;
}

export interface WorkerResponse<T = any> {
    ok: boolean;
    data?: T;
    job?: T;
    error?: string;
}

export async function workerFetch<T = any>(
    path: string,
    options: RequestInit = {}
): Promise<WorkerResponse<T>> {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const url = `${WORKER_URL}${path}`;

    const res = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...(options.headers || {}),
        },
    });

    if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage: string;
        try {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.error || `Worker error ${res.status}`;
        } catch {
            errorMessage = errorBody || `Worker error ${res.status}`;
        }
        throw new Error(errorMessage);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : { ok: true };
}

/**
 * Shorthand for GET requests
 */
export function workerGet<T = any>(path: string): Promise<WorkerResponse<T>> {
    return workerFetch<T>(path, { method: 'GET' });
}

/**
 * Shorthand for POST requests
 */
export function workerPost<T = any>(path: string, body?: any): Promise<WorkerResponse<T>> {
    return workerFetch<T>(path, {
        method: 'POST',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * Shorthand for PUT requests
 */
export function workerPut<T = any>(path: string, body?: any): Promise<WorkerResponse<T>> {
    return workerFetch<T>(path, {
        method: 'PUT',
        body: body ? JSON.stringify(body) : undefined,
    });
}

/**
 * Shorthand for DELETE requests
 */
export function workerDelete<T = any>(path: string): Promise<WorkerResponse<T>> {
    return workerFetch<T>(path, { method: 'DELETE' });
}

/**
 * Shorthand for file upload (FormData) requests.
 * Does NOT set Content-Type — browser sets multipart/form-data with boundary.
 */
export async function workerUpload<T = any>(path: string, formData: FormData): Promise<WorkerResponse<T>> {
    const token = await getAccessToken();
    if (!token) {
        throw new Error('Not authenticated');
    }

    const url = `${WORKER_URL}${path}`;

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        body: formData,
    });

    if (!res.ok) {
        const errorBody = await res.text();
        let errorMessage: string;
        try {
            const parsed = JSON.parse(errorBody);
            errorMessage = parsed.error || `Worker error ${res.status}`;
        } catch {
            errorMessage = errorBody || `Worker error ${res.status}`;
        }
        throw new Error(errorMessage);
    }

    const text = await res.text();
    return text ? JSON.parse(text) : { ok: true };
}
