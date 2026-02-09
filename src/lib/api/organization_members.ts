import { supabase } from '../supabase';
import { Database } from '../database.types';

type OrgMemberRole = Database['public']['Enums']['org_member_role'];
type MemberStatus = Database['public']['Enums']['member_status'];

export interface OrganizationMember {
    id: string;
    org_id: string;
    user_id: string;
    member_role: OrgMemberRole;
    status: MemberStatus;
    invited_email: string | null;
    created_at: string;
    profile?: {
        name: string | null;
        email: string | null;
    };
}

export async function getOrganizationMembers(orgId: string) {
    const { data, error } = await supabase
        .from('organization_members')
        .select(`
      *,
      profile:profiles!organization_members_user_id_fkey(
        name,
        email
      )
    `)
        .eq('org_id', orgId);

    if (error) throw error;
    return data;
}

export async function inviteMemberToOrganization(orgId: string, email: string, role: OrgMemberRole = 'hr') {
    // 1. Check if user exists (Attempt to look up by email in user_aliases or profiles?)
    // Note: user_aliases might be restricted. If so, we might need a workaround or just insert 'invited_email'.
    // For now, we'll try to insert with 'invited_email' and 'status=invited'.
    // We also try to see if we can resolve the user_id immediately to link them.

    // Try to find user by email (Assuming we have a way, or just insert raw for now)
    // Since we don't have a direct "getUserIdByEmail" RPC exposed yet, we will:
    // - Insert with invited_email and a placeholder user_id?
    // - Wait, user_id is NOT NULL in schema?
    // Let's check schema constraints.
    // schema: user_id is string. It might be a foreign key to profiles.id.

    // CRITICAL: If user_id is NOT NULL, we MUST resolve the user ID before inserting.
    // This implies we MUST be able to look up a user ID by email.

    // Strategy: Try to query user_aliases. If RLS blocks it, we are stuck without an RPC.
    // Let's assume for this implementation that we can query user_aliases OR we change the schema to allow nullable user_id (not possible via client).
    // OR: We rely on the user ALREADY existing and we can find them.

    const { data: aliasData, error: aliasError } = await supabase
        .from('user_aliases')
        .select('user_id')
        .eq('email', email)
        .single();

    if (aliasError || !aliasData) {
        throw new Error('User not found. Please ensure the user has an existing employer account with this email.');
    }

    // 2. Check if already a member
    const { data: existing, error: checkError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('org_id', orgId)
        .eq('user_id', aliasData.user_id)
        .single();

    if (existing) {
        throw new Error('User is already a member of this organization.');
    }

    // 3. Insert membership
    const { data, error } = await supabase
        .from('organization_members')
        .insert({
            org_id: orgId,
            user_id: aliasData.user_id,
            member_role: role,
            status: 'invited',
            invited_email: email
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function removeMember(memberId: string) {
    const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId);

    if (error) throw error;
}

export async function updateMemberRole(memberId: string, newRole: OrgMemberRole) {
    const { error } = await supabase
        .from('organization_members')
        .update({ member_role: newRole })
        .eq('id', memberId);

    if (error) throw error;
}

export async function acceptInvitation(memberId: string) {
    const { error } = await supabase
        .from('organization_members')
        .update({ status: 'active' })
        .eq('id', memberId);

    if (error) throw error;
}

// Invite Link API

export async function createInviteLink(orgId: string, role: OrgMemberRole, expiresInDays: number) {
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    const { data, error } = await supabase
        .from('organization_invites')
        .insert({
            org_id: orgId,
            role,
            expires_at: expiresAt.toISOString(),
            // max_uses: null // Default unlimited
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function getInviteDetails(token: string) {
    const { data, error } = await supabase
        .rpc('get_invite_details', { invite_token: token });

    if (error) throw error;
    // RPC returns a table, likely an array. We expect one result.
    return data && data.length > 0 ? data[0] : null;
}

export async function acceptInviteLink(token: string) {
    const { data, error } = await supabase
        .rpc('accept_invite', { invite_token: token });

    if (error) throw error;
    return data;
}
