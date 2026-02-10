import { workerGet, workerPost, workerPut } from './apiClient';
import { supabase } from '../supabase';
import { Database } from '../database.types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

export async function createOrganization(data: any) {
    const result = await workerPost('/api/organizations', data);
    return result.data;
}

export async function getOrganization(userId: string) {
    // Use /me endpoint — returns all orgs user owns or is member of
    const result = await workerGet('/api/organizations/me');
    const orgs = result.data || [];
    // Filter to find the one owned by this user
    const owned = orgs.find((org: any) => org.membership_type === 'owner');
    return owned || null;
}

export async function updateOrganization(orgId: string, updates: any) {
    const result = await workerPut(`/api/organizations/${orgId}`, updates);
    return result.data;
}

// Fetch all organizations a user belongs to (Owned + Member)
export async function getUsersOrganizations(_userId: string) {
    const result = await workerGet('/api/organizations/me');
    return result.data || [];
}

export async function leaveOrganization(_userId: string, orgId: string) {
    await workerPost(`/api/organizations/${orgId}/leave`);
}

export async function requestVerification(orgId: string) {
    await workerPost(`/api/organizations/${orgId}/request-verification`);
}

export async function getPendingOrganizations() {
    // Worker doesn't have a filtered endpoint for pending orgs
    // Fetch all and filter client-side
    const result = await workerGet('/api/organizations');
    const all = result.data || [];
    return all.filter((org: any) => org.verified_status === 'pending');
}

export async function getAllOrganizations() {
    const result = await workerGet('/api/organizations');
    return result.data || [];
}

export async function updateVerificationStatus(orgId: string, status: 'verified' | 'rejected' | 'pending') {
    await workerPut(`/api/organizations/${orgId}/verification/${orgId}`, { status });
}
