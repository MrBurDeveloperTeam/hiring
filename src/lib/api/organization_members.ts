import { workerGet, workerPost, workerPut, workerDelete } from './apiClient';
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
    const result = await workerGet(`/api/organizations/${orgId}/members`);
    return result.data || [];
}

export async function inviteMemberToOrganization(orgId: string, email: string, role: OrgMemberRole = 'hr') {
    const result = await workerPost(`/api/organizations/${orgId}/invite`, { email, role });
    return result.data;
}

export async function removeMember(memberId: string) {
    await workerDelete(`/api/organizations/members/${memberId}`);
}

export async function updateMemberRole(memberId: string, newRole: OrgMemberRole) {
    await workerPut(`/api/organizations/members/${memberId}`, { role: newRole });
}

export async function acceptInvitation(memberId: string) {
    await workerPost(`/api/organizations/members/${memberId}/accept`);
}

// Invite Link API

export async function createInviteLink(orgId: string, role: OrgMemberRole, expiresInDays: number) {
    const result = await workerPost(`/api/organizations/${orgId}/invite-link`, { role, expiresInDays });
    return result.data;
}

export async function getInviteDetails(token: string) {
    const result = await workerGet(`/api/organizations/invites/${token}`);
    return result.data || null;
}

export async function acceptInviteLink(token: string) {
    const result = await workerPost(`/api/organizations/invites/${token}/accept`);
    return result.data;
}

export async function resolveShortCode(code: string) {
    const result = await workerGet(`/api/organizations/invites/short/${code}`);
    return result.data || null;
}
