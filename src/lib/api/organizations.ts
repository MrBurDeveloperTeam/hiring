import { supabase } from '../supabase';
import { Database } from '../database.types';

type OrganizationRow = Database['public']['Tables']['organizations']['Row'];

export async function createOrganization(data: any) {
    // Enforce Single Org Limit
    const existingOrgs = await getUsersOrganizations(data.owner_user_id);
    if (existingOrgs && existingOrgs.length > 0) {
        throw new Error("You are already a member or owner of an organization. You cannot create another one.");
    }

    const { data: org, error } = await supabase.from('organizations').insert(data).select().single();
    if (error) throw error;
    return org;
}

export async function getOrganization(userId: string) {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_user_id', userId)
        .single();

    if (error) return null; // Return null if no org found (e.g. new user)
    return data;
}

export async function updateOrganization(orgId: string, updates: any) {
    const { data, error } = await supabase
        .from('organizations')
        .update(updates)
        .eq('id', orgId)
        .select()
        .single();

    if (error) throw error;
    return data;
}

// Fetch all organizations a user belongs to (Owned + Member)
export async function getUsersOrganizations(userId: string) {
    // 1. Fetch Owned Orgs
    const { data: ownedOrgs, error: ownedError } = await supabase
        .from('organizations')
        .select('*')
        .eq('owner_user_id', userId);

    if (ownedError) throw ownedError;

    // 2. Fetch Member Orgs
    const { data: memberOrgsData, error: memberError } = await supabase
        .from('organization_members')
        .select(`
            *,
            organization:organizations(*)
        `)
        .eq('user_id', userId);

    if (memberError) throw memberError;

    // Combine them
    const result = [
        ...(ownedOrgs || []).map(org => ({ ...org, membership_type: 'owner', member_status: 'active', member_role: 'owner' })),
        ...(memberOrgsData || []).map(m => ({ ...m.organization, membership_type: 'member', member_status: m.status, member_record_id: m.id, member_role: m.member_role }))
    ];

    // Filter out potential duplicates if logic creates any (shouldn't if owner doesn't add self as member)
    // Also handling typescript mapping could be cleaner, but 'any' is sufficient for the dashboard logic for now.
    return result;
}


export async function leaveOrganization(userId: string, orgId: string) {
    // 1. Check if owner
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('owner_user_id')
        .eq('id', orgId)
        .single();

    if (orgError) throw orgError;

    if (org.owner_user_id === userId) {
        throw new Error("Owners cannot leave their organization. You must delete the organization or transfer ownership.");
    }

    // 2. Delete from organization_members
    const { error: deleteError } = await supabase
        .from('organization_members')
        .delete()
        .eq('org_id', orgId)
        .eq('user_id', userId);

    if (deleteError) throw deleteError;
}

export async function requestVerification(orgId: string) {
    const { error } = await supabase
        .from('organizations')
        .update({ verified_status: 'pending' })
        .eq('id', orgId);

    if (error) throw error;
}

export async function getPendingOrganizations() {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('verified_status', 'pending');

    if (error) throw error;
    return data;
}

export async function getAllOrganizations() {
    const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
}

export async function updateVerificationStatus(orgId: string, status: 'verified' | 'rejected' | 'pending') {
    const { error } = await supabase
        .from('organizations')
        .update({ verified_status: status })
        .eq('id', orgId);

    if (error) throw error;
}
